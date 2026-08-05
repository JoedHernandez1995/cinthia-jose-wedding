# José & Cinthia — Wedding Invitation (Next.js export)

Next.js 14 (App Router, TypeScript) rebuild of the wedding invitation, generated from the original Design Component. Now includes a guest-management admin system (Supabase-backed).

## Run it

```bash
npm install
cp .env.example .env.local   # fill in Supabase values, see "Admin system setup" below
npm run dev
```

Open http://localhost:3000

## What's included
- `app/layout.tsx` — fonts (Cormorant Garamond via Google Fonts, self-hosted Poppins/Slight `@font-face`), global resets, keyframes.
- `components/InvitationPage.tsx` — composition root for the single-page invitation (envelope intro, hero, story, parents blessing, song/vinyl, photo marquee, venue + countdown, RSVP, location, dress code, FAQ, gift info, recommendations, footer). See `CLAUDE.md` for the full section/state breakdown.
- `public/assets/`, `public/fonts/`, `public/photos/` — static assets.
- `app/i/[token]/` — a guest's personal invitation page (shows their name, allowed plus-ones, and a real RSVP form backed by the database).
- `app/admin/` — the guest-management dashboard (login-gated).

## Admin system setup

The admin system (guest list, CSV import, per-guest links, view tracking, RSVP dashboard) is backed by [Supabase](https://supabase.com) (Postgres + Auth).

1. **Create a Supabase project** at supabase.com.
2. **Run the schema**: open the SQL editor in the Supabase dashboard and run the contents of `supabase/schema.sql`. It's idempotent — safe to re-run.
3. **Create the one admin account**: Supabase dashboard → Authentication → Users → Add user. Set an email/password — this is the only login the admin dashboard supports (no signup UI).
4. **Fill in env vars**: copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from Project Settings → API. Set `NEXT_PUBLIC_SITE_URL` to your real domain before generating guest links in production.
5. In production (Vercel), set the same env vars in the project's Environment Variables settings. **Never** prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_` — it's server-only and bypasses row-level security.
6. Log in at `/admin/login`.

### RSVP confirmation email setup (PDF + QR codes)

When a guest confirms "yes," they're emailed a PDF with the event summary and a QR code for themselves and each named companion — sent via [Resend](https://resend.com).

1. **Create a Resend account** and add your sending domain (Domains → Add Domain).
2. **Verify the domain**: add the SPF/DKIM DNS records Resend gives you at your domain registrar. Without a verified domain, mail is likely to land in spam or fail outright — don't skip this before sending to real guests.
3. **Create an API key** (API Keys → Create API Key).
4. **Fill in env vars**: `RESEND_API_KEY` (the key from step 3) and `RESEND_FROM_EMAIL` (e.g. `Cinthia & José <confirmaciones@tudominio.com>` — the address part must be on the verified domain; avoid a "no-reply@" address, it reads as spammy for a wedding invite).
5. To manually check a PDF's output without waiting for a real RSVP, open `/admin/guests/[id]/pdf` for any guest (also linked from their detail page) — it streams a freshly-built PDF.

If `RESEND_API_KEY`/`RESEND_FROM_EMAIL` aren't set, the RSVP save itself still succeeds — only the confirmation email fails silently (recorded on the guest's row, visible on their admin detail page), never blocking the guest's RSVP.

### CSV guest import format

`/admin/guests` accepts a CSV with these columns (header row required):

```csv
name,display_name,whatsapp_number,party_size_allowed,invited_by
Raúl Martínez,Familia Martínez,50499999999,2,novia
Juan Pérez,,50488888888,1,novio
```

- `whatsapp_number` — digits only work best (country code + number, no `+` needed, e.g. `50499999999`); the importer strips non-digits automatically.
- `display_name` — optional. A family/group name shown on the invitation instead of `name` (e.g. "Familia Martínez"). Leave blank to just use `name`.
- `party_size_allowed` — **total** number of people allowed, including the named guest themselves. A guest bringing one spouse is `2`, not `1` — this is the single most common data-entry mistake, so double-check it. Defaults to `1` (just the named guest) if blank.
- `invited_by` — optional. `novio` or `novia`, marking which side of the couple invited this guest. Leave blank to assign later in the admin panel — a blank value on re-upload never clears an assignment already made there.
- Re-uploading a CSV updates existing guests (matched by normalized name + phone) instead of duplicating them — safe to re-import after fixing a typo.

### How WhatsApp is used

There's no WhatsApp Business API integration — sending is admin-assisted:
- **Inviting a guest**: `/admin/guests` has a "Enviar por WhatsApp" link per row that opens `wa.me` with that guest's personal invitation link pre-filled; the admin taps send.
- **RSVP notifications**: after a guest submits their RSVP on their personal page, the site auto-opens a `wa.me` link to the wedding planner's number (`plannerWhatsAppNumber` in `config/site.ts`) with a summary pre-filled; the guest taps send. The RSVP itself is always saved to the database first regardless of whether that message gets sent.

### Error tracking (Sentry)

Unhandled errors are caught by themed error boundaries (`app/error.tsx` for the public site, `app/admin/error.tsx` for the admin panel, `app/global-error.tsx` as a last resort) and reported to [Sentry](https://sentry.io) if configured.

1. Create a Sentry project (Next.js platform).
2. Copy the DSN into `NEXT_PUBLIC_SENTRY_DSN` in `.env.local` (and in Vercel's env settings for production).
3. Optional, for readable stack traces in Sentry instead of minified ones: create an auth token (sentry.io/settings/account/api/auth-tokens) and set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — this uploads source maps on `next build`.

Without `NEXT_PUBLIC_SENTRY_DSN` set, error reporting is a no-op — the error boundaries still show their fallback UI, they just don't send anything anywhere.

## Known gaps to finish before shipping
- **No check-in scanner yet**: each confirmation PDF's QR codes encode `/checkin/{code}` URLs, but that route isn't built — scanning one currently 404s. The codes are real and stable (won't need to be re-issued) for whenever a door check-in feature is added.
- **Missing photos**: `marquee-1`, `marquee-4-b`, `marquee-5-b` had no image uploaded in the original design; they currently render a plain placeholder box. Drop matching files into `public/photos/` (same naming) to fill them.
- **WhatsApp numbers**: `WHATSAPP_NUMBER` and `plannerWhatsAppNumber` in `config/site.ts` are placeholders — replace with the real couple/planner numbers.
- **Pinterest links / recommendations doc link** in `config/site.ts` are placeholders.
- **Bank account numbers** in the gift section (`config/site.ts` → `giftAccounts`) are placeholders (`000-000-0000`) — update with real account details.
- Countdown target date, venue details, and RSVP deadline are hardcoded for Nov 7, 2026 / Oct 1, 2026 — update if anything changes (`config/site.ts` → `wedding`, `calendarEvent`).

## Deploy
Works out of the box on Vercel (`vercel deploy`) or any Node host that supports Next.js. Remember to set the Supabase env vars (see above) in the host's environment settings — the admin/guest routes will throw at request time without them.
