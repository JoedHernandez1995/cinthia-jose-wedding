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
  };

  const cards = [
    { label: "Invitados totales", value: stats.total },
    { label: "Invitaciones enviadas", value: `${stats.invitesSent} / ${stats.total}` },
    { label: "Han visto la invitación", value: `${stats.viewed} / ${stats.total}` },
    { label: "Confirmados", value: stats.yes },
    { label: "No asistirán", value: stats.no },
    { label: "Pendientes", value: stats.pending },
    { label: "Total de asistentes confirmados", value: stats.attending },
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

      <Link href="/admin/guests" className={styles.link}>
        Ver lista de invitados →
      </Link>
    </div>
  );
}
