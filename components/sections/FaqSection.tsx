import { Reveal } from "@/components/ui/Reveal";
import { GoldButtonLink } from "@/components/ui/GoldButtonLink";
import { WHATSAPP_NUMBER, faqContact, faqs, sectionIds } from "@/config/site";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import styles from "./FaqSection.module.css";

const whatsappContactLink = buildWhatsAppLink(WHATSAPP_NUMBER);

/** "Preguntas Frecuentes" section: a WhatsApp contact prompt followed by the FAQ list. */
export function FaqSection() {
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
