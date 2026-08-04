"use client";

import { useState } from "react";
import styles from "./RsvpCompanionModal.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RsvpCompanionModalProps {
  /** Total people allowed in the party, including the guest themselves. */
  partySizeAllowed: number;
  initialEmail: string | null;
  initialCompanionNames: string[];
  submitting: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onConfirm: (email: string, companionNames: string[]) => void;
}

/** Email (always required) + a companion count selector (capped at `partySizeAllowed - 1`) with one name input per confirmed companion. */
export function RsvpCompanionModal({
  partySizeAllowed,
  initialEmail,
  initialCompanionNames,
  submitting,
  errorMessage,
  onCancel,
  onConfirm,
}: RsvpCompanionModalProps) {
  const maxCompanions = partySizeAllowed - 1;
  const [email, setEmail] = useState(initialEmail ?? "");
  const [names, setNames] = useState<string[]>(() => {
    const initial = initialCompanionNames.slice(0, maxCompanions);
    return initial.length > 0 ? initial : [];
  });

  function setCount(count: number) {
    const clamped = Math.max(0, Math.min(count, maxCompanions));
    setNames((prev) => {
      const next = prev.slice(0, clamped);
      while (next.length < clamped) next.push("");
      return next;
    });
  }

  function setNameAt(index: number, value: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  const emailValid = EMAIL_RE.test(email.trim());
  const namesValid = names.every((n) => n.trim().length > 0);
  const canSubmit = emailValid && namesValid;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="rsvp-modal-heading">
      <div className={styles.modal}>
        <h3 id="rsvp-modal-heading" className={styles.heading}>
          Confirma tu asistencia
        </h3>

        <label className={styles.fieldLabel}>
          Correo electrónico
          <input
            type="email"
            required
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.nameInput}
            disabled={submitting}
          />
        </label>
        <p className={styles.fieldHint}>Te enviaremos tu comprobante con código QR a este correo.</p>

        {maxCompanions > 0 && (
          <>
            <label className={styles.fieldLabel}>
              ¿Cuántos de tus acompañantes asistirán?
              <select
                className={styles.countSelect}
                value={names.length}
                onChange={(e) => setCount(Number(e.target.value))}
                disabled={submitting}
              >
                {Array.from({ length: maxCompanions + 1 }, (_, n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "acompañante" : "acompañantes"}
                  </option>
                ))}
              </select>
            </label>

            {names.length > 0 && (
              <div className={styles.nameList}>
                {names.map((name, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`Nombre del acompañante ${i + 1}`}
                    value={name}
                    onChange={(e) => setNameAt(i, e.target.value)}
                    className={styles.nameInput}
                    disabled={submitting}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {errorMessage && <p className={styles.error}>{errorMessage}</p>}

        {!canSubmit && !submitting && (
          <p className={styles.fieldHint}>
            {!emailValid ? "Ingresa un correo electrónico válido." : "Escribe el nombre de cada acompañante."}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={() => onConfirm(email.trim(), names.map((n) => n.trim()))}
            disabled={submitting || !canSubmit}
          >
            {submitting ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
