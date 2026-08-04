import type { SideBreakdown } from "@/lib/guests";
import styles from "./SideBreakdownChart.module.css";

const sideLabels: Record<SideBreakdown["side"], string> = {
  novio: "Lado del novio",
  novia: "Lado de la novia",
  sin_definir: "Sin definir",
};

const legend = [
  { key: "yes", label: "Confirmados", className: styles.segYes },
  { key: "no", label: "No asistirán", className: styles.segNo },
  { key: "pending", label: "Pendientes", className: styles.segPending },
] as const;

/** Horizontal stacked bar per side (novio/novia/sin definir), segmented by RSVP status. */
export function SideBreakdownChart({ data }: { data: SideBreakdown[] }) {
  const visible = data.filter((d) => d.side !== "sin_definir" || d.total > 0);

  return (
    <div className={styles.wrap}>
      {visible.map((d) => (
        <div key={d.side} className={styles.row}>
          <div className={styles.rowHead}>
            <span className={styles.rowLabel}>{sideLabels[d.side]}</span>
            <span className={styles.rowTotal}>{d.total} invitado{d.total === 1 ? "" : "s"}</span>
          </div>
          {d.total > 0 ? (
            <div className={styles.bar} role="img" aria-label={`${sideLabels[d.side]}: ${d.yes} confirmados, ${d.no} no asistirán, ${d.pending} pendientes`}>
              {d.yes > 0 && <div className={styles.segYes} style={{ flexGrow: d.yes }} />}
              {d.no > 0 && <div className={styles.segNo} style={{ flexGrow: d.no }} />}
              {d.pending > 0 && <div className={styles.segPending} style={{ flexGrow: d.pending }} />}
            </div>
          ) : (
            <div className={styles.barEmpty} />
          )}
        </div>
      ))}

      <div className={styles.legend}>
        {legend.map((item) => (
          <span key={item.key} className={styles.legendItem}>
            <span className={`${styles.swatch} ${item.className}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
