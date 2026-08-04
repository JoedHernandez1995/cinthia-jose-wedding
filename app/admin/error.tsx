"use client";

import { useEffect } from "react";
import styles from "./error.module.css";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.heading}>Algo salió mal</h1>
      <p className={styles.message}>
        Ocurrió un error inesperado en el panel de administración. Puedes intentar de nuevo o volver más tarde.
      </p>
      <button type="button" className={styles.button} onClick={() => reset()}>
        Reintentar
      </button>
    </div>
  );
}
