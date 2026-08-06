"use client";

import { useState } from "react";
import styles from "./RsvpCompanionFields.module.css";

interface RsvpCompanionFieldsProps {
  /** Total people allowed in the party, including the guest themselves. */
  partySizeAllowed: number;
  initialCompanionNames: string[];
  submitting: boolean;
  errorMessage?: string;
  /** Floor for the count selector — e.g. 1 when the primary guest has already declined and at least one named companion is required. Defaults to 0. */
  minCompanions?: number;
  onCancel: () => void;
  onConfirm: (companionNames: string[]) => void;
}

/**
 * Inline companion-count selector (capped at `partySizeAllowed - 1`) with one name input per
 * confirmed companion — shown directly under the "Sí, asistiré" button when the party is more
 * than one person. Email is no longer collected here: it's captured once, up front, at the
 * envelope gate, so this is the only remaining step for a "yes" RSVP.
 */
export function RsvpCompanionFields({
  partySizeAllowed,
  initialCompanionNames,
  submitting,
  errorMessage,
  minCompanions = 0,
  onCancel,
  onConfirm,
}: RsvpCompanionFieldsProps) {
  const maxCompanions = partySizeAllowed - 1;
  const [names, setNames] = useState<string[]>(() => {
    const base = initialCompanionNames.slice(0, maxCompanions);
    while (base.length < minCompanions) base.push("");
    return base;
  });

  function setCount(count: number) {
    const clamped = Math.max(minCompanions, Math.min(count, maxCompanions));
    setNames((prev) => {
      const next = prev.slice(0, clamped);
      while (next.length < clamped) next.push("");
      return next;
    });
  }

  function setNameAt(index: number, value: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  const namesValid = names.every((n) => n.trim().length > 0);

  return (
    <div className={styles.fields}>
      <label className={styles.fieldLabel}>
        ¿Cuántos de tus acompañantes asistirán?
        <select
          className={styles.countSelect}
          value={names.length}
          onChange={(e) => setCount(Number(e.target.value))}
          disabled={submitting}
        >
          {Array.from({ length: maxCompanions - minCompanions + 1 }, (_, i) => minCompanions + i).map((n) => (
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

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      {!namesValid && !submitting && names.length > 0 && (
        <p className={styles.fieldHint}>Escribí el nombre de cada acompañante.</p>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button
          type="button"
          className={styles.confirmButton}
          onClick={() => onConfirm(names.map((n) => n.trim()))}
          disabled={submitting || !namesValid}
        >
          {submitting ? "Guardando..." : "Confirmar"}
        </button>
      </div>
    </div>
  );
}
