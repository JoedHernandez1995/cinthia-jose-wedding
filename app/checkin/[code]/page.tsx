import { checkInByCode } from "@/lib/guests";
import styles from "./page.module.css";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-HN", { dateStyle: "medium", timeStyle: "short" });
}

// Always hit the database — this is a live door check-in action, never cached.
export const dynamic = "force-dynamic";

/**
 * Door check-in scan target — this is the URL every QR code encodes. Staff opens it with their
 * phone's native camera (no in-app scanner needed); the page itself marks the person as checked
 * in and shows the result. Gated behind admin auth by `middleware.ts`.
 */
export default async function CheckinPage({ params }: { params: { code: string } }) {
  const result = await checkInByCode(params.code);

  if (!result) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <span className={`${styles.badge} ${styles.badgeNotFound}`}>Código no válido</span>
          <p className={styles.meta}>Este código de check-in no corresponde a ningún invitado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <span className={`${styles.badge} ${result.alreadyCheckedIn ? styles.badgeAlready : styles.badgeSuccess}`}>
          {result.alreadyCheckedIn ? "Ya registrado" : "Check-in exitoso"}
        </span>
        <h1 className={styles.name}>{result.personName}</h1>
        {result.isCompanion && <p className={styles.meta}>Acompañante de {result.guestName}</p>}
        <p className={styles.timestamp}>
          {result.alreadyCheckedIn ? "Hizo check-in el " : "Check-in registrado el "}
          {formatDate(result.checkedInAt)}
        </p>
      </div>
    </div>
  );
}
