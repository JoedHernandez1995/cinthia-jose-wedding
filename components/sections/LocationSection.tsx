import { Reveal } from "@/components/ui/Reveal";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { GoldButtonLink } from "@/components/ui/GoldButtonLink";
import { mapsLink, wedding } from "@/config/site";
import styles from "./LocationSection.module.css";

const directions = [
  'La forma más cómoda de llegar es en Uber, fácil de conseguir en Tegucigalpa, buscá "Hacienda El Trapiche" o "La Cuisinete" y llegás sin problema.',
  "Si venís en vehículo propio, buscá los mismos nombres en tu GPS: vas a encontrar parqueo disponible en el lugar, incluyendo servicio de valet.",
];

/** "Ubicación" section with the venue address and directions guidance. */
export function LocationSection() {
  return (
    <section className={styles.section}>
      <Reveal>
        <div className={styles.heading}>Ubicación</div>
        <GoldDivider width={28} margin="0 auto 24px" />
        <div className={styles.address}>{wedding.venueAddress}</div>
        <div className={styles.directions}>
          {directions.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className={styles.buttonWrap}>
          <GoldButtonLink href={mapsLink}>Ver ubicación en Google Maps</GoldButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
