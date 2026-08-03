"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { WHATSAPP_NUMBER, sectionIds, wedding, whatsappMessages } from "@/config/site";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { RsvpChoice } from "@/types/invitation";
import styles from "./RsvpSection.module.css";

const rsvpConfirmationCopy: Record<Exclude<RsvpChoice, null>, string> = {
  yes: "¡Gracias por confirmar! Nos vemos el 7 de noviembre 🎉",
  no: "¡Gracias por avisarnos! Te vamos a extrañar.",
};

const yesLink = buildWhatsAppLink(WHATSAPP_NUMBER, whatsappMessages.rsvpYes);
const noLink = buildWhatsAppLink(WHATSAPP_NUMBER, whatsappMessages.rsvpNo);

/**
 * R.S.V.P section. Attendance is confirmed via a `wa.me` deep link, not a
 * form submission — `rsvpChoice` only drives local confirmation copy/styling
 * and is never persisted.
 */
export function RsvpSection() {
  const [rsvpChoice, setRsvpChoice] = useState<RsvpChoice>(null);

  return (
    <section id={sectionIds.rsvp} className={styles.section}>
      <Reveal>
        <div className={styles.heading}>R.S.V.P</div>
        <GoldDivider width={28} margin="0 auto 18px" />
        <p className={styles.deadlineIntro}>Agradeceremos confirmar tu asistencia antes del</p>
        <p className={styles.deadlineDate}>{wedding.rsvpDeadlineLabel}</p>
        <div className={styles.card}>
          {rsvpChoice && <div className={styles.confirmation}>{rsvpConfirmationCopy[rsvpChoice]}</div>}
          <div className={styles.buttonList}>
            <a href={yesLink} onClick={() => setRsvpChoice("yes")} target="_blank" rel="noopener" className={styles.yesButton}>
              SÍ ASISTIRÉ
            </a>
            <a
              href={noLink}
              onClick={() => setRsvpChoice("no")}
              target="_blank"
              rel="noopener"
              className={`${styles.noButton} ${rsvpChoice === "no" ? styles.noButtonSelected : ""}`}
            >
              NO PODRÉ ASISTIR
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
