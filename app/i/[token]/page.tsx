import { notFound } from "next/navigation";
import { InvitationPage } from "@/components/InvitationPage";
import { getGuestByToken, toGuestViewModel } from "@/lib/guests";

// Always hit the database — this must never be statically cached, since it
// reflects live RSVP/view state per guest.
export const dynamic = "force-dynamic";

// Note: the view is intentionally NOT recorded here. Loading this page just means a link was
// opened (could be a link-preview bot, a curious forward, etc.) — the guest hasn't actually seen
// the invitation content until they clear the envelope gate. See `recordViewAction` in
// `./actions.ts`, called from `EnvelopeIntro` once the guest opens the envelope.
export default async function GuestInvitationPage({ params }: { params: { token: string } }) {
  const guest = await getGuestByToken(params.token);
  if (!guest) notFound();

  return <InvitationPage guest={toGuestViewModel(guest)} />;
}
