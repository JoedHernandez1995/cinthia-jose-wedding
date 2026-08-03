import { Reveal } from "@/components/ui/Reveal";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { GoldButtonLink } from "@/components/ui/GoldButtonLink";
import { recommendationsLink, sectionIds } from "@/config/site";
import styles from "./RecommendationsSection.module.css";

/** "Recomendaciones" section linking out to the shared hospedaje/belleza/trajes list. */
export function RecommendationsSection() {
  return (
    <section id={sectionIds.recomendaciones} className={styles.section}>
      <Reveal>
        <div className={styles.heading}>Recomendaciones</div>
        <GoldDivider width={28} margin="0 auto" />
        <p className={styles.description}>
          Reunimos hospedaje, cabello y maquillaje, y alquiler de trajes de confianza en una sola lista.
        </p>
        <div className={styles.buttonWrap}>
          <GoldButtonLink href={recommendationsLink} target="_blank" rel="noopener">
            Ver lista de recomendaciones
          </GoldButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
