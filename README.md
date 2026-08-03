# José & Cinthia — Wedding Invitation (Next.js export)

Next.js 14 (App Router, TypeScript) rebuild of the wedding invitation, generated from the original Design Component.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000

## What's included
- `app/layout.tsx` — fonts (Cormorant Garamond via Google Fonts, self-hosted Poppins/Slight `@font-face`), global resets, keyframes.
- `app/page.tsx` — the full single-page invitation: envelope intro, hero, story, parents blessing, song/vinyl, photo marquee, venue + countdown, RSVP (WhatsApp deep links), location, dress code, FAQ, gift info, recommendations, footer. State (envelope open/close, live countdown, RSVP choice, copy-to-clipboard, scroll-reveal via `IntersectionObserver`) is plain React hooks.
- `public/assets/` — envelope, lace frame, monogram, vinyl artwork.
- `public/fonts/` — Poppins + Slight `.ttf` files.
- `public/photos/` — the couple/venue photos that were uploaded into the image slots, extracted to real files.

## Known gaps to finish before shipping
- **Missing photos**: `marquee-1`, `marquee-4-b`, `marquee-5-b` had no image uploaded in the original design; they currently render a plain placeholder box. Drop matching files into `public/photos/` (same naming) to fill them.
- **Hover states**: the original used per-element hover style swaps (button color/background on hover). This export ships the resting styles only — add `onMouseEnter`/`onMouseLeave` state or a small CSS module for hover if you want that back.
- **WhatsApp number / links**: `WHATSAPP_NUMBER`, Pinterest links, and the recommendations doc link are hardcoded near the top of `app/page.tsx` — replace the placeholders with real values.
- **Bank account numbers** in the gift section are placeholders (`000-000-0000`) — update with real account details.
- Countdown target date and venue details are hardcoded for Nov 7, 2026 — update if anything changes.

## Deploy
Works out of the box on Vercel (`vercel deploy`) or any Node host that supports Next.js.
