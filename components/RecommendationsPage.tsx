import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { Accordion } from "@/components/ui/Accordion";
import { recommendationCategories } from "@/config/site";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { isHonduranMobileNumber } from "@/lib/phone";
import styles from "./RecommendationsPage.module.css";

interface RecommendationsPageProps {
  /** Guest's personal invitation token — the return link goes back to their exact `/i/[token]` page. */
  token: string;
}

/**
 * Standalone "Recomendaciones" page (hospedaje, cabello/maquillaje, alquiler de
 * trajes) for guests traveling from abroad. Lives at `/i/[token]/recomendaciones`
 * so the return button can always send the guest back to their own invitation.
 */
export function RecommendationsPage({ token }: RecommendationsPageProps) {
  const accordionItems = recommendationCategories.map((category) => ({
    id: category.id,
    title: category.title,
    content: (
      <div>
        {category.entries.map((entry) => (
          <div key={entry.name} className={styles.entry}>
            <div className={styles.entryName}>{entry.name}</div>
            {entry.description && <div className={styles.entryDescription}>{entry.description}</div>}
            {(entry.mapsLink || entry.phone || entry.link) && (
              <div className={styles.entryLinks}>
                {entry.mapsLink && (
                  <a href={entry.mapsLink} target="_blank" rel="noopener" className={styles.entryLink}>
                    Ver en Google Maps
                  </a>
                )}
                {entry.phone && isHonduranMobileNumber(entry.phone) && (
                  <a
                    href={buildWhatsAppLink(entry.phone.replace(/\D/g, ""))}
                    target="_blank"
                    rel="noopener"
                    className={styles.entryLink}
                  >
                    Escribir por WhatsApp
                  </a>
                )}
                {entry.phone && !isHonduranMobileNumber(entry.phone) && (
                  <a href={`tel:${entry.phone.replace(/\D/g, "")}`} className={styles.entryLink}>
                    Llamar
                  </a>
                )}
                {entry.link && (
                  <a href={entry.link} target="_blank" rel="noopener" className={styles.entryLink}>
                    Ver más
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    ),
  }));

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href={`/i/${token}`} className={styles.backLink}>
          <span className={styles.backArrow}>←</span> Volver a la invitación
        </Link>

        <Reveal>
          <div className={styles.header}>
            <div className={styles.eyebrow}>Con cariño para vos</div>
            <h1 className={styles.heading}>Recomendaciones</h1>
            <p className={styles.intro}>
              Sabemos que venís desde lejos para acompañarnos, así que reunimos algunas opciones de
              hospedaje, cabello y maquillaje, y alquiler de trajes que nos encantan, para que tu viaje
              sea aún más especial.
            </p>
          </div>

          <div className={styles.accordionWrap}>
            <GoldDivider width={28} margin="0 auto 12px" />
            <Accordion items={accordionItems} />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
