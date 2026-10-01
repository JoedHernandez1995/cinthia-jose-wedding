import "server-only";
import { sendRsvpReminderEmail } from "@/lib/email";
import { listGuests, markReminderFailed, markReminderSent } from "@/lib/guests";
import type { Guest } from "@/types/guest";

/**
 * Emails a guest who opened the invitation but hasn't RSVP'd yet, with a link straight to
 * `/i/[token]#rsvp`. Never throws — failures are recorded on the guest row and reflected back as
 * `false`, mirroring `sendGuestConfirmation`'s never-block semantics.
 */
export async function sendGuestReminder(guest: Guest): Promise<boolean> {
  if (!guest.email) return false;
  if (guest.rsvpStatus !== "pending") return false;
  if (guest.viewCount <= 0) return false;

  try {
    await sendRsvpReminderEmail({
      to: guest.email,
      guestName: guest.displayName ?? guest.name,
      token: guest.token,
    });
    await markReminderSent(guest.id);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await markReminderFailed(guest.id, message).catch(() => {});
    return false;
  }
}

/**
 * The automated reminder campaign's cadence, in days between sends, ramping up as the RSVP
 * deadline (`wedding.rsvpDeadlineIso`, 2026-09-30) approaches: every 7 days in August, every 3
 * days in September, daily in the final week (Sep 23–29). CAMPAIGN_END intentionally sits a day
 * before the actual deadline (23:59:59 on the 30th) — no automated reminder goes out on the
 * deadline day itself; a guest who's still pending by then is handled by the closure-notice flow
 * instead (see lib/closureNotice.ts) once the window actually closes. All boundaries are Honduras
 * local time (-06:00, no DST), matching every other hardcoded wedding date in `config/site.ts`.
 */
const CAMPAIGN_START = new Date("2026-08-01T00:00:00-06:00");
const SEPTEMBER_START = new Date("2026-09-01T00:00:00-06:00");
const FINAL_WEEK_START = new Date("2026-09-23T00:00:00-06:00");
const CAMPAIGN_END = new Date("2026-09-30T00:00:00-06:00");

/** Returns the reminder cadence (in days) in effect for `now`, or `null` if outside the campaign window. */
export function getReminderIntervalDays(now: Date): number | null {
  if (now < CAMPAIGN_START || now >= CAMPAIGN_END) return null;
  if (now >= FINAL_WEEK_START) return 1;
  if (now >= SEPTEMBER_START) return 3;
  return 7;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A guest is due once at least `intervalDays` have passed since their last reminder — or, for a
 * guest who's never been reminded yet, since they first opened the invitation. That anchor-on-
 * first-view rule is what makes August's "starts 7 days after each guest's own first view" behavior
 * fall out naturally: there's no shared campaign clock, only a per-guest one.
 */
function isGuestDue(guest: Guest, now: Date, intervalDays: number): boolean {
  if (guest.rsvpStatus !== "pending" || guest.viewCount <= 0 || !guest.email) return false;
  const anchor = guest.reminderSentAt ?? guest.firstViewedAt;
  if (!anchor) return false;
  return now.getTime() - new Date(anchor).getTime() >= intervalDays * DAY_MS;
}

export interface ReminderCampaignResult {
  intervalDays: number | null;
  attempted: number;
  sent: number;
  failed: number;
}

/** Concurrent Resend calls to make at once — bounded for the same reason as the admin bulk queue. */
const CONCURRENCY = 3;

/**
 * Entry point for the daily cron (`app/api/cron/reminders/route.ts`). Figures out today's cadence,
 * finds every guest due for a nudge under it, and sends. A single daily trigger covers every
 * cadence in the campaign, since "due" is a threshold check against the last send, not a fixed
 * time of day.
 */
export async function sendDueReminders(now: Date = new Date()): Promise<ReminderCampaignResult> {
  const intervalDays = getReminderIntervalDays(now);
  if (intervalDays === null) return { intervalDays: null, attempted: 0, sent: 0, failed: 0 };

  const guests = await listGuests();
  const dueGuests = guests.filter((guest) => isGuestDue(guest, now, intervalDays));

  let sent = 0;
  let failed = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < dueGuests.length) {
      const guest = dueGuests[cursor];
      cursor += 1;
      const ok = await sendGuestReminder(guest);
      if (ok) sent += 1;
      else failed += 1;
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, dueGuests.length) }, worker));

  return { intervalDays, attempted: dueGuests.length, sent, failed };
}
