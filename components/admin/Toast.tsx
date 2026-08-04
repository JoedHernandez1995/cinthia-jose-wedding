"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import styles from "./Toast.module.css";

const TOAST_DISPLAY_MS = 4_000;

type ToastKind = "success" | "error";

interface ToastState {
  message: string;
  kind: ToastKind;
}

interface AdminToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

/** Mounted once in the admin layout; provides `useAdminToast()` to every admin page. */
export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((message: string, kind: ToastKind = "success") => {
    clearTimeout(timeoutRef.current);
    setToast({ message, kind });
    timeoutRef.current = setTimeout(() => setToast(null), TOAST_DISPLAY_MS);
  }, []);

  return (
    <AdminToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`${styles.toast} ${toast.kind === "error" ? styles.toastError : styles.toastSuccess}`} role="status">
          {toast.message}
        </div>
      )}
    </AdminToastContext.Provider>
  );
}

export function useAdminToast(): AdminToastContextValue {
  const context = useContext(AdminToastContext);
  if (!context) throw new Error("useAdminToast must be used within AdminToastProvider");
  return context;
}
