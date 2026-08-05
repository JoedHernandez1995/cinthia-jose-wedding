import { Reveal } from "@/components/ui/Reveal";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { GoldButtonLink } from "@/components/ui/GoldButtonLink";
import { sectionIds } from "@/config/site";
import type { GuestViewModel } from "@/types/guest";
import styles from "./RecommendationsSection.module.css";

interface RecommendationsSectionProps {
  guest: GuestViewModel;
}

/** "Recomendaciones" teaser linking to the guest's dedicated hospedaje/belleza/trajes page. */
export function RecommendationsSection({ guest }: RecommendationsSectionProps) {
  return (
    <section id={sectionIds.recomendaciones} className={styles.section}>
      <Reveal>
        <div className={styles.heading}>Recomendaciones</div>
        <GoldDivider width={28} margin="0 auto" />
        <p className={styles.description}>
          Juntamos en un solo lugar hospedaje, cabello y maquillaje, y alquiler de trajes que recomendamos con confianza.
        </p>
        <div className={styles.buttonWrap}>
          <GoldButtonLink href={`/i/${guest.token}/recomendaciones`}>
            Ver lista de recomendaciones
          </GoldButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
