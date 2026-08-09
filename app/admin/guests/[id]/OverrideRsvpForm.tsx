"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminToast } from "@/components/admin/Toast";
import { useAdminConfirm } from "@/components/admin/ConfirmDialog";
import { overrideRsvpAction } from "@/app/admin/guests/actions";
import type { Guest, RsvpStatus } from "@/types/guest";
import styles from "./page.module.css";

function statusLabel(status: RsvpStatus, primaryAttending: boolean | null): string {
  if (status === "pending") return "Pendiente";
  if (status === "no") return "No asistirá";
  return primaryAttending === false ? "Confirmado (sin el invitado)" : "Confirmado";
}

export function OverrideRsvpForm({ guest }: { guest: Guest }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const confirm = useAdminConfirm();

  const maxCompanions = guest.partySizeAllowed - 1;
  const [status, setStatus] = useState<Exclude<RsvpStatus, "pending">>(guest.rsvpStatus === "no" ? "no" : "yes");
  const [primaryAttending, setPrimaryAttending] = useState(guest.primaryAttending !== false);
  const [email, setEmail] = useState(guest.email ?? "");
  const [companionNames, setCompanionNames] = useState<string[]>(() => guest.companionNames.slice(0, maxCompanions));
  const [submitting, setSubmitting] = useState(false);

  function setCompanionCount(count: number) {
    const clamped = Math.max(0, Math.min(count, maxCompanions));
    setCompanionNames((prev) => {
      const next = prev.slice(0, clamped);
      while (next.length < clamped) next.push("");
      return next;
    });
  }

  function setCompanionNameAt(index: number, value: string) {
    setCompanionNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const isChangingExisting = guest.rsvpStatus !== "pending";
    if (isChangingExisting) {
      const fromLabel = statusLabel(guest.rsvpStatus, guest.primaryAttending);
      const toLabel = statusLabel(status, status === "yes" ? primaryAttending : null);
      const confirmed = await confirm(`¿Cambiar la respuesta de ${guest.name} de "${fromLabel}" a "${toLabel}"?`);
      if (!confirmed) return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("id", guest.id);
      formData.set("status", status);
      formData.set("primaryAttending", primaryAttending ? "yes" : "no");
      formData.set("email", email);
      formData.set("companionNames", companionNames.join(", "));
      const result = await overrideRsvpAction(null, formData);
      showToast(result.message, result.ok ? "success" : "error");
      if (result.ok) router.refresh();
    } catch {
      showToast("No se pudo actualizar la respuesta.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.overrideForm}>
      <label className={styles.label}>
        Estado
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Exclude<RsvpStatus, "pending">)}
          className={styles.select}
        >
          <option value="yes">Confirmado</option>
          <option value="no">No asistirá</option>
        </select>
      </label>

      {status === "yes" && (
        <label className={styles.label}>
          Invitado principal
          <select
            value={primaryAttending ? "yes" : "no"}
            onChange={(e) => setPrimaryAttending(e.target.value === "yes")}
            className={styles.select}
          >
            <option value="yes">Sí asistirá</option>
            <option value="no">No, pero sus acompañantes sí</option>
          </select>
        </label>
      )}

      <label className={styles.label}>
        Correo (para reenviar el comprobante)
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          placeholder="correo@ejemplo.com"
        />
      </label>

      {status === "yes" && maxCompanions > 0 && (
        <label className={styles.label}>
          Acompañantes
          <select
            value={companionNames.length}
            onChange={(e) => setCompanionCount(Number(e.target.value))}
            className={styles.select}
          >
            {Array.from({ length: maxCompanions + 1 }, (_, n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "acompañante" : "acompañantes"}
              </option>
            ))}
          </select>
        </label>
      )}

      {status === "yes" &&
        companionNames.map((name, i) => (
          <label key={i} className={styles.label}>
            {`Nombre del acompañante ${i + 1}`}
            <input
              type="text"
              value={name}
              onChange={(e) => setCompanionNameAt(i, e.target.value)}
              className={styles.input}
            />
          </label>
        ))}

      <button type="submit" disabled={submitting} className={styles.submitButton}>
        {submitting ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
