"use client";

import { useState } from "react";
import type { GuestLocation } from "@/types/guest";
import styles from "./DebugPanel.module.css";

interface DebugPanelProps {
  guestLocation: GuestLocation | null;
  partySizeAllowed: number;
  onChange: (overrides: { guestLocation: GuestLocation; partySizeAllowed: number }) => void;
}

const MIN_PARTY_SIZE = 1;
const MAX_PARTY_SIZE = 10;

/**
 * Dev-only overlay for previewing the invitation under different guest states without touching
 * the database — only rendered when `?debug=1` is in the URL (see `InvitationPage`), so it never
 * shows up for a real guest's link. Toggling "Extranjero" shows/hides `LocationSection` and
 * `RecommendationsSection` and switches `GiftSection`'s account list, same as a real foreign
 * guest would see. Toggling party size changes how many companion fields the RSVP modal offers.
 *
 * These are purely client-side display overrides, not DB writes — actually submitting the RSVP
 * still validates against the test guest's real `party_size_allowed` on file (set that guest's
 * party size high enough in the admin panel first if you need to test submitting with companions).
 */
export function DebugPanel({ guestLocation, partySizeAllowed, onChange }: DebugPanelProps) {
  const [open, setOpen] = useState(true);
  const resolvedLocation: GuestLocation = guestLocation === "extranjero" ? "extranjero" : "local";

  return (
    <div className={styles.panel}>
      <button type="button" className={styles.toggle} onClick={() => setOpen((o) => !o)}>
        {open ? "Ocultar debug" : "Debug"}
      </button>
      {open && (
        <div className={styles.controls}>
          <div className={styles.row}>
            <span className={styles.label}>Ubicación</span>
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={resolvedLocation === "local" ? styles.active : ""}
                onClick={() => onChange({ guestLocation: "local", partySizeAllowed })}
              >
                Local
              </button>
              <button
                type="button"
                className={resolvedLocation === "extranjero" ? styles.active : ""}
                onClick={() => onChange({ guestLocation: "extranjero", partySizeAllowed })}
              >
                Extranjero
              </button>
            </div>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Personas: {partySizeAllowed}</span>
            <div className={styles.buttonGroup}>
              <button
                type="button"
                disabled={partySizeAllowed <= MIN_PARTY_SIZE}
                onClick={() =>
                  onChange({ guestLocation: resolvedLocation, partySizeAllowed: Math.max(MIN_PARTY_SIZE, partySizeAllowed - 1) })
                }
              >
                −
              </button>
              <button
                type="button"
                disabled={partySizeAllowed >= MAX_PARTY_SIZE}
                onClick={() =>
                  onChange({ guestLocation: resolvedLocation, partySizeAllowed: Math.min(MAX_PARTY_SIZE, partySizeAllowed + 1) })
                }
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
