"use client";

import { useState } from "react";
import { coupleNames } from "@/config/site";
import { useEnvelopeAnimation } from "@/hooks/useEnvelopeAnimation";
import { setGuestEmailAction } from "@/app/i/[token]/actions";
import type { GuestViewModel } from "@/types/guest";
import styles from "./EnvelopeIntro.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EnvelopeIntroProps {
  /** Always set: `EnvelopeIntro` only renders from a guest's personal `/i/[token]` page. */
  guest: GuestViewModel;
  /** Called once the guest's email is saved, so the parent can update its own copy of `guest`. */
  onEmailSaved: (email: string) => void;
}

/**
 * Full-screen envelope intro shown before the invitation content; dismisses itself once opened.
 * A guest with no email on file must enter one first — the envelope won't open without it, since
 * that email is how they'll receive their RSVP confirmation later.
 */
export function EnvelopeIntro({ guest, onEmailSaved }: EnvelopeIntroProps) {
  const { isOpen, isClosing, open } = useEnvelopeAnimation();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  if (isOpen) return null;

  const hasCompanions = guest.partySizeAllowed > 1;
  const needsEmail = !guest.email;

  async function handleOpenClick() {
    if (!needsEmail) {
      open();
      return;
    }

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Ingresa un correo electrónico válido para continuar.");
      return;
    }

    setSubmitting(true);
    setError(undefined);
    const result = await setGuestEmailAction(guest.token, trimmed);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onEmailSaved(trimmed);
    open();
  }

  return (
    <div className={`${styles.overlay} ${isClosing ? styles.overlayClosing : ""}`}>
      <div className={styles.guestName}>{guest.displayName}</div>
      <div className={styles.eyebrow}>{hasCompanions ? "TIENEN UNA INVITACIÓN" : "TIENES UNA INVITACIÓN"}</div>
      <div className={styles.from}>de</div>
      <div className={styles.names}>{coupleNames.full}</div>
      <div className={styles.validity}>
        VÁLIDO PARA {guest.partySizeAllowed} {guest.partySizeAllowed === 1 ? "PERSONA" : "PERSONAS"}
      </div>

      {needsEmail && (
        <div className={styles.emailGate}>
          <input
            type="email"
            required
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.emailInput}
            disabled={submitting}
          />
          <p className={styles.emailHint}>Ingresa tu correo para ver tu invitación.</p>
          {error && <p className={styles.emailError}>{error}</p>}
        </div>
      )}

      <button onClick={handleOpenClick} disabled={submitting} className={styles.envelopeButton}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/envelope.png" alt="Sobre" className={styles.envelopeImage} />
        <div className={styles.tapHint}>{submitting ? "GUARDANDO..." : "PRESIONA PARA ABRIR"}</div>
      </button>
    </div>
  );
}
