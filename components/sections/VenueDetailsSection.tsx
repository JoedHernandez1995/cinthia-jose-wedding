import { Reveal } from "@/components/ui/Reveal";
import { Photo } from "@/components/ui/Photo";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { AddToCalendarButton } from "@/components/ui/AddToCalendarButton";
import { calendarEvent, sectionIds, wedding } from "@/config/site";
import { useLiveCountdown } from "@/hooks/useLiveCountdown";
import styles from "./VenueDetailsSection.module.css";

const weddingTargetDate = new Date(wedding.dateTimeIso);

/** "Lugar y Fecha" section: venue photos, live countdown, and add-to-calendar action. */
export function VenueDetailsSection() {
  const countdownUnits = useLiveCountdown(weddingTargetDate);

  return (
    <section id={sectionIds.detalles} className={styles.section}>
      <Reveal>
        <div className={styles.heading}>Lugar y Fecha</div>
        <GoldDivider width={28} margin="0 auto 60px" />
        <div className={styles.venueName}>{wedding.venueName}</div>
        <div className={styles.dateLabel}>{wedding.dateLabel}</div>
        <div className={styles.timeLabel}>{wedding.timeLabel}</div>
        <div className={styles.adultsOnlyNote}>
          Amamos a los niños, pero esta celebración será exclusivamente para adultos. Gracias por entendernos.
        </div>
        <div className={styles.photoStack}>
          <div className={styles.mainPhotoFrame}>
            <Photo id="venue-photo" alt="Foto de Hacienda El Trapiche" className={styles.mainPhoto} />
          </div>
          <div className={styles.overlapPhotoFrame}>
            <Photo id="venue-photo-2" alt="Foto de Hacienda El Trapiche" className={styles.overlapPhoto} />
          </div>
        </div>
        <div className={styles.wideFrame}>
          <Photo id="venue-photo-3" alt="Foto de Hacienda El Trapiche" className={styles.widePhoto} />
        </div>
        <GoldDivider width={48} margin="32px auto" />
        <div className={styles.countdownLabel}>NUESTRO PRÓXIMO CAPÍTULO COMIENZA EN</div>
        <div className={styles.countdownRow}>
          {countdownUnits.map((unit) => (
            <div key={unit.label} className={styles.countdownUnit}>
              <div className={styles.countdownValue}>{unit.value}</div>
              <div className={styles.countdownUnitLabel}>{unit.label}</div>
            </div>
          ))}
        </div>
        <div className={styles.calendarButtonWrap}>
          <AddToCalendarButton event={calendarEvent} fileName={calendarEvent.fileName}>
            Agregar al calendario
          </AddToCalendarButton>
        </div>
      </Reveal>
    </section>
  );
}
