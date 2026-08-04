-- Run this once in the Supabase SQL editor for a fresh project.
-- Idempotent: safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE where possible).

create extension if not exists pgcrypto;

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(6), 'hex'), -- short & shareable over WhatsApp
  name text not null,
  whatsapp_number text not null,
  invited_by text check (invited_by in ('novio', 'novia')), -- which side invited this guest; null = not yet assigned
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
alter table guests add column if not exists invited_by text check (invited_by in ('novio', 'novia'));

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

alter table guests enable row level security;
alter table guest_views enable row level security;
alter table guest_companions enable row level security;
-- Intentionally no policies: RLS enabled with zero policies means zero
-- access from the anon/public client. All reads/writes go through the
-- service-role key from trusted server code only (lib/supabase/admin.ts),
-- which bypasses RLS entirely. Never expose the service-role key to a
-- "use client" file or a NEXT_PUBLIC_* env var.
