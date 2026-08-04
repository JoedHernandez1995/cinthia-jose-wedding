"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { useAdminToast } from "@/components/admin/Toast";
import { addSingleGuest, type ActionResult } from "./actions";
import styles from "./page.module.css";

const initialState: ActionResult | null = null;

export function AddGuestForm() {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [state, formAction] = useFormState(addSingleGuest, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    showToast(state.message, state.ok ? "success" : "error");
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className={styles.card}>
      <h2 className={styles.cardHeading}>Agregar invitado</h2>
      <label htmlFor="name" style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#333" }}>
        Nombre Completo
      </label>
      <input type="text" name="name" placeholder="Nombre" required className={styles.textInput} />
      <label htmlFor="displayName" style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#333" }}>
        Nombre para mostrar (opcional, ej. &quot;Familia Martínez&quot;)
      </label>
      <input
        type="text"
        name="displayName"
        placeholder="Se usa el nombre de arriba si se deja vacío"
        className={styles.textInput}
      />
      <label htmlFor="whatsappNumber" style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#333" }}>
        WhatsApp (ej. 50499999999)
      </label>
      <input type="text" name="whatsappNumber" placeholder="WhatsApp (ej. 50499999999)" required className={styles.textInput} />
      <label htmlFor="partySizeAllowed" style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#333" }}>
        Total de personas permitidas (incluyendo al invitado)
      </label>
      <input
        type="number"
        name="partySizeAllowed"
        placeholder="Ej. 2 para el invitado + 1 acompañante"
        min={1}
        defaultValue={1}
        className={styles.textInput}
      />
      <label htmlFor="invitedBy" style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#333" }}>
        Lado
      </label>
      <select name="invitedBy" defaultValue="novio" className={styles.textInput}>
        <option value="novio">Invitado del novio</option>
        <option value="novia">Invitado de la novia</option>
      </select>
      <label htmlFor="guestLocation" style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#333" }}>
        Procedencia
      </label>
      <select name="guestLocation" defaultValue="local" className={styles.textInput}>
        <option value="local">Local</option>
        <option value="extranjero">Extranjero</option>
      </select>
      <SubmitButton label="Agregar" pendingLabel="Agregando…" className={styles.primaryButton} />
    </form>
  );
}
