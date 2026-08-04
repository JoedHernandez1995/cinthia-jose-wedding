"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { useAdminToast } from "@/components/admin/Toast";
import { overrideRsvpAction, type ActionResult } from "@/app/admin/guests/actions";
import type { Guest } from "@/types/guest";
import styles from "./page.module.css";

const initialState: ActionResult | null = null;

export function OverrideRsvpForm({ guest }: { guest: Guest }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [state, formAction] = useFormState(overrideRsvpAction, initialState);

  useEffect(() => {
    if (!state) return;
    showToast(state.message, state.ok ? "success" : "error");
    if (state.ok) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className={styles.overrideForm}>
      <input type="hidden" name="id" value={guest.id} />
      <label className={styles.label}>
        Estado
        <select
          name="status"
          defaultValue={guest.rsvpStatus === "pending" ? "yes" : guest.rsvpStatus}
          className={styles.select}
        >
          <option value="yes">Confirmado</option>
          <option value="no">No asistirá</option>
        </select>
      </label>
      <label className={styles.label}>
        Correo (para reenviar el comprobante)
        <input
          type="email"
          name="email"
          defaultValue={guest.email ?? ""}
          className={styles.input}
          placeholder="correo@ejemplo.com"
        />
      </label>
      <label className={styles.label}>
        Acompañantes (nombres separados por coma, máx {guest.partySizeAllowed - 1})
        <input
          type="text"
          name="companionNames"
          defaultValue={guest.companionNames.join(", ")}
          className={styles.input}
          placeholder="Ana, Luis"
        />
      </label>
      <SubmitButton label="Guardar" pendingLabel="Guardando…" className={styles.submitButton} />
    </form>
  );
}
