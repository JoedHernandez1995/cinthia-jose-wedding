import { listGuests } from "@/lib/guests";
import { CheckinBoard } from "./CheckinBoard";

// Headcount must never be stale — always hit the DB.
export const dynamic = "force-dynamic";

export default async function AdminCheckinPage() {
  const guests = await listGuests();
  const confirmed = guests.filter((g) => g.rsvpStatus === "yes");

  return <CheckinBoard guests={confirmed} />;
}
