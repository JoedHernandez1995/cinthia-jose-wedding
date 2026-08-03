"use client";

import { coupleNames } from "@/config/site";
import { useEnvelopeAnimation } from "@/hooks/useEnvelopeAnimation";
import styles from "./EnvelopeIntro.module.css";

/** Full-screen envelope intro shown before the invitation content; dismisses itself once opened. */
export function EnvelopeIntro() {
  const { isOpen, isClosing, open } = useEnvelopeAnimation();

  if (isOpen) return null;

  return (
    <div className={`${styles.overlay} ${isClosing ? styles.overlayClosing : ""}`}>
      <div className={styles.eyebrow}>TIENES UNA INVITACIÓN</div>
      <div className={styles.from}>de</div>
      <div className={styles.names}>{coupleNames.full}</div>
      <button onClick={open} className={styles.envelopeButton}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/envelope.png" alt="Sobre" className={styles.envelopeImage} />
        <div className={styles.tapHint}>PRESIONA PARA ABRIR</div>
      </button>
    </div>
  );
}
