import { GoldDivider } from "@/components/ui/GoldDivider";
import { coupleNames } from "@/config/site";
import styles from "./HomeLanding.module.css";

/**
 * Shown at the root `/` for visitors without a personal invitation link. The full invitation
 * (envelope intro, RSVP, etc.) only renders at a guest's own `/i/[token]` URL.
 */
export function HomeLanding() {
  return (
    <div className={styles.wrap}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/monogram.png" alt="Monograma J&C" className={styles.monogram} />
      <div className={styles.names}>{coupleNames.full}</div>
      <div className={styles.date}>07 · 11 · 2026</div>
      <GoldDivider width={28} margin="0 auto 28px" />
      <p className={styles.note}>Esta invitación es personal. Revisa el enlace que te compartimos.</p>
    </div>
  );
}
