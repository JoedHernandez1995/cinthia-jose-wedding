import { Reveal } from "@/components/ui/Reveal";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { GoldButtonLink } from "@/components/ui/GoldButtonLink";
import { OutlineButtonLink } from "@/components/ui/OutlineButtonLink";
import { WHATSAPP_NUMBER, pinterestLinks, sectionIds, whatsappMessages } from "@/config/site";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import styles from "./DressCodeSection.module.css";

const dressCodeQuestionLink = buildWhatsAppLink(WHATSAPP_NUMBER, whatsappMessages.dressCodeQuestion);

interface DressCodeCardProps {
  title: string;
  description: React.ReactNode;
  pinterestLink: string;
}

function DressCodeCard({ title, description, pinterestLink }: DressCodeCardProps) {
  return (
    <div className={styles.card}>
      <GoldDivider width={32} margin="0 auto 18px" />
      <div className={styles.cardTitle}>{title}</div>
      <div className={styles.cardDescription}>{description}</div>
      <OutlineButtonLink href={pinterestLink} target="_blank" rel="noopener">
        Ver Ejemplos
      </OutlineButtonLink>
    </div>
  );
}

/** "Vestimenta" section: dress code guidance for men and women, plus a WhatsApp Q&A link. */
export function DressCodeSection() {
  return (
    <section id={sectionIds.vestimenta} className={styles.section}>
      <Reveal>
        <div className={styles.heading}>Vestimenta</div>
        <p className={styles.intro}>
          Nos encantaría que el día de nuestra boda se sienta atemporal, elegante y romántico, en honor a los
          novios, te pedimos vestir de color negro.
        </p>
        <div className={styles.cardList}>
          <DressCodeCard
            title="Caballeros"
            pinterestLink={pinterestLinks.men}
            description={
              <>
                Traje o esmoquin de color <b className={styles.blackBold}>negro</b>, camisa blanca, corbatín (no
                corbata) y zapatos <b className={styles.blackBoldAlt}>negros</b>.
              </>
            }
          />
          <DressCodeCard
            title="Damas"
            pinterestLink={pinterestLinks.women}
            description={
              <>
                Vestido largo de gala, color <b className={styles.blackBold}>negro</b>.
              </>
            }
          />
        </div>
        <p className={styles.questionPrompt}>
          <GoldButtonLink href={dressCodeQuestionLink}>Dudas sobre tu atuendo, presiona aquí</GoldButtonLink>
        </p>
      </Reveal>
    </section>
  );
}
