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

This is intentionally a **two-file app**, not a component library:

- `app/layout.tsx` — root HTML shell: Google Fonts (`Cormorant Garamond`), self-hosted `@font-face` rules for `Poppins`/`Slight` (files in `public/fonts/`), global resets, and the two CSS `@keyframes` used by the page (`spin-vinyl`, `marquee-scroll`). All global CSS lives here as a single inline `<style>` block — there is no separate stylesheet or CSS module.
- `app/page.tsx` — the entire invitation. A single `Home` client component (`"use client"`) renders every section top-to-bottom in one JSX tree, styled with inline `style={{...}}` objects (no CSS classes, no Tailwind). Sections in order: envelope intro → hero → historia (story) → padres (parents' blessing) → cancion (song/vinyl) → photo marquee → detalles (venue + countdown) → rsvp → comollegar (location) → vestimenta (dress code) → faq → gift → recomendaciones → footer.

### State model

All state is plain React hooks in `Home` — no state management library, no context, no server state:

- `envelopeOpen` / `closing` — gates the intro envelope overlay; `openEnvelope()` runs a timed close-then-reveal transition.
- `now` (ticked every second via `setInterval`) drives the countdown to the hardcoded wedding date/time.
- `revealed` (a `Set<string>`) — scroll-reveal animation state, populated by a single shared `IntersectionObserver` set up in one `useEffect`. Each section wraps its content in the local `Reveal` component keyed by an id from the `revealIds` array; once an id is observed intersecting it's added to the set and unobserved (reveal-once, not repeatable).
- `rsvpChoice` ("yes" | "no" | null) — set when the user clicks an RSVP link; only changes local UI copy/styling, it does not persist anywhere (RSVP itself happens via a `wa.me` WhatsApp deep link, not a form submission).
- `copiedIdx` — tracks which gift account's "copy" button was last clicked, for the "COPIADO" label timeout.

### Images

The local `Photo` component (`app/page.tsx`) renders `<img src="/photos/{id}.webp">` and swaps to a gray placeholder box (showing the `alt` text) `onError`, so missing files degrade gracefully instead of showing a broken image icon. `marqueeIds` lists the ids used by the scrolling marquee section (duplicated once in the render to create a seamless CSS-animated loop).

### Configuration / placeholders to know about

Several real values are hardcoded near the top of `app/page.tsx` and are still placeholders per `README.md`:
- `WHATSAPP_NUMBER`, `PINTEREST_MEN`/`PINTEREST_WOMEN`, `RECOMMENDATIONS_LINK`
- Bank account numbers in `giftAccounts`
- Wedding date/time (`2026-11-07T16:00:00-06:00`) and venue name/location, referenced in both the countdown calculation and the `.ics` calendar data URI

Missing marquee photos (`marquee-1`, `marquee-4-b`, `marquee-5-b`) render as placeholders until matching `.webp` files are added to `public/photos/`.

## Notes for editing

- There's no design system to extend — new UI should follow the existing pattern of inline `style` objects using the same font stack (`'Slight'` for display headings, `'Cormorant Garamond'` italic for body copy, `'Poppins'` for uppercase/letter-spaced labels) and the gold accent (`GOLD = "#c9a877"`).
- Section anchors (`#historia`, `#detalles`, `#rsvp`, `#vestimenta`, `#recomendaciones`, `#faq`) are linked from the fixed nav in `page.tsx` and used as scroll targets — keep `id` and nav `href` in sync if renaming a section.
