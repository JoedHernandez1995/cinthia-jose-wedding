import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationPage } from "@/components/InvitationPage";
import { getGuestByToken, toGuestViewModel } from "@/lib/guests";
import { siteMetadata } from "@/config/site";

// Always hit the database — this must never be statically cached, since it
// reflects live RSVP/view state per guest.
export const dynamic = "force-dynamic";

// Wrapped in React's cache() so generateMetadata and the page component share one DB read per
// request instead of two — Next.js calls both for the same route.
const loadGuest = cache(getGuestByToken);

// Note: this does NOT record a view — it's just a lookup for the link-preview card. Loading this
// page (or a bot fetching it for a preview) still doesn't count as a view; see `recordViewAction`
// in `./actions.ts`, called from `EnvelopeIntro` once the guest actually opens the envelope.
export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const guest = await loadGuest(params.token);
  if (!guest) return {};

  const greetingName = guest.displayName || guest.name;
  const title = `${greetingName} — Invitación de Cinthia & José`;
  const description = "Cinthia & José te invitan a celebrar su boda. Toca para ver tu invitación.";
  // Next.js replaces the whole `openGraph`/`twitter` object per segment rather than merging
  // sub-fields, so the image has to be repeated here or a personalized page loses it.
  const image = { url: siteMetadata.ogImagePath, width: siteMetadata.ogImageWidth, height: siteMetadata.ogImageHeight };

  return {
    title,
    description,
    openGraph: { title, description, images: [image], locale: "es_HN" },
    twitter: { card: "summary_large_image", title, description, images: [siteMetadata.ogImagePath] },
  };
}

export default async function GuestInvitationPage({ params }: { params: { token: string } }) {
  const guest = await loadGuest(params.token);
  if (!guest) notFound();

  return <InvitationPage guest={toGuestViewModel(guest)} />;
}
