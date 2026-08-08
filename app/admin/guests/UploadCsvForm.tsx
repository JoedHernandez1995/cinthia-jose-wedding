"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { useAdminToast } from "@/components/admin/Toast";
import { uploadGuestsCsv } from "./actions";
import type { CsvUploadResult } from "@/types/guest";
import styles from "./page.module.css";

const initialState: CsvUploadResult | null = null;

export function UploadCsvForm() {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [result, formAction] = useFormState(uploadGuestsCsv, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!result) return;
    const hasErrors = result.skipped.length > 0;
    showToast(
      `${result.inserted} nuevos · ${result.updated} actualizados${hasErrors ? ` · ${result.skipped.length} con errores` : ""}`,
      hasErrors && result.inserted === 0 && result.updated === 0 ? "error" : "success",
    );
    if (result.inserted > 0 || result.updated > 0) {
      formRef.current?.reset();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  return (
    <form ref={formRef} action={formAction} className={styles.card}>
      <h2 className={styles.cardHeading}>Importar CSV</h2>
      <p className={styles.cardHint}>
        Columnas: name, display_name (opcional), whatsapp_number, party_size_allowed (total de personas, incluyendo al
        invitado), invited_by (opcional: novio/novia/padres_novio/padres_novia)
      </p>
      <input type="file" name="file" accept=".csv" required className={styles.fileInput} />
      <SubmitButton label="Subir" pendingLabel="Subiendo…" className={styles.primaryButton} />

      {result && (
        <div className={styles.uploadBanner}>
          <p>
            {result.inserted} nuevos · {result.updated} actualizados
            {result.skipped.length > 0 && ` · ${result.skipped.length} con errores`}
          </p>
          {result.skipped.length > 0 && (
            <ul className={styles.uploadErrors}>
              {result.skipped.map((e, i) => (
                <li key={i}>
                  Fila {e.row}: {e.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
