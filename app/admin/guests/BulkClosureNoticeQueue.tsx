"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { GuestRowView } from "./GuestTable";
import { sendClosureNoticeEmailAction } from "./actions";
import styles from "./BulkClosureNoticeQueue.module.css";

type SendStatus = "pending" | "sending" | "sent" | "failed";

interface BulkClosureNoticeQueueProps {
  guests: GuestRowView[];
  excludedCount: number;
  onClose: () => void;
}

const CONCURRENCY = 3;

/**
 * Sends the "RSVP window closed" email to every eligible guest — same concurrency-limited
 * client-driven fan-out as `BulkReminderQueue` (Server Actions have no channel to stream progress
 * for a single server-side loop), since this is a one-time manual send, not an automated campaign.
 */
export function BulkClosureNoticeQueue({ guests, excludedCount, onClose }: BulkClosureNoticeQueueProps) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Map<string, SendStatus>>(
    () => new Map(guests.map((g) => [g.id, "pending"])),
  );
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    let cursor = 0;

    async function sendOne(guest: GuestRowView) {
      setStatuses((prev) => new Map(prev).set(guest.id, "sending"));
      let ok = false;
      try {
        const formData = new FormData();
        formData.set("id", guest.id);
        const result = await sendClosureNoticeEmailAction(formData);
        ok = result.ok;
      } catch {
        ok = false;
      }
      if (!cancelled) {
        setStatuses((prev) => new Map(prev).set(guest.id, ok ? "sent" : "failed"));
      }
    }

    async function worker() {
      while (!cancelled) {
        const index = cursor;
        cursor += 1;
        if (index >= guests.length) return;
        await sendOne(guests[index]);
      }
    }

    Promise.all(Array.from({ length: Math.min(CONCURRENCY, guests.length) }, worker)).then(() => {
      if (!cancelled) router.refresh();
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = guests.length;
  const completed = Array.from(statuses.values()).filter((s) => s === "sent" || s === "failed").length;
  const failedCount = Array.from(statuses.values()).filter((s) => s === "failed").length;
  const allDone = total > 0 && completed === total;
  const progressPct = total === 0 ? 100 : Math.round((completed / total) * 100);

  const statusLabel: Record<SendStatus, string> = {
    pending: "En espera",
    sending: "Enviando…",
    sent: "Enviado ✓",
    failed: "Error",
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.dialog}>
        <h2 className={styles.title}>Enviar aviso de cierre de confirmaciones</h2>
        <p className={styles.note}>
          {total} invitado{total === 1 ? "" : "s"} en la cola (vieron la invitación, tienen correo registrado y no
          confirmaron antes del plazo).
          {excludedCount > 0 && ` ${excludedCount} de los seleccionados no califican y se omitieron.`}
        </p>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
        <p className={styles.progressLabel}>
          {allDone
            ? `Listo — ${completed}/${total} enviados${failedCount > 0 ? `, ${failedCount} con error` : ""}.`
            : `${completed}/${total} completados…`}
        </p>

        <div className={styles.list}>
          {guests.map((guest) => {
            const status = statuses.get(guest.id) ?? "pending";
            return (
              <div key={guest.id} className={styles.row}>
                <span className={styles.rowName}>{guest.name}</span>
                <span className={status === "failed" ? styles.failedLabel : styles.statusLabel}>
                  {statusLabel[status]}
                </span>
              </div>
            );
          })}
        </div>

        <button type="button" className={styles.closeButton} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
