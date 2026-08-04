import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { InvitationPage } from "@/components/InvitationPage";
import { getGuestByToken, recordGuestView } from "@/lib/guests";
import type { GuestViewModel } from "@/types/guest";

// Always hit the database — this must never be statically cached, since it
// reflects live RSVP/view state per guest.
export const dynamic = "force-dynamic";

export default async function GuestInvitationPage({ params }: { params: { token: string } }) {
  const guest = await getGuestByToken(params.token);
  if (!guest) notFound();

  const userAgent = headers().get("user-agent");
  await recordGuestView(guest.id, userAgent);

  const guestViewModel: GuestViewModel = {
    token: guest.token,
    name: guest.name,
    displayName: guest.displayName || guest.name,
    email: guest.email,
    partySizeAllowed: guest.partySizeAllowed,
    rsvpStatus: guest.rsvpStatus,
    rsvpAttendingCount: guest.rsvpAttendingCount,
    companionNames: guest.companionNames,
  };

  return <InvitationPage guest={guestViewModel} />;
}
