"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { useAdminToast } from "@/components/admin/Toast";
import { useAdminConfirm } from "@/components/admin/ConfirmDialog";
import {
  addRecommendationEntryAction,
  deleteRecommendationEntryAction,
  editRecommendationEntryAction,
  type ActionResult,
} from "./actions";
import type { RecommendationCategory, RecommendationEntry } from "@/types/invitation";
import styles from "./page.module.css";

const initialState: ActionResult | null = null;

export function RecommendationCategorySection({ category }: { category: RecommendationCategory }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const confirm = useAdminConfirm();
  const [addState, addFormAction] = useFormState(addRecommendationEntryAction, initialState);
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

  async function handleDelete(entry: RecommendationEntry) {
    const confirmed = await confirm(`¿Eliminar "${entry.name}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;
    setDeletingId(entry.id);
    try {
      const formData = new FormData();
      formData.set("id", entry.id);
      await deleteRecommendationEntryAction(formData);
      router.refresh();
      showToast("Recomendación eliminada.");
    } catch {
      showToast("No se pudo eliminar la recomendación.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <h2 className={styles.subheading}>{category.title}</h2>

      <form ref={addFormRef} action={addFormAction} className={styles.card}>
        <h3 className={styles.cardHeading}>Agregar recomendación</h3>
        <input type="hidden" name="category" value={category.id} />
        <input type="text" name="name" placeholder="Nombre" required className={styles.textInput} />
        <textarea name="description" placeholder="Descripción (opcional)" className={styles.textArea} />
        <input type="text" name="mapsLink" placeholder="Link de Google Maps (opcional)" className={styles.textInput} />
        <input type="text" name="phone" placeholder="WhatsApp (opcional, ej. +50499999999)" className={styles.textInput} />
        <input type="text" name="link" placeholder="Link (Instagram, sitio web, etc.)" className={styles.textInput} />
        <SubmitButton label="Agregar" pendingLabel="Agregando…" className={styles.primaryButton} />
      </form>

      <div className={styles.list}>
        {category.entries.map((entry) =>
          editingId === entry.id ? (
            <EditRecommendationEntryRow key={entry.id} entry={entry} onCancel={() => setEditingId(null)} />
          ) : (
            <div key={entry.id} className={styles.row}>
              <div>
                <div className={styles.rowName}>{entry.name}</div>
                {entry.description && <div className={styles.rowLine}>{entry.description}</div>}
                {entry.phone && <div className={styles.rowLine}>WhatsApp: {entry.phone}</div>}
                {entry.link && <div className={styles.rowLine}>{entry.link}</div>}
                {entry.mapsLink && <div className={styles.rowLine}>{entry.mapsLink}</div>}
              </div>
              <div className={styles.rowActions}>
                <button type="button" className={styles.actionButton} onClick={() => setEditingId(entry.id)}>
                  Editar
                </button>
                <button
                  type="button"
                  className={styles.actionButtonDanger}
                  disabled={deletingId === entry.id}
                  onClick={() => handleDelete(entry)}
                >
                  {deletingId === entry.id ? "Eliminando…" : "Eliminar"}
                </button>
              </div>
            </div>
          ),
        )}
        {category.entries.length === 0 && <p className={styles.empty}>Sin recomendaciones todavía.</p>}
      </div>
    </div>
  );
}

function EditRecommendationEntryRow({ entry, onCancel }: { entry: RecommendationEntry; onCancel: () => void }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [state, formAction] = useFormState(editRecommendationEntryAction, initialState);

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
        <input type="hidden" name="id" value={entry.id} />
        <input type="text" name="name" defaultValue={entry.name} required className={styles.textInput} />
        <textarea name="description" defaultValue={entry.description ?? ""} className={styles.textArea} />
        <input type="text" name="mapsLink" defaultValue={entry.mapsLink ?? ""} className={styles.textInput} />
        <input type="text" name="phone" defaultValue={entry.phone ?? ""} className={styles.textInput} />
        <input type="text" name="link" defaultValue={entry.link ?? ""} className={styles.textInput} />
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
