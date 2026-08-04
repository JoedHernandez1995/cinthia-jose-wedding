"use client";

import { coupleNames } from "@/config/site";
import { useEnvelopeAnimation } from "@/hooks/useEnvelopeAnimation";
import type { GuestViewModel } from "@/types/guest";
import styles from "./EnvelopeIntro.module.css";

interface EnvelopeIntroProps {
  /** Always set: `EnvelopeIntro` only renders from a guest's personal `/i/[token]` page. */
  guest: GuestViewModel;
}

/** Full-screen envelope intro shown before the invitation content; dismisses itself once opened. */
export function EnvelopeIntro({ guest }: EnvelopeIntroProps) {
  const { isOpen, isClosing, open } = useEnvelopeAnimation();

  if (isOpen) return null;

  const hasCompanions = guest.partySizeAllowed > 1;

  return (
    <div className={`${styles.overlay} ${isClosing ? styles.overlayClosing : ""}`}>
      <div className={styles.guestName}>{guest.displayName}</div>
      <div className={styles.eyebrow}>{hasCompanions ? "TIENEN UNA INVITACIÓN" : "TIENES UNA INVITACIÓN"}</div>
      <div className={styles.from}>de</div>
      <div className={styles.names}>{coupleNames.full}</div>
      <div className={styles.validity}>
        VÁLIDO PARA {guest.partySizeAllowed} {guest.partySizeAllowed === 1 ? "PERSONA" : "PERSONAS"}
      </div>
      <button onClick={open} className={styles.envelopeButton}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/envelope.png" alt="Sobre" className={styles.envelopeImage} />
        <div className={styles.tapHint}>PRESIONA PARA ABRIR</div>
      </button>
    </div>
  );
}
