import { Reveal } from "@/components/ui/Reveal";
import { GoldButtonLink } from "@/components/ui/GoldButtonLink";
import { WHATSAPP_NUMBER, faqContact, faqs, sectionIds, whatsappMessages } from "@/config/site";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { GuestViewModel } from "@/types/guest";
import styles from "./FaqSection.module.css";

interface FaqSectionProps {
  guest: GuestViewModel;
}

/** "Preguntas Frecuentes" section: a WhatsApp contact prompt followed by the FAQ list. */
export function FaqSection({ guest }: FaqSectionProps) {
  // `guest.displayName` is already resolved (falls back to `guest.name` when no family label is
  // set), so comparing it against `guest.name` is how we detect a real display name is in play —
  // same rule as everywhere else this distinction matters: only go by it when there's also room
  // for others in the party.
  const isFamily = guest.displayName !== guest.name && guest.partySizeAllowed > 1;
  const whatsappContactLink = buildWhatsAppLink(
    WHATSAPP_NUMBER,
    whatsappMessages.faqContactQuestion(guest.name, guest.displayName, isFamily),
  );

  return (
    <section id={sectionIds.faq} className={styles.section}>
      <Reveal>
        <div className={styles.heading}>Preguntas Frecuentes</div>
        <div className={styles.contactPrompt}>
          <p className={styles.contactText}>
            Si tienen dudas o alguna consulta en específico, escríbanle a <b>{faqContact.name}</b>
          </p>
          <GoldButtonLink href={whatsappContactLink} target="_blank" rel="noopener">
            Contactar por WhatsApp
          </GoldButtonLink>
        </div>
        <div className={styles.list}>
          {faqs.map((faq) => (
            <div key={faq.id} className={styles.item}>
              <div className={styles.itemNumber}>{faq.id}</div>
              <div>
                <div className={styles.itemQuestion}>{faq.question}</div>
                <div className={styles.itemAnswer}>{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
