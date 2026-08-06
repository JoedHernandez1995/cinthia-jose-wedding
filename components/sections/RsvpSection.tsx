"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { GoldButtonLink } from "@/components/ui/GoldButtonLink";
import { RsvpCompanionFields } from "@/components/sections/RsvpCompanionFields";
import { faqContact, plannerWhatsAppNumber, sectionIds, wedding, whatsappMessages } from "@/config/site";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { submitRsvpAction } from "@/app/i/[token]/actions";
import type { GuestViewModel, RsvpStatus } from "@/types/guest";
import styles from "./RsvpSection.module.css";

const isPastDeadline = () => Date.now() > new Date(wedding.rsvpDeadlineIso).getTime();

interface RsvpSectionProps {
  /** Always set: `RsvpSection` only renders from a guest's personal `/i/[token]` page. */
  guest: GuestViewModel;
}

/**
 * Guest's personal page — real form backed by the database, editable indefinitely. Email is
 * already on file by the time this renders (collected at the envelope gate), so "No podré
 * asistir" submits immediately and "Sí, asistiré" only needs an extra step when the party is
 * more than one person (to collect companion names).
 */
export function RsvpSection({ guest }: RsvpSectionProps) {
  const [status, setStatus] = useState<RsvpStatus>(guest.rsvpStatus);
  const [companionNames, setCompanionNames] = useState(guest.companionNames);
  const [confirmationSent, setConfirmationSent] = useState(true);
  const [mode, setMode] = useState<"choosing" | "collecting" | "confirmed">(
    guest.rsvpStatus === "pending" ? "choosing" : "confirmed",
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const maxCompanions = guest.partySizeAllowed - 1;
  const pastDeadline = isPastDeadline();
  const neverResponded = status === "pending";
  // After the deadline, self-serve editing closes — both for guests who already answered and for
  // those who never did — and they're routed to the planner instead.
  const showChoiceButtons = mode === "choosing" && !(pastDeadline && neverResponded);
  const showClosedContact = pastDeadline && (mode === "confirmed" || (mode === "choosing" && neverResponded));
  const plannerLastMinuteLink = buildWhatsAppLink(plannerWhatsAppNumber, whatsappMessages.rsvpLastMinute(guest.name));

  async function performSubmit(nextStatus: Exclude<RsvpStatus, "pending">, nextCompanionNames: string[]) {
    setSubmitting(true);
    setErrorMessage(undefined);

    const result = await submitRsvpAction(guest.token, {
      status: nextStatus,
      email: guest.email ?? undefined,
      companionNames: nextCompanionNames,
    });

    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setStatus(nextStatus);
    setCompanionNames(result.companionNames);
    setConfirmationSent(result.confirmationSent);
    setMode("confirmed");
  }

  function handleYesClick() {
    if (maxCompanions > 0) {
      setErrorMessage(undefined);
      setMode("collecting");
    } else {
      performSubmit("yes", []);
    }
  }

  function handleNoClick() {
    performSubmit("no", []);
  }

  return (
    <RsvpShell>
      {showClosedContact && neverResponded && (
        <p className={styles.confirmation}>
          El tiempo para confirmar tu asistencia ya se cerró, te vamos a extrañar. Podés contactarte con{" "}
          {faqContact.name} si tenés cualquier duda.
        </p>
      )}

      {mode === "confirmed" && status !== "pending" && (
        <div className={styles.confirmation}>
          {status === "yes" ? (
            companionNames.length > 0 ? (
              <>
                {guest.name}, ¡gracias por confirmar! Van a venir junto con: {companionNames.join(", ")}. Los esperamos con muchas ganas.
              </>
            ) : (
              <>{guest.name}, ¡gracias por confirmar! Te esperamos con muchas ganas.</>
            )
          ) : (
            <>
              {guest.name}, nos avisaste que no vas a poder acompañarnos. Te vamos a extrañar, pero gracias por decirnos.
            </>
          )}
        </div>
      )}

      {mode === "confirmed" && status === "yes" && (
        <p className={styles.nextStepsNote}>
          Antes de irte, revisá el <a href={`#${sectionIds.vestimenta}`}>código de vestimenta</a>
          {guest.guestLocation === "extranjero" ? (
            <>
              {" "}
              y nuestras <a href={`#${sectionIds.recomendaciones}`}>recomendaciones</a> para tu viaje.
            </>
          ) : (
            " para que estés preparado para celebrar con nosotros."
          )}
        </p>
      )}

      {mode === "confirmed" && status === "yes" && !confirmationSent && (
        <p className={styles.confirmationNote}>
          Tuvimos un problema enviando tu comprobante por correo; nuestro equipo lo revisará.
        </p>
      )}

      {errorMessage && mode !== "collecting" && <p className={styles.error}>{errorMessage}</p>}

      {showChoiceButtons ? (
        <div className={styles.buttonList}>
          <button type="button" onClick={handleYesClick} disabled={submitting} className={styles.yesButton}>
            SÍ ASISTIRÉ
          </button>
          <button
            type="button"
            onClick={handleNoClick}
            disabled={submitting}
            className={`${styles.noButton} ${status === "no" ? styles.noButtonSelected : ""}`}
          >
            NO PODRÉ ASISTIR
          </button>
        </div>
      ) : mode === "collecting" ? (
        <RsvpCompanionFields
          partySizeAllowed={guest.partySizeAllowed}
          initialCompanionNames={companionNames}
          submitting={submitting}
          errorMessage={errorMessage}
          onCancel={() => {
            setErrorMessage(undefined);
            setMode("choosing");
          }}
          onConfirm={(names) => performSubmit("yes", names)}
        />
      ) : showClosedContact ? (
        <div className={styles.closedWindow}>
          {!neverResponded && (
            <p className={styles.closedWindowText}>
              La ventana de confirmación ya cerró. Si necesitás cancelar tu asistencia o avisarnos de un cambio de
              último momento, contactá a <b>{faqContact.name}</b>, nuestra wedding planner.
            </p>
          )}
          <GoldButtonLink href={plannerLastMinuteLink} target="_blank" rel="noopener">
            Contactar a {faqContact.name}
          </GoldButtonLink>
        </div>
      ) : (
        <button type="button" className={styles.editButton} onClick={() => setMode("choosing")}>
          {companionNames.length > 0
            ? "¿Cambiaron de planes? Todavía pueden editar su respuesta"
            : "¿Cambiaste de planes? Todavía podés editar tu respuesta"}
        </button>
      )}
    </RsvpShell>
  );
}

function RsvpShell({ children }: { children: React.ReactNode }) {
  return (
    <section id={sectionIds.rsvp} className={styles.section}>
      <Reveal>
        <div className={styles.heading}>R.S.V.P</div>
        <GoldDivider width={28} margin="0 auto 18px" />
        <p className={styles.deadlineIntro}>Agradeceremos confirmar tu asistencia antes del</p>
        <p className={styles.deadlineDate}>{wedding.rsvpDeadlineLabel}</p>
        <div className={styles.card}>{children}</div>
      </Reveal>
    </section>
  );
}
