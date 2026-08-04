"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { RsvpCompanionModal } from "@/components/sections/RsvpCompanionModal";
import { WHATSAPP_NUMBER, plannerWhatsAppNumber, sectionIds, wedding, whatsappMessages } from "@/config/site";
import { buildPlannerNotificationMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { submitRsvpAction } from "@/app/i/[token]/actions";
import type { GuestViewModel, RsvpStatus } from "@/types/guest";
import type { RsvpChoice } from "@/types/invitation";
import styles from "./RsvpSection.module.css";

const genericConfirmationCopy: Record<Exclude<RsvpChoice, null>, string> = {
  yes: "¡Gracias por confirmar! Nos vemos el 7 de noviembre 🎉",
  no: "¡Gracias por avisarnos! Te vamos a extrañar.",
};

const genericYesLink = buildWhatsAppLink(WHATSAPP_NUMBER, whatsappMessages.rsvpYes);
const genericNoLink = buildWhatsAppLink(WHATSAPP_NUMBER, whatsappMessages.rsvpNo);

const isPastDeadline = () => Date.now() > new Date(wedding.rsvpDeadlineIso).getTime();

interface RsvpSectionProps {
  /** Only set on a guest's personal `/i/[token]` page. Root `/` renders the generic fallback below. */
  guest?: GuestViewModel;
}

export function RsvpSection({ guest }: RsvpSectionProps) {
  if (guest) return <GuestRsvpForm guest={guest} />;
  return <GenericRsvpFallback />;
}

/** Root `/` (no guest identity) — unchanged from before: static `wa.me` links, no persistence. */
function GenericRsvpFallback() {
  const [rsvpChoice, setRsvpChoice] = useState<RsvpChoice>(null);

  return (
    <RsvpShell>
      {rsvpChoice && <div className={styles.confirmation}>{genericConfirmationCopy[rsvpChoice]}</div>}
      <div className={styles.buttonList}>
        <a href={genericYesLink} onClick={() => setRsvpChoice("yes")} target="_blank" rel="noopener" className={styles.yesButton}>
          SÍ ASISTIRÉ
        </a>
        <a
          href={genericNoLink}
          onClick={() => setRsvpChoice("no")}
          target="_blank"
          rel="noopener"
          className={`${styles.noButton} ${rsvpChoice === "no" ? styles.noButtonSelected : ""}`}
        >
          NO PODRÉ ASISTIR
        </a>
      </div>
    </RsvpShell>
  );
}

/** Guest's personal page — real form backed by the database, editable indefinitely. */
function GuestRsvpForm({ guest }: { guest: GuestViewModel }) {
  const [status, setStatus] = useState<RsvpStatus>(guest.rsvpStatus);
  const [attendingCount, setAttendingCount] = useState(guest.rsvpAttendingCount);
  const [companionNames, setCompanionNames] = useState(guest.companionNames);
  const [email, setEmail] = useState(guest.email);
  const [confirmationSent, setConfirmationSent] = useState(true);
  const [mode, setMode] = useState<"choosing" | "confirmed">(guest.rsvpStatus === "pending" ? "choosing" : "confirmed");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

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
    setAttendingCount(result.rsvpAttendingCount);
    setCompanionNames(result.companionNames);
    setEmail(nextEmail || email);
    setConfirmationSent(result.confirmationSent);
    setMode("confirmed");
    setModalOpen(false);

    const plannerMessage = buildPlannerNotificationMessage(guest.name, nextStatus, result.companionNames);
    window.open(buildWhatsAppLink(plannerWhatsAppNumber, plannerMessage), "_blank");
  }

  function handleYesClick() {
    setModalOpen(true);
  }

  function handleNoClick() {
    performSubmit("no", "", []);
  }

  return (
    <RsvpShell>
      {isPastDeadline() && mode === "choosing" && (
        <p className={styles.confirmation}>
          La fecha límite para confirmar ({wedding.rsvpDeadlineLabel}) ya pasó, pero con gusto recibimos tu respuesta.
        </p>
      )}

      {mode === "confirmed" && status !== "pending" && (
        <div className={styles.confirmation}>
          {status === "yes" ? (
            <>
              Confirmaste: tú{attendingCount && attendingCount > 1 ? ` + ${attendingCount - 1}` : ""}
              {attendingCount && attendingCount > 1 && (attendingCount - 1 === 1 ? " acompañante" : " acompañantes")}
              {companionNames.length > 0 && <> ({companionNames.join(", ")})</>}
            </>
          ) : (
            "Indicaste que no podrás asistir."
          )}
        </div>
      )}

      {mode === "confirmed" && status === "yes" && !confirmationSent && (
        <p className={styles.confirmationNote}>
          Tuvimos un problema enviando tu comprobante por correo; nuestro equipo lo revisará.
        </p>
      )}

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      {mode === "choosing" ? (
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
      ) : (
        <button type="button" className={styles.editButton} onClick={() => setMode("choosing")}>
          Editar respuesta
        </button>
      )}

      {modalOpen && (
        <RsvpCompanionModal
          partySizeAllowed={guest.partySizeAllowed}
          initialEmail={email}
          initialCompanionNames={companionNames}
          submitting={submitting}
          errorMessage={errorMessage}
          onCancel={() => setModalOpen(false)}
          onConfirm={(nextEmail, names) => performSubmit("yes", nextEmail, names)}
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
