import { notFound, redirect } from "next/navigation";
import { RecommendationsPage } from "@/components/RecommendationsPage";
import { getGuestByToken } from "@/lib/guests";

// Always hit the database — mirrors the main `/i/[token]` page.
export const dynamic = "force-dynamic";

export default async function GuestRecommendationsPage({ params }: { params: { token: string } }) {
  const guest = await getGuestByToken(params.token);
  if (!guest) notFound();

  // Same gating as the in-page teaser: recommendations are only for guests traveling from abroad.
  if (guest.guestLocation !== "extranjero") redirect(`/i/${params.token}`);

  return <RecommendationsPage token={guest.token} />;
}
