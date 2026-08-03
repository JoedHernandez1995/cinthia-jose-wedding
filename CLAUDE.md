# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Next.js 14 (App Router, TypeScript) rebuild of José & Cinthia's wedding invitation — a single-page site generated from an original visual design tool export. All content is in Spanish.

## Commands

```bash
npm install       # install deps
npm run dev       # start dev server at http://localhost:3000
npm run build     # production build
npm run start     # run the production build
npm run lint      # next lint
```

There is no test suite configured in this project.

## Architecture

The page is decomposed by feature/section rather than living in one file. `app/page.tsx` is a one-line wrapper around `components/InvitationPage.tsx`, the composition root that renders every section top-to-bottom in a fixed order: envelope intro → nav → hero → historia (story) → padres (parents' blessing) → cancion (song/vinyl) → photo marquee → detalles (venue + countdown) → rsvp → comollegar (location) → vestimenta (dress code) → faq → gift → recomendaciones → footer.

- `app/layout.tsx` — root HTML shell: Google Fonts (`Cormorant Garamond`), self-hosted `@font-face` rules for `Poppins`/`Slight` (files in `public/fonts/`), global resets, and the two CSS `@keyframes` used by the page (`spin-vinyl`, `marquee-scroll`). All global CSS lives here as a single inline `<style>` block — there is no separate stylesheet or CSS module.
- `components/InvitationPage.tsx` — composition root; owns section ordering and the shared page chrome only. Each section owns its own copy and local state.
- `components/sections/*` — one component per section (e.g. `HeroSection`, `RsvpSection`, `GiftSection`). Still styled with inline `style={{...}}` objects (no CSS classes, no Tailwind) to match the original hand-built design.
- `components/ui/*` — small shared building blocks reused across sections: `Reveal` (scroll-reveal wrapper), `Photo` (image with placeholder fallback), `GoldDivider`, `GoldButtonLink`, `OutlineButtonLink`.
- `config/site.ts` — single source of truth for wedding facts, copy, contact placeholders, FAQ entries, and gift accounts. `config/family.ts` holds the parents' names.
- `theme/tokens.ts` — shared color/font-family constants (`colors`, `fontFamilies`). Per-section layout numbers (sizes, spacing, letter-spacing) stay inline since they're bespoke per heading, not unified tokens.
- `hooks/*` — extracted stateful behavior: `useLiveCountdown` (ticks the wedding countdown), `useCopyToClipboard` (gift-account "COPIADO" toggle), `useRevealOnScroll` (single-element IntersectionObserver), `useEnvelopeAnimation` (intro open/close timing).
- `lib/*` — pure helpers with no React dependency: `buildWhatsAppLink` (wa.me deep links), `buildCalendarDownloadLink` (the `.ics` data URI).
- `types/invitation.ts` — shared types (`Faq`, `GiftAccount`, `RsvpChoice`, `CountdownUnit`).

### State model

State lives in the section that owns it — no global state management, no context:

- `EnvelopeIntro` (via `useEnvelopeAnimation`) — gates the intro envelope overlay; `open()` runs a timed close-then-reveal transition.
- `VenueDetailsSection` (via `useLiveCountdown`) — ticks every second to drive the countdown to the hardcoded wedding date/time.
- `Reveal` (via `useRevealOnScroll`) — each instance owns its own `IntersectionObserver`; once revealed it never re-hides.
- `RsvpSection` — local `rsvpChoice` ("yes" | "no" | null) set when the user clicks an RSVP link; only changes local UI copy/styling, it does not persist anywhere (RSVP itself happens via a `wa.me` WhatsApp deep link, not a form submission).
- `GiftSection` (via `useCopyToClipboard`) — tracks which gift account's "copy" button was last clicked, for the "COPIADO" label timeout.

### Images

`components/ui/Photo.tsx` renders `<img src="/photos/{id}.webp">` and swaps to a gray placeholder box (showing the `alt` text) `onError`, so missing files degrade gracefully instead of showing a broken image icon. `marqueePhotoIds` (in `config/site.ts`) lists the ids used by the scrolling marquee section (duplicated once in the render to create a seamless CSS-animated loop).

### Configuration / placeholders to know about

Several real values live in `config/site.ts` and are still placeholders per `README.md`:
- `WHATSAPP_NUMBER`, `pinterestLinks`, `recommendationsLink`
- Bank account numbers in `giftAccounts`
- Wedding date/time (`wedding.dateTimeIso`) and venue name/location — also referenced by `calendarEvent` for the `.ics` download; both must represent the same instant if changed.

Missing marquee photos (`marquee-1`, `marquee-4-b`, `marquee-5-b`) render as placeholders until matching `.webp` files are added to `public/photos/`.

## Notes for editing

- There's no design system to extend beyond `theme/tokens.ts` — new UI should follow the existing pattern of inline `style` objects using the same font stack (`fontFamilies.display` for headings, `fontFamilies.serif` italic for body copy, `fontFamilies.label` for uppercase/letter-spaced labels) and the gold accent (`colors.gold`).
- Section anchors (`#historia`, `#detalles`, `#rsvp`, `#vestimenta`, `#recomendaciones`, `#faq`, defined in `config/site.ts`'s `sectionIds`) are linked from `NavBar` and used as scroll targets — keep a section's `id` and its `NavBar` entry in sync if renaming a section.
- The couple's display name and wedding metadata come from `coupleNames.full` / `siteMetadata` in `config/site.ts` — change it there once rather than in each section.
