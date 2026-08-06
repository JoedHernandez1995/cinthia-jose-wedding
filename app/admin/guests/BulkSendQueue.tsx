"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GuestRowView } from "./GuestTable";
import { markInviteSentAction } from "./actions";
import styles from "./BulkSendQueue.module.css";

interface BulkSendQueueProps {
  kind: "invite" | "reminder";
  guests: GuestRowView[];
  excludedCount: number;
  onClose: () => void;
}

/**
 * WhatsApp has no bulk-send API in scope here — every `wa.me` link still needs a human tap. This
 * just lets the admin tap through a preselected list in one place instead of hunting each guest
 * down in the full table.
 */
export function BulkSendQueue({ kind, guests, excludedCount, onClose }: BulkSendQueueProps) {
  const router = useRouter();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleSend(guest: GuestRowView) {
    // Open synchronously (before any await) so popup blockers don't swallow it.
    window.open(kind === "invite" ? guest.inviteLink : guest.reminderLink, "_blank", "noopener");
    setSentIds((prev) => new Set(prev).add(guest.id));

    if (kind === "invite") {
      setPendingId(guest.id);
      try {
        const formData = new FormData();
        formData.set("id", guest.id);
        await markInviteSentAction(formData);
      } finally {
        setPendingId(null);
      }
    }
  }

  function handleClose() {
    if (kind === "invite" && sentIds.size > 0) router.refresh();
    onClose();
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.dialog}>
        <h2 className={styles.title}>{kind === "invite" ? "Enviar invitación" : "Enviar recordatorio"}</h2>
        <p className={styles.note}>
          {guests.length} invitado{guests.length === 1 ? "" : "s"} en la cola.
          {excludedCount > 0 &&
            ` ${excludedCount} de los seleccionados ya respondieron y se omitieron.`}
        </p>
        <div className={styles.list}>
          {guests.map((guest) => (
            <div key={guest.id} className={styles.row}>
              <span className={styles.rowName}>{guest.name}</span>
              {sentIds.has(guest.id) ? (
                <span className={styles.sentLabel}>Enviado ✓</span>
              ) : (
                <button
                  type="button"
                  className={styles.sendButton}
                  disabled={pendingId === guest.id}
                  onClick={() => handleSend(guest)}
                >
                  Enviar
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className={styles.closeButton} onClick={handleClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
