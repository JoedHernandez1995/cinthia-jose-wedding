import Link from "next/link";
import { getGuestSideBreakdown, listGuests } from "@/lib/guests";
import { wedding } from "@/config/site";
import { SideBreakdownChart } from "./SideBreakdownChart";
import styles from "./page.module.css";

export default async function AdminDashboardPage() {
  const [guests, sideBreakdown] = await Promise.all([listGuests(), getGuestSideBreakdown()]);

  const stats = {
    total: guests.length,
    invitesSent: guests.filter((g) => g.inviteSent).length,
    viewed: guests.filter((g) => g.viewCount > 0).length,
    yes: guests.filter((g) => g.rsvpStatus === "yes").length,
    no: guests.filter((g) => g.rsvpStatus === "no").length,
    pending: guests.filter((g) => g.rsvpStatus === "pending").length,
    attending: guests.reduce((sum, g) => sum + (g.rsvpStatus === "yes" ? (g.rsvpAttendingCount ?? 0) : 0), 0),
    // A "no" RSVP always means the entire invited party declined — the "some companions still
    // attend" case is represented as status "yes" with primaryAttending: false instead — so
    // partySizeAllowed is the exact declined headcount, not an estimate.
    declinedPeople: guests.reduce((sum, g) => sum + (g.rsvpStatus === "no" ? g.partySizeAllowed : 0), 0),
    // Pending guests haven't said how many of their allowed party will actually come, so this is an
    // upper bound (their full partySizeAllowed), not a confirmed headcount.
    pendingPeopleMax: guests.reduce((sum, g) => sum + (g.rsvpStatus === "pending" ? g.partySizeAllowed : 0), 0),
    // Invited capacity — every named guest's `partySizeAllowed` already counts them plus their
    // allowed plus-ones, regardless of whether they've responded yet.
    invitedPersonsTotal: guests.reduce((sum, g) => sum + g.partySizeAllowed, 0),
    invitedPersonsNovio: guests
      .filter((g) => g.invitedBy === "novio")
      .reduce((sum, g) => sum + g.partySizeAllowed, 0),
    invitedPersonsNovia: guests
      .filter((g) => g.invitedBy === "novia")
      .reduce((sum, g) => sum + g.partySizeAllowed, 0),
    invitedPersonsPadresNovio: guests
      .filter((g) => g.invitedBy === "padres_novio")
      .reduce((sum, g) => sum + g.partySizeAllowed, 0),
    invitedPersonsPadresNovia: guests
      .filter((g) => g.invitedBy === "padres_novia")
      .reduce((sum, g) => sum + g.partySizeAllowed, 0),
    // Plus-one slots granted vs. actually used — `partySizeAllowed - 1` per guest is the number of
    // companion slots on offer; only "yes" RSVPs can have used any of them.
    companionSlotsAllowed: guests.reduce((sum, g) => sum + Math.max(g.partySizeAllowed - 1, 0), 0),
    companionSlotsUsed: guests.reduce((sum, g) => sum + (g.rsvpStatus === "yes" ? g.companionNames.length : 0), 0),
    local: guests.filter((g) => g.guestLocation !== "extranjero").length,
    extranjero: guests.filter((g) => g.guestLocation === "extranjero").length,
  };

  // Same rule as the `/admin/checkin` board: a guest who declined while their named companions
  // still attend (`primaryAttending === false`) is never counted as arrived themselves.
  const checkedInCount = guests.reduce((sum, g) => {
    const guestArrived = g.primaryAttending !== false && g.checkedIn ? 1 : 0;
    const companionsArrived = g.companions.filter((c) => c.checkedIn).length;
    return sum + guestArrived + companionsArrived;
  }, 0);

  const responded = stats.yes + stats.no;
  const responseRate = stats.total > 0 ? Math.round((responded / stats.total) * 100) : 0;
  const deadlineMs = new Date(wedding.rsvpDeadlineIso).getTime();
  const pastDeadline = Date.now() > deadlineMs;
  const daysToDeadline = Math.ceil((deadlineMs - Date.now()) / 86_400_000);

  // The numbers an admin needs on every visit: overall progress, the three outcomes, and how much
  // time is left. Shown bigger/first — everything else is context, not a daily decision driver.
  // Confirmados/No asistirán/Pendientes lead with PEOPLE counts (what a planner needs for catering/
  // seating), not invitation-row counts — the row count is shown as a smaller sub-line instead, so
  // this never disagrees with the "Total de asistentes confirmados"-style number elsewhere.
  const primaryCards = [
    { label: "Respondieron", value: `${responseRate}%` },
    { label: "Confirmados", value: stats.attending, sub: `${stats.yes} invitación${stats.yes === 1 ? "" : "es"}` },
    { label: "No asistirán", value: stats.declinedPeople, sub: `${stats.no} invitación${stats.no === 1 ? "" : "es"}` },
    {
      label: "Pendientes (máx.)",
      value: stats.pendingPeopleMax,
      sub: `${stats.pending} invitación${stats.pending === 1 ? "" : "es"}`,
    },
    {
      label: wedding.rsvpDeadlineLabel,
      value: pastDeadline ? "Plazo vencido" : `${daysToDeadline} día${daysToDeadline === 1 ? "" : "s"}`,
      warning: pastDeadline,
    },
  ];

  // By-side invited capacity belongs next to the per-side breakdown, not competing with the daily
  // decision-driving numbers above.
  const sideCapacityCards = [
    { label: "Novio", value: stats.invitedPersonsNovio },
    { label: "Novia", value: stats.invitedPersonsNovia },
    { label: "Padres Novio", value: stats.invitedPersonsPadresNovio },
    { label: "Padres Novia", value: stats.invitedPersonsPadresNovia },
  ];

  const secondaryCards = [
    { label: "Invitados totales", value: stats.total },
    { label: "Personas invitadas en total", value: stats.invitedPersonsTotal },
    { label: "Invitados locales", value: stats.local },
    { label: "Invitados del extranjero", value: stats.extranjero },
    { label: "Invitaciones enviadas", value: `${stats.invitesSent} / ${stats.total}` },
    { label: "Han visto la invitación", value: `${stats.viewed} / ${stats.total}` },
    { label: "Acompañantes utilizados", value: `${stats.companionSlotsUsed} / ${stats.companionSlotsAllowed}` },
    { label: "Han llegado (check-in)", value: `${checkedInCount} / ${stats.attending}` },
  ];

  return (
    <div>
      <h1 className={styles.heading}>Resumen</h1>

      <div className={styles.primaryGrid}>
        {primaryCards.map((card) => (
          <div key={card.label} className={`${styles.primaryCard} ${card.warning ? styles.primaryCardWarning : ""}`}>
            <div className={styles.primaryCardValue}>{card.value}</div>
            <div className={styles.primaryCardLabel}>{card.label}</div>
            {"sub" in card && card.sub && <div className={styles.primaryCardSub}>{card.sub}</div>}
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {secondaryCards.map((card) => (
          <div key={card.label} className={styles.card}>
            <div className={styles.cardValue}>{card.value}</div>
            <div className={styles.cardLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      <h2 className={styles.subheading}>Por lado</h2>
      <div className={styles.sideCapacityRow}>
        {sideCapacityCards.map((card) => (
          <div key={card.label} className={styles.sideCapacityCard}>
            <div className={styles.sideCapacityValue}>{card.value}</div>
            <div className={styles.sideCapacityLabel}>{card.label}</div>
          </div>
        ))}
      </div>
      <SideBreakdownChart data={sideBreakdown} />

      <div className={styles.linkRow}>
        <Link href="/admin/guests" className={styles.link}>
          Ver lista de invitados →
        </Link>
        <Link href="/admin/checkin" className={styles.link}>
          Ver check-in →
        </Link>
      </div>
    </div>
  );
}
