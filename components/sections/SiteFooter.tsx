import { Reveal } from "@/components/ui/Reveal";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { coupleNames } from "@/config/site";
import styles from "./SiteFooter.module.css";

/** Closing footer: monogram, couple names, and the wedding date. */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Reveal>
        <div className={styles.monogramWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/monogram.png" alt="Monograma J&C" className={styles.monogram} />
        </div>
        <div className={styles.names}>{coupleNames.full}</div>
        <GoldDivider width={20} margin="0 auto 12px" />
        <div className={styles.date}>07 · 11 · 2026</div>
      </Reveal>
    </footer>
  );
}
