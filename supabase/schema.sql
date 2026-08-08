-- Run this once in the Supabase SQL editor for a fresh project.
-- Idempotent: safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE where possible).

create extension if not exists pgcrypto;

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(6), 'hex'), -- short & shareable over WhatsApp
  name text not null,
  whatsapp_number text not null,
  invited_by text check (invited_by in ('novio', 'novia', 'padres_novio', 'padres_novia')), -- which side invited this guest; null = not yet assigned
  guest_location text check (guest_location in ('local', 'extranjero')), -- local vs. traveling from abroad; null = not yet assigned, treated as local
  party_size_allowed int not null default 1 check (party_size_allowed >= 1), -- total people allowed, including the named guest
  invite_sent boolean not null default false,
  invite_sent_at timestamptz,
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending', 'yes', 'no')),
  rsvp_attending_count int,                       -- null until responded; 1 (guest) + len(companion_names)
  companion_names text[] not null default '{}',   -- names of confirmed plus-ones, editable
  rsvp_responded_at timestamptz,                   -- updated on every submit, including edits
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  import_key text generated always as
    (lower(trim(name)) || '|' || regexp_replace(whatsapp_number, '\D', '', 'g')) stored
);

create unique index if not exists guests_import_key_idx on guests (import_key);
create index if not exists guests_token_idx on guests (token);

-- Migration for databases created before `invited_by` existed — no-op on a fresh install.
alter table guests add column if not exists invited_by text check (invited_by in ('novio', 'novia', 'padres_novio', 'padres_novia'));

-- Widens `invited_by` to also distinguish guests invited by either set of parents, as their own
-- sides parallel to novio/novia (not nested under them). No-op on a fresh install (the column
-- already allows these values above); this is what actually takes effect on a database created
-- before this change, where `invited_by`'s check constraint only allowed 'novio'/'novia'.
alter table guests drop constraint if exists guests_invited_by_check;
alter table guests add constraint guests_invited_by_check
  check (invited_by in ('novio', 'novia', 'padres_novio', 'padres_novia'));

-- Migration: shorten the token generated for newly-created guests (was 32
-- hex chars, a mess to share over WhatsApp — now 12). Only affects the
-- default applied to future inserts; existing guests keep their current
-- token so already-sent links keep working. Re-running is harmless.
alter table guests alter column token set default encode(gen_random_bytes(6), 'hex');

-- Migration for the RSVP confirmation email/PDF/QR feature — no-op on a fresh install.
alter table guests add column if not exists email text;
-- Distinct from `token` (the editable RSVP link) — this is what's printed on
-- the confirmation PDF / encoded in the guest's own QR. Losing it only
-- exposes a check-in code, never an editable RSVP link.
alter table guests add column if not exists checkin_code text unique
  default encode(gen_random_bytes(8), 'hex');
alter table guests add column if not exists confirmation_sent_at timestamptz;
alter table guests add column if not exists confirmation_send_error text;
create index if not exists guests_checkin_code_idx on guests (checkin_code);

-- Optional family/group name shown on the invitation instead of the
-- individual guest's name (e.g. "Familia Martínez" for Raúl Martínez + 3
-- plus-ones). Falls back to `name` when null.
alter table guests add column if not exists display_name text;

-- Migration for local-vs-abroad guest gating (Ubicación/Recomendaciones
-- sections + gift-account list differ by this) — no-op on a fresh install.
alter table guests add column if not exists guest_location text check (guest_location in ('local', 'extranjero'));

-- Migration: `plus_ones_allowed` ("additional companions beyond the named
-- guest") renamed to `party_size_allowed` ("total people allowed, including
-- the named guest") — the old meaning was a persistent source of admin
-- data-entry mistakes. Converts existing values (+1) so already-entered
-- guests keep their real party size under the new meaning. No-op once
-- already migrated, and a no-op on a fresh install (table above is created
-- with the new column directly).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'guests' and column_name = 'plus_ones_allowed'
  ) then
    alter table guests rename column plus_ones_allowed to party_size_allowed;
    update guests set party_size_allowed = party_size_allowed + 1;
  end if;
end $$;

alter table guests drop constraint if exists guests_plus_ones_allowed_check;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'guests_party_size_allowed_check') then
    alter table guests add constraint guests_party_size_allowed_check check (party_size_allowed >= 1);
  end if;
end $$;

-- Companions as individual records (one QR each), replacing the flat
-- `companion_names` array as the source of truth. The array column stays in
-- place, unused, rather than being dropped.
create table if not exists guest_companions (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests (id) on delete cascade,
  name text not null,
  checkin_code text not null unique default encode(gen_random_bytes(8), 'hex'),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists guest_companions_guest_id_idx on guest_companions (guest_id);

-- One-time backfill from the old array column into the new table; only
-- inserts for guests with no companion rows yet, so this is safe to leave
-- here permanently and re-run.
insert into guest_companions (guest_id, name, position)
select g.id, c.name, c.ord - 1
from guests g
cross join lateral unnest(g.companion_names) with ordinality as c(name, ord)
where g.companion_names <> '{}'
  and not exists (select 1 from guest_companions gc where gc.guest_id = g.id);

create table if not exists guest_views (
  id bigint generated always as identity primary key,
  guest_id uuid not null references guests (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  user_agent text
);
create index if not exists guest_views_guest_id_idx on guest_views (guest_id);

-- Single round trip: insert a view row + bump the rolled-up counters on
-- `guests` atomically, avoiding a read-then-write race if a guest opens
-- their link in two tabs at once.
create or replace function record_guest_view(p_guest_id uuid, p_user_agent text)
returns void language plpgsql as $$
begin
  insert into guest_views (guest_id, user_agent) values (p_guest_id, p_user_agent);
  update guests set
    first_viewed_at = coalesce(first_viewed_at, now()),
    last_viewed_at = now(),
    view_count = view_count + 1
  where id = p_guest_id;
end;
$$;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guests_set_updated_at on guests;
create trigger guests_set_updated_at
  before update on guests
  for each row execute function set_updated_at();

drop trigger if exists guest_companions_set_updated_at on guest_companions;
create trigger guest_companions_set_updated_at
  before update on guest_companions
  for each row execute function set_updated_at();

-- Migration for door check-in (QR scan at /checkin/[code]) — no-op on a fresh install.
alter table guests add column if not exists checked_in boolean not null default false;
alter table guests add column if not exists checked_in_at timestamptz;
alter table guest_companions add column if not exists checked_in boolean not null default false;
alter table guest_companions add column if not exists checked_in_at timestamptz;

-- Append-only RSVP submission log, powering the admin "Actividad" timeline (distinguishing a
-- first confirmation from a later edit). guests.rsvp_status/rsvp_responded_at still hold the
-- latest state; this only adds history on top.
create table if not exists guest_rsvp_events (
  id bigint generated always as identity primary key,
  guest_id uuid not null references guests (id) on delete cascade,
  status text not null check (status in ('yes', 'no')),
  is_edit boolean not null,
  occurred_at timestamptz not null default now()
);
create index if not exists guest_rsvp_events_guest_id_idx on guest_rsvp_events (guest_id);

-- Backstop for the party-size/attending-count invariant: enforced at the DB level so a race
-- between an admin lowering `party_size_allowed` and a guest's RSVP raising `rsvp_attending_count`
-- can never leave the row in an inconsistent state, regardless of which write wins the race.
alter table guests drop constraint if exists guests_attending_count_check;
alter table guests add constraint guests_attending_count_check
  check (rsvp_attending_count is null or rsvp_attending_count <= party_size_allowed);

-- Defense-in-depth against duplicate companion rows under concurrent RSVP edits (the
-- `apply_rsvp` function below is the primary fix — this catches anything that slips past it).
-- If this fails to create because duplicate (guest_id, name) rows already exist from before this
-- migration, de-duplicate `guest_companions` manually first, then re-run.
create unique index if not exists guest_companions_guest_name_idx
  on guest_companions (guest_id, lower(trim(name)));

-- Lets the primary named guest decline while their named companions still attend (rsvp_status
-- stays "yes" — "at least one person in this party is attending"; primary_attending says whether
-- the named guest themselves is among them). Only meaningful when rsvp_status = 'yes'.
alter table guests add column if not exists primary_attending boolean;
-- Backfill existing "yes" rows before adding the NOT NULL-when-yes constraint below — every RSVP
-- confirmed before this feature existed had the named guest attending by definition.
update guests set primary_attending = true where rsvp_status = 'yes' and primary_attending is null;
alter table guests drop constraint if exists guests_primary_attending_check;
alter table guests add constraint guests_primary_attending_check
  check (rsvp_status <> 'yes' or primary_attending is not null);

-- Atomically applies an RSVP (guest-facing submit or admin override): locks the guest row for the
-- duration of the transaction so two concurrent submissions for the same guest serialize instead
-- of racing (the previous implementation read the guest, validated, then wrote in separate round
-- trips — a classic TOCTOU race). Also enforces a short resubmission cooldown here, atomically,
-- so a scripted client hammering one guest's token can't trigger repeated confirmation
-- emails/PDFs (each RSVP submit sends one) faster than a real person could plausibly resubmit.
create or replace function apply_rsvp(
  p_guest_id uuid,
  p_status text,
  p_email text,
  p_companion_names text[],
  p_bypass_cooldown boolean default false,
  p_primary_attending boolean default true
) returns void language plpgsql as $$
declare
  v_guest guests%rowtype;
  v_max_companions int;
  v_attending_count int;
  v_is_edit boolean;
  v_name text;
  v_position int := 0;
  v_existing_id uuid;
begin
  select * into v_guest from guests where id = p_guest_id for update;
  if not found then
    raise exception 'guest_not_found';
  end if;

  if not p_bypass_cooldown and v_guest.rsvp_responded_at is not null
     and now() - v_guest.rsvp_responded_at < interval '15 seconds' then
    raise exception 'rate_limited';
  end if;

  if p_status = 'yes' then
    v_max_companions := v_guest.party_size_allowed - 1;
    if coalesce(array_length(p_companion_names, 1), 0) > v_max_companions then
      raise exception 'too_many_companions';
    end if;
    if not p_primary_attending and coalesce(array_length(p_companion_names, 1), 0) = 0 then
      raise exception 'primary_declined_no_companions';
    end if;
    v_attending_count := (case when p_primary_attending then 1 else 0 end)
      + coalesce(array_length(p_companion_names, 1), 0);
  else
    v_attending_count := null;
  end if;

  v_is_edit := v_guest.rsvp_status <> 'pending';

  update guests set
    rsvp_status = p_status,
    rsvp_attending_count = v_attending_count,
    primary_attending = case when p_status = 'yes' then p_primary_attending else null end,
    email = coalesce(nullif(p_email, ''), v_guest.email),
    rsvp_responded_at = now()
  where id = p_guest_id;

  if p_status = 'yes' then
    delete from guest_companions gc
    where gc.guest_id = p_guest_id
      and not exists (
        select 1 from unnest(p_companion_names) as n(name)
        where lower(trim(n.name)) = lower(trim(gc.name))
      );

    foreach v_name in array p_companion_names loop
      select id into v_existing_id from guest_companions
      where guest_id = p_guest_id and lower(trim(name)) = lower(trim(v_name))
      limit 1;

      if v_existing_id is not null then
        update guest_companions set name = v_name, position = v_position where id = v_existing_id;
      else
        insert into guest_companions (guest_id, name, position) values (p_guest_id, v_name, v_position);
      end if;
      v_position := v_position + 1;
    end loop;
  else
    delete from guest_companions where guest_id = p_guest_id;
  end if;

  insert into guest_rsvp_events (guest_id, status, is_edit) values (p_guest_id, p_status, v_is_edit);
end;
$$;

-- General-purpose rate limiting, backed by Postgres rather than an external store (Redis/Upstash)
-- — this app runs on serverless functions with no shared memory between invocations, but already
-- has a Postgres connection on every request, so a fixed-window counter table here is correct
-- across every instance with no new infrastructure. Traffic is low enough (one wedding, not a
-- multi-tenant SaaS) that row-level locking on a single small table is not a bottleneck.
create table if not exists rate_limits (
  key text primary key,
  count int not null default 1,
  window_start timestamptz not null default now()
);

-- Atomically increments the counter for `p_key` within a fixed `p_window_seconds` window
-- (resetting it if the window has elapsed) and reports whether the caller is still under
-- `p_max`. The `on conflict` upsert takes a row lock, so concurrent calls for the same key
-- serialize correctly instead of racing on a read-then-write check. Also opportunistically (1% of
-- calls) prunes stale rows so this table doesn't grow unbounded from one-off IPs/tokens that never
-- come back — cheap enough at this app's request volume to not need a separate scheduled job.
create or replace function check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean language plpgsql as $$
declare
  v_count int;
begin
  insert into rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    count = case
      when rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval then 1
      else rate_limits.count + 1
    end,
    window_start = case
      when rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval then now()
      else rate_limits.window_start
    end
  returning count into v_count;

  if random() < 0.01 then
    delete from rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_max;
end;
$$;

alter table guests enable row level security;
alter table guest_views enable row level security;
alter table guest_companions enable row level security;
alter table guest_rsvp_events enable row level security;
alter table rate_limits enable row level security;
-- Intentionally no policies: RLS enabled with zero policies means zero
-- access from the anon/public client. All reads/writes go through the
-- service-role key from trusted server code only (lib/supabase/admin.ts),
-- which bypasses RLS entirely. Never expose the service-role key to a
-- "use client" file or a NEXT_PUBLIC_* env var.
