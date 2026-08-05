import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // /checkin is staff-only (door check-in via QR scan) — gated the same way as /admin so a guest
  // can't check themselves in by opening their own QR out of curiosity.
  matcher: ["/admin/:path*", "/checkin/:path*"],
};
