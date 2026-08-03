import { Reveal } from "@/components/ui/Reveal";
import { Photo } from "@/components/ui/Photo";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { coupleNames, wedding } from "@/config/site";
import styles from "./HeroSection.module.css";

/** Opening section: monogram, couple names, date, venue, and circular hero photo. */
export function HeroSection() {
  return (
    <section className={styles.section}>
      <Reveal>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/monogram.png" alt="Monograma J&C" className={styles.monogram} />
        <div className={styles.names}>{coupleNames.full}</div>
        <div className={styles.date}>{wedding.heroDateLabel}</div>
        <GoldDivider width={24} margin="0 auto 16px" />
        <div className={styles.venue}>
          {wedding.venueName}
          <br />
          {wedding.venueCity}
        </div>
        <div className={styles.photoFrame}>
          <div className={styles.photoShadow} />
          <Photo id="hero-photo" alt="Foto de la pareja" className={styles.heroPhoto} />
        </div>
      </Reveal>
    </section>
  );
}
