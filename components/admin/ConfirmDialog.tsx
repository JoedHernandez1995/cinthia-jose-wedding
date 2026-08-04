"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import styles from "./ConfirmDialog.module.css";

interface ConfirmState {
  message: string;
  resolve: (confirmed: boolean) => void;
}

type ConfirmFn = (message: string) => Promise<boolean>;

const AdminConfirmContext = createContext<ConfirmFn | null>(null);

/** Mounted once in the admin layout; provides `useAdminConfirm()` — a promise-based replacement for `window.confirm`. */
export function AdminConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ConfirmState | null>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((message) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setPending({ message, resolve });
    });
  }, []);

  function settle(confirmed: boolean) {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setPending(null);
  }

  return (
    <AdminConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className={styles.overlay} role="alertdialog" aria-modal="true">
          <div className={styles.dialog}>
            <p className={styles.message}>{pending.message}</p>
            <div className={styles.actions}>
              <button type="button" className={styles.cancelButton} onClick={() => settle(false)}>
                Cancelar
              </button>
              <button type="button" className={styles.confirmButton} onClick={() => settle(true)}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminConfirmContext.Provider>
  );
}

export function useAdminConfirm(): ConfirmFn {
  const context = useContext(AdminConfirmContext);
  if (!context) throw new Error("useAdminConfirm must be used within AdminConfirmProvider");
  return context;
}
