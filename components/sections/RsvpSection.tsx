"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { GoldButtonLink } from "@/components/ui/GoldButtonLink";
import { RsvpCompanionModal } from "@/components/sections/RsvpCompanionModal";
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

/** Guest's personal page — real form backed by the database, editable indefinitely. */
export function RsvpSection({ guest }: RsvpSectionProps) {
  const [status, setStatus] = useState<RsvpStatus>(guest.rsvpStatus);
  const [companionNames, setCompanionNames] = useState(guest.companionNames);
  const [email, setEmail] = useState(guest.email);
  const [confirmationSent, setConfirmationSent] = useState(true);
  const [mode, setMode] = useState<"choosing" | "confirmed">(guest.rsvpStatus === "pending" ? "choosing" : "confirmed");
  const [modalIntent, setModalIntent] = useState<"yes" | "no">("yes");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const pastDeadline = isPastDeadline();
  const neverResponded = status === "pending";
  // After the deadline, self-serve editing closes — both for guests who already answered and for
  // those who never did — and they're routed to the planner instead.
  const showChoiceButtons = mode === "choosing" && !(pastDeadline && neverResponded);
  const showClosedContact = pastDeadline && (mode === "confirmed" || (mode === "choosing" && neverResponded));
  const plannerLastMinuteLink = buildWhatsAppLink(plannerWhatsAppNumber, whatsappMessages.rsvpLastMinute(guest.name));

  async function performSubmit(nextStatus: Exclude<RsvpStatus, "pending">, nextEmail: string, nextCompanionNames: string[]) {
    setSubmitting(true);
    setErrorMessage(undefined);

    const result = await submitRsvpAction(guest.token, {
      status: nextStatus,
      email: nextEmail || undefined,
      companionNames: nextCompanionNames,
    });

    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setStatus(nextStatus);
    setCompanionNames(result.companionNames);
    setEmail(nextEmail || email);
    setConfirmationSent(result.confirmationSent);
    setMode("confirmed");
    setModalOpen(false);

    // Only treat displayName as a real "family label" when it's distinct from the guest's own
    // name — a lone guest with no group display name set would otherwise read as "Jane Doe de la
    // Jane Doe", which is nonsensical.
    const familyLabel = guest.displayName !== guest.name ? guest.displayName : null;
    const plannerMessage =
      nextStatus === "yes"
        ? whatsappMessages.rsvpYes(guest.name, familyLabel, result.companionNames)
        : whatsappMessages.rsvpNo(guest.name);
    window.open(buildWhatsAppLink(plannerWhatsAppNumber, plannerMessage), "_blank");
  }

  function handleYesClick() {
    setModalIntent("yes");
    setModalOpen(true);
  }

  function handleNoClick() {
    setModalIntent("no");
    setModalOpen(true);
  }

  return (
    <RsvpShell>
      {showClosedContact && neverResponded && (
        <p className={styles.confirmation}>
          El tiempo para confirmar tu asistencia ya se cerró, te extrañaremos. Puedes contactarte con{" "}
          {faqContact.name} en caso de que tengas cualquier duda.
        </p>
      )}

      {mode === "confirmed" && status !== "pending" && (
        <div className={styles.confirmation}>
          {status === "yes" ? (
            companionNames.length > 0 ? (
              <>
                {guest.name}, gracias por confirmar su asistencia. Miembros confirmados: {companionNames.join(", ")}. Los esperamos!
              </>
            ) : (
              <>{guest.name}, gracias por confirmar tu asistencia. Te esperamos!</>
            )
          ) : (
            <>
              {guest.name}, Nos indicaste que no podrás acompañarnos. Te extrañaremos, pero te agradecemos que nos hayas avisado.
            </>
          )}
        </div>
      )}

      {mode === "confirmed" && status === "yes" && !confirmationSent && (
        <p className={styles.confirmationNote}>
          Tuvimos un problema enviando tu comprobante por correo; nuestro equipo lo revisará.
        </p>
      )}

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

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
      ) : showClosedContact ? (
        <div className={styles.closedWindow}>
          {!neverResponded && (
            <p className={styles.closedWindowText}>
              La ventana de confirmación ya cerró. Si necesitas cancelar tu asistencia o avisarnos de un cambio de
              último momento, contacta a <b>{faqContact.name}</b>, nuestra wedding planner.
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
            : "¿Cambiaste de planes? Todavía puedes editar tu respuesta"}
        </button>
      )}

      {modalOpen && (
        <RsvpCompanionModal
          intent={modalIntent}
          partySizeAllowed={guest.partySizeAllowed}
          initialEmail={email}
          initialCompanionNames={companionNames}
          submitting={submitting}
          errorMessage={errorMessage}
          onCancel={() => setModalOpen(false)}
          onConfirm={(nextEmail, names) => performSubmit(modalIntent, nextEmail, names)}
        />
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
