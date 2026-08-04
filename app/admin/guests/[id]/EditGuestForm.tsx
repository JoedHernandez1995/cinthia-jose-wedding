"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { useAdminToast } from "@/components/admin/Toast";
import { editGuestAction, type ActionResult } from "@/app/admin/guests/actions";
import type { Guest } from "@/types/guest";
import styles from "./page.module.css";

const initialState: ActionResult | null = null;

export function EditGuestForm({ guest }: { guest: Guest }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [state, formAction] = useFormState(editGuestAction, initialState);

  useEffect(() => {
    if (!state) return;
    showToast(state.message, state.ok ? "success" : "error");
    if (state.ok) router.refresh();
    // Only react when a new result comes in from the server action, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className={styles.overrideForm}>
      <input type="hidden" name="id" value={guest.id} />
      <label className={styles.label}>
        Nombre
        <input type="text" name="name" defaultValue={guest.name} required className={styles.input} />
      </label>
      <label className={styles.label}>
        Nombre para mostrar (ej. &quot;Familia Martínez&quot;) — vacío usa el nombre de arriba
        <input type="text" name="displayName" defaultValue={guest.displayName ?? ""} className={styles.input} />
      </label>
      <label className={styles.label}>
        WhatsApp
        <input type="text" name="whatsappNumber" defaultValue={guest.whatsappNumber} required className={styles.input} />
      </label>
      <label className={styles.label}>
        Total de personas permitidas (incluyendo al invitado)
        <input
          type="number"
          name="partySizeAllowed"
          defaultValue={guest.partySizeAllowed}
          min={1}
          className={styles.input}
        />
      </label>
      <label className={styles.label}>
        Lado
        <select name="invitedBy" defaultValue={guest.invitedBy ?? ""} className={styles.select}>
          <option value="">Sin definir</option>
          <option value="novio">Invitado del novio</option>
          <option value="novia">Invitado de la novia</option>
        </select>
      </label>
      <label className={styles.label}>
        Procedencia
        <select name="guestLocation" defaultValue={guest.guestLocation ?? ""} className={styles.select}>
          <option value="">Sin definir</option>
          <option value="local">Local</option>
          <option value="extranjero">Extranjero</option>
        </select>
      </label>
      <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" className={styles.submitButton} />
    </form>
  );
}
