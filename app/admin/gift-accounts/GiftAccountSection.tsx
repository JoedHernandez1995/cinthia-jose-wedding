"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { useAdminToast } from "@/components/admin/Toast";
import { useAdminConfirm } from "@/components/admin/ConfirmDialog";
import { addGiftAccountAction, deleteGiftAccountAction, editGiftAccountAction, type ActionResult } from "./actions";
import type { GiftAccount, GiftAccountAudience } from "@/types/invitation";
import styles from "./page.module.css";

const initialState: ActionResult | null = null;

export function GiftAccountSection({
  title,
  audience,
  accounts,
}: {
  title: string;
  audience: GiftAccountAudience;
  accounts: GiftAccount[];
}) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const confirm = useAdminConfirm();
  const [addState, addFormAction] = useFormState(addGiftAccountAction, initialState);
  const addFormRef = useRef<HTMLFormElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!addState) return;
    showToast(addState.message, addState.ok ? "success" : "error");
    if (addState.ok) {
      addFormRef.current?.reset();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addState]);

  async function handleDelete(account: GiftAccount) {
    const confirmed = await confirm(`¿Eliminar "${account.label}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;
    setDeletingId(account.id);
    try {
      const formData = new FormData();
      formData.set("id", account.id);
      await deleteGiftAccountAction(formData);
      router.refresh();
      showToast("Cuenta eliminada.");
    } catch {
      showToast("No se pudo eliminar la cuenta.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <h2 className={styles.subheading}>{title}</h2>

      <form ref={addFormRef} action={addFormAction} className={styles.card}>
        <h3 className={styles.cardHeading}>Agregar cuenta</h3>
        <input type="hidden" name="audience" value={audience} />
        <input type="text" name="label" placeholder="Título (ej. Venmo, CUENTA EN LEMPIRAS · HONDURAS)" required className={styles.textInput} />
        <input type="text" name="primaryLine" placeholder="Línea principal (ej. @usuario, BAC Honduras)" required className={styles.textInput} />
        <input type="text" name="secondaryLine" placeholder="Línea secundaria (opcional)" className={styles.textInput} />
        <input type="text" name="copyText" placeholder="Texto a copiar (número de cuenta o usuario)" required className={styles.textInput} />
        <SubmitButton label="Agregar" pendingLabel="Agregando…" className={styles.primaryButton} />
      </form>

      <div className={styles.list}>
        {accounts.map((account) =>
          editingId === account.id ? (
            <EditGiftAccountRow key={account.id} account={account} onCancel={() => setEditingId(null)} />
          ) : (
            <div key={account.id} className={styles.row}>
              <div>
                <div className={styles.rowLabel}>{account.label}</div>
                <div className={styles.rowLine}>{account.primaryLine}</div>
                {account.secondaryLine && <div className={styles.rowLine}>{account.secondaryLine}</div>}
              </div>
              <div className={styles.rowActions}>
                <button type="button" className={styles.actionButton} onClick={() => setEditingId(account.id)}>
                  Editar
                </button>
                <button
                  type="button"
                  className={styles.actionButtonDanger}
                  disabled={deletingId === account.id}
                  onClick={() => handleDelete(account)}
                >
                  {deletingId === account.id ? "Eliminando…" : "Eliminar"}
                </button>
              </div>
            </div>
          ),
        )}
        {accounts.length === 0 && <p className={styles.empty}>Sin cuentas todavía.</p>}
      </div>
    </div>
  );
}

function EditGiftAccountRow({ account, onCancel }: { account: GiftAccount; onCancel: () => void }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [state, formAction] = useFormState(editGiftAccountAction, initialState);

  useEffect(() => {
    if (!state) return;
    showToast(state.message, state.ok ? "success" : "error");
    if (state.ok) {
      router.refresh();
      onCancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className={styles.row}>
      <form action={formAction} className={styles.editForm}>
        <input type="hidden" name="id" value={account.id} />
        <input type="text" name="label" defaultValue={account.label} required className={styles.textInput} />
        <input type="text" name="primaryLine" defaultValue={account.primaryLine} required className={styles.textInput} />
        <input type="text" name="secondaryLine" defaultValue={account.secondaryLine ?? ""} className={styles.textInput} />
        <input type="text" name="copyText" defaultValue={account.copyText} required className={styles.textInput} />
        <div className={styles.rowActions}>
          <SubmitButton label="Guardar" pendingLabel="Guardando…" className={styles.primaryButton} />
          <button type="button" className={styles.actionButton} onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
