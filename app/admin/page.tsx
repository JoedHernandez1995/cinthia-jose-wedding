import Link from "next/link";
import { getGuestSideBreakdown, listGuests } from "@/lib/guests";
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

  const cards = [
    { label: "Invitados totales", value: stats.total },
    { label: "Personas invitadas en total", value: stats.invitedPersonsTotal },
    { label: "Personas invitadas · Novio", value: stats.invitedPersonsNovio },
    { label: "Personas invitadas · Novia", value: stats.invitedPersonsNovia },
    { label: "Personas invitadas · Padres Novio", value: stats.invitedPersonsPadresNovio },
    { label: "Personas invitadas · Padres Novia", value: stats.invitedPersonsPadresNovia },
    { label: "Invitados locales", value: stats.local },
    { label: "Invitados del extranjero", value: stats.extranjero },
    { label: "Invitaciones enviadas", value: `${stats.invitesSent} / ${stats.total}` },
    { label: "Han visto la invitación", value: `${stats.viewed} / ${stats.total}` },
    { label: "Confirmados", value: stats.yes },
    { label: "No asistirán", value: stats.no },
    { label: "Pendientes", value: stats.pending },
    { label: "Total de asistentes confirmados", value: stats.attending },
    { label: "Acompañantes utilizados", value: `${stats.companionSlotsUsed} / ${stats.companionSlotsAllowed}` },
    { label: "Han llegado (check-in)", value: `${checkedInCount} / ${stats.attending}` },
  ];

  return (
    <div>
      <h1 className={styles.heading}>Resumen</h1>
      <div className={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} className={styles.card}>
            <div className={styles.cardValue}>{card.value}</div>
            <div className={styles.cardLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      <h2 className={styles.subheading}>Por lado</h2>
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
