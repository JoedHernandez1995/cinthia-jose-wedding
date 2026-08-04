# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Next.js 14 (App Router, TypeScript) rebuild of José & Cinthia's wedding invitation — a single-page site generated from an original visual design tool export. All content is in Spanish. It now also includes a guest-management admin system (Supabase-backed) for CSV guest import, per-guest personalized invitation links, view tracking, and RSVP management — see "Admin/guest system" below.

## Commands

```bash
npm install       # install deps
npm run dev       # start dev server at http://localhost:3000
npm run build     # production build
npm run start     # run the production build
npm run lint      # next lint
```

There is no test suite configured in this project. See README.md for Supabase setup steps required before the admin system works.

## Architecture — the invitation itself

The page is decomposed by feature/section rather than living in one file. `app/page.tsx` (root `/`) renders `components/HomeLanding.tsx`, a static teaser (monogram, couple names, date, a note that the invitation is personal) — it never shows the envelope or full invitation, since those require a guest's personal link. The full invitation lives at `app/i/[token]/page.tsx`, which renders `components/InvitationPage.tsx`, the composition root that renders every section top-to-bottom in a fixed order: envelope intro → nav → (guest greeting, if personalized) → hero → historia (story) → padres (parents' blessing) → cancion (song/vinyl) → photo marquee → detalles (venue + countdown) → rsvp → comollegar (location) → vestimenta (dress code) → faq → gift → recomendaciones → footer.

- `app/layout.tsx` — root HTML shell: Google Fonts (`Cormorant Garamond`), imports `app/globals.css`.
- `app/globals.css` — self-hosted `@font-face` rules for `Poppins`/`Slight` (files in `public/fonts/`), CSS custom properties for colors/fonts (`--color-*`, `--font-*`), global resets. This is the single source of design tokens — there is no separate `theme/` directory.
- `components/HomeLanding.tsx` — root `/`'s static landing; not part of the invitation composition, has no `guest` concept.
- `components/InvitationPage.tsx` — composition root for the full invitation; owns section ordering, the shared page chrome, and threading the `guest` prop (see below) into `GuestGreeting`/`RsvpSection`. Each section otherwise owns its own copy and local state.
- `components/sections/*` — one component per section (e.g. `HeroSection`, `RsvpSection`, `GiftSection`), each paired with its own `*.module.css` file. Styling is CSS Modules throughout — no inline `style={{...}}` objects, no Tailwind.
- `components/ui/*` — small shared building blocks reused across sections: `Reveal` (scroll-reveal wrapper), `Photo` (image with placeholder fallback), `GoldDivider`, `GoldButtonLink`, `OutlineButtonLink`.
- `config/site.ts` — single source of truth for wedding facts, copy, contact placeholders, FAQ entries, and gift accounts. `config/family.ts` holds the parents' names.
- `hooks/*` — extracted stateful behavior: `useLiveCountdown` (ticks the wedding countdown), `useCopyToClipboard` (gift-account "COPIADO" toggle), `useRevealOnScroll` (single-element IntersectionObserver), `useEnvelopeAnimation` (intro open/close timing).
- `lib/*` — pure helpers with no React dependency: `buildWhatsAppLink` / `buildPlannerNotificationMessage` (`lib/whatsapp.ts`), `buildCalendarDownloadLink` (`lib/calendar.ts`, the `.ics` data URI), `lib/guests.ts` (server-only guest data access, see below).
- `types/invitation.ts` — shared types for the static invitation (`Faq`, `GiftAccount`, `RsvpChoice`, `CountdownUnit`). `types/guest.ts` holds guest/RSVP types, kept separate to avoid coupling the public invitation types to admin concerns.

### State model

State lives in the section that owns it — no global state management, no context:

- `EnvelopeIntro` (via `useEnvelopeAnimation`) — gates the intro envelope overlay; `open()` runs a timed close-then-reveal transition.
- `VenueDetailsSection` (via `useLiveCountdown`) — ticks every second to drive the countdown to the hardcoded wedding date/time.
- `Reveal` (via `useRevealOnScroll`) — each instance owns its own `IntersectionObserver`; once revealed it never re-hides.
- `RsvpSection` — always rendered with a `guest` prop in practice (`InvitationPage` only renders from `/i/[token]`), backing a real form persisted to the database. The `guest` prop stays optional in the type/component signature for now; there's no caller that omits it.
- `GiftSection` (via `useCopyToClipboard`) — tracks which gift account's "copy" button was last clicked, for the "COPIADO" label timeout.

### Images

`components/ui/Photo.tsx` renders `<img src="/photos/{id}.webp">` and swaps to a gray placeholder box (showing the `alt` text) `onError`, so missing files degrade gracefully instead of showing a broken image icon. `marqueePhotoIds` (in `config/site.ts`) lists the ids used by the scrolling marquee section (duplicated once in the render to create a seamless CSS-animated loop).

### Configuration / placeholders to know about

Several real values live in `config/site.ts` and are still placeholders per `README.md`:
- `WHATSAPP_NUMBER`, `plannerWhatsAppNumber`, `pinterestLinks`, `recommendationsLink`
- Bank account numbers in `giftAccounts`
- Wedding date/time (`wedding.dateTimeIso`) and venue name/location — also referenced by `calendarEvent` for the `.ics` download; both must represent the same instant if changed. `wedding.rsvpDeadlineIso` must likewise match `wedding.rsvpDeadlineLabel`.

Missing marquee photos (`marquee-1`, `marquee-4-b`, `marquee-5-b`) render as placeholders until matching `.webp` files are added to `public/photos/`.

## Admin/guest system

Backed by Supabase (Postgres + Auth). See README.md for one-time setup (create project, run `supabase/schema.sql`, create the single admin user, fill `.env.local`).

- **Data model**: one `guests` table (`supabase/schema.sql`) — name, optional `display_name` (family/group name shown on the invitation instead of `name`, e.g. "Familia Martínez"), WhatsApp number, email, `invited_by` (`"novio" | "novia" | null`, which side of the couple invited them), `partySizeAllowed` (**total** people allowed including the named guest — NOT a plus-ones count; a guest + spouse is `2`), a unique `token` (their personal URL slug) and a separate `checkinCode` (door check-in QR, never the same as `token`), RSVP state (`rsvp_status`, `rsvp_attending_count`), invite-sent tracking, confirmation-email status (`confirmation_sent_at`/`confirmation_send_error`), and rolled-up view stats (`view_count`, `first_viewed_at`, `last_viewed_at`). A `guest_companions` table holds each named plus-one as its own row (own `id`/`checkin_code`, matched across RSVP edits by normalized name); `guests.companionNames`/`.companions` are derived from it, never written to directly. A separate `guest_views` table logs each individual view. RLS is enabled with **zero policies** — all access goes through the service-role key server-side only, never through the anon/browser client.
- **`lib/supabase/{server,client,admin,middleware}.ts`** — `server.ts`/`client.ts` use the anon key for the admin's auth session (cookie-based via `@supabase/ssr`); `admin.ts` is the service-role client used exclusively by `lib/guests.ts` for all `guests`/`guest_companions`/`guest_views` reads/writes (imports `server-only` to make an accidental client-component import a build error).
- **`middleware.ts`** — gates `/admin/**` (except `/admin/login`) behind a valid Supabase Auth session, redirecting to login otherwise.
- **`lib/guests.ts`** — all guest data access: `getGuestByToken`/`getGuestById`, `listGuests`, `createGuest`/`updateGuest` (both throw `DuplicateGuestError` on a name+phone collision rather than an unhandled DB error; `updateGuest` also throws `GuestValidationError` and **blocks** lowering `partySizeAllowed` below the guest's already-confirmed companion count + 1 — fix the RSVP via override first), CSV parsing/upsert (`parseGuestCsvRows`, `upsertGuestsFromCsv` — an upload's blank `invited_by`/`display_name` never clears a value already set in the admin panel, handled via separate targeted updates after the main upsert), `recordGuestView`, `submitRsvp`/`overrideRsvp` (validates companion count against `partySizeAllowed - 1` server-side, never trusts a client-sent count; also builds/sends the confirmation PDF+email via `lib/confirmation.ts`'s `sendGuestConfirmation`, which never throws), `markInviteSent`, `regenerateToken`, `exportGuestsCsv`, `getGuestSideBreakdown` (counts by side × RSVP status, feeds the dashboard chart), and `buildGuestInviteLink` (wraps `buildWhatsAppLink` with the guest's `/i/[token]` URL baked into the message).
- **`lib/pdf.tsx`/`lib/qr.ts`/`lib/email.ts`/`lib/confirmation.ts`** — RSVP confirmation PDF+QR+email pipeline. Each confirmed person (guest + every named companion) gets their own QR encoding a `/checkin/{code}` URL (route not built yet — future door check-in feature); the PDF is emailed via Resend on every "yes" submit/edit. A send failure is recorded on the guest row and never blocks or rolls back the RSVP save itself.
- **`app/i/[token]/page.tsx`** — a guest's personal invitation. `force-dynamic` (always hits the DB). Looks up the guest, records a view via the `record_guest_view` RPC, and renders `<InvitationPage guest={...} />`. 404s (via `not-found.tsx`) on an unknown token. Root `/` is unaffected — it renders `HomeLanding`, an unrelated static page.
- **`components/sections/EnvelopeIntro.tsx`** — the site's actual first screen (shown before the envelope is opened). When `guest` is set, shows their resolved `displayName`, "Tienes/Tienen una invitación" (plural iff `partySizeAllowed > 1`), and "VÁLIDO PARA N PERSONAS" (`N = partySizeAllowed`) — all guest-specific copy lives here, not in `HeroSection` (which stays guest-agnostic).
- **RSVP flow** (`RsvpSection.tsx` + `RsvpCompanionModal.tsx`, guest mode only): "Sí, asistiré" always opens a modal collecting a required email plus, when `partySizeAllowed > 1`, a companion-count selector (capped at `partySizeAllowed - 1` in the UI, re-validated server-side) and a name field per companion; "No podré asistir" submits directly. Submission calls the `submitRsvpAction` Server Action (`app/i/[token]/actions.ts`), which persists to the database — this is the source of truth, not WhatsApp. Responses are editable via "Editar respuesta" only until `wedding.rsvpDeadlineIso`; every "yes" submit re-sends the confirmation PDF. Past the deadline, self-serve editing (or, for guests who never responded, the yes/no buttons themselves) is replaced by a message directing the guest to contact `faqContact.name` (the wedding planner) via a WhatsApp button, since changes after that point go through her instead of the site. On successful save, the client also auto-opens a `wa.me` link to `plannerWhatsAppNumber` with a pre-filled summary — built by the name-aware `whatsappMessages.rsvpYes`/`rsvpNo`/`rsvpLastMinute` functions in `config/site.ts`, which always spell out the guest's name (and, for a group RSVP, their family label + companion names) since the planner has no other way to know who's texting her — as a courtesy notification. The guest still has to tap send, and declining to do so doesn't lose any data since the DB write already happened.
- **Admin dashboard** (`app/admin/`): `/admin` (overview stats + `SideBreakdownChart`, a stacked bar per side showing confirmed/declined/pending, colors matching the guest-table status badges), `/admin/guests` (searchable/filterable table — filters on RSVP status, invite-sent, and side; each "Sí" row shows a bulleted sublist of confirmed companion names under its RSVP badge — plus CSV upload, add-guest form, CSV export at `/admin/guests/export`), `/admin/guests/[id]` (detail: edit-guest form for name/display name/phone/side/party size, view history, companion names, confirmation-email status, PDF download link, manual RSVP override for guests who respond outside the site). `app/admin/guests/actions.ts` holds the guest-management Server Actions; `app/admin/login/actions.ts` holds `login`/`signOut`.
- **How WhatsApp is actually used** — there is no WhatsApp Business API/automated sending anywhere. It's used in exactly two places, both admin-assisted or guest-assisted `wa.me` deep links that a human has to tap send on: (1) admin sending a guest's personal invite link (also auto-marks `invite_sent`), (2) the guest notifying the planner after RSVP. WhatsApp numbers are never parsed for input; the personal `/i/[token]` page and its view/RSVP tracking are the only source of truth.

## Notes for editing

- Design tokens live in `app/globals.css` (`--color-*`, `--font-*` custom properties) — new UI in the invitation itself should follow the existing CSS Modules pattern using those variables (`--font-display` for headings, `--font-serif` italic for body copy, `--font-label` for uppercase/letter-spaced labels, `--color-gold` accent).
- **Admin UI (`app/admin/**`) intentionally uses neutral fonts only** — `--font-label` (Poppins) for everything, including headings. Do not use `--font-display` (cursive `Slight`) or `--font-serif` (italic Cormorant) in admin pages; those are reserved for the guest-facing invitation's romantic styling.
- Section anchors (`#historia`, `#detalles`, `#rsvp`, `#vestimenta`, `#recomendaciones`, `#faq`, defined in `config/site.ts`'s `sectionIds`) are linked from `NavBar` and used as scroll targets — keep a section's `id` and its `NavBar` entry in sync if renaming a section.
- The couple's display name and wedding metadata come from `coupleNames.full` / `siteMetadata` in `config/site.ts` — change it there once rather than in each section.
- Never import `lib/guests.ts` or `lib/supabase/admin.ts` from a `"use client"` file — both are server-only (enforced by the `server-only` package) since they use the Supabase service-role key.
