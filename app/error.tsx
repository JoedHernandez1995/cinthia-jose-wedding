"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { coupleNames } from "@/config/site";
import styles from "./not-found.module.css";

/**
 * Site-wide error boundary — catches anything unhandled in `/`, `/i/[token]`, `/checkin/[code]`,
 * etc. (everything outside `/admin`, which has its own `app/admin/error.tsx`). Reuses the 404
 * page's styling so a crash still looks intentional instead of a raw framework error page.
 */
export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className={styles.wrap}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/monogram.png" alt={`Monograma ${coupleNames.full}`} className={styles.monogram} />
      <div className={styles.eyebrow}>ERROR</div>
      <h1 className={styles.heading}>Algo salió mal</h1>
      <p className={styles.note}>Ocurrió un error inesperado. Puedes intentar de nuevo o volver más tarde.</p>
      <GoldDivider width={28} margin="0 auto 32px" />
      <button type="button" onClick={() => reset()} className={styles.retryButton}>
        Reintentar
      </button>
    </div>
  );
}
