import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/env";
import { sendDueReminders } from "@/lib/reminder";

// Always run live — never cache a cron response.
export const dynamic = "force-dynamic";

/**
 * Triggered daily by Vercel Cron (see `vercel.json`). `sendDueReminders` decides internally
 * whether today falls inside the reminder campaign window and, if so, at what cadence (7/3/1
 * days) — a single daily trigger is enough to cover every cadence, since "due" is a threshold
 * check against each guest's last reminder, not a fixed time of day. Gated by `CRON_SECRET`,
 * which Vercel Cron sends as `Authorization: Bearer <secret>` on every invocation.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${requireEnv("CRON_SECRET")}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const result = await sendDueReminders();
  return NextResponse.json(result);
}
