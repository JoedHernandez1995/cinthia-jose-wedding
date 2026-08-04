import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { InvitationPage } from "@/components/InvitationPage";
import { getGuestByToken, recordGuestView, toGuestViewModel } from "@/lib/guests";

// Always hit the database — this must never be statically cached, since it
// reflects live RSVP/view state per guest.
export const dynamic = "force-dynamic";

export default async function GuestInvitationPage({ params }: { params: { token: string } }) {
  const guest = await getGuestByToken(params.token);
  if (!guest) notFound();

  const userAgent = headers().get("user-agent");
  await recordGuestView(guest.id, userAgent);

  return <InvitationPage guest={toGuestViewModel(guest)} />;
}
