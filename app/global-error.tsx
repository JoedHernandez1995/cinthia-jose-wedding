"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Catches errors thrown by the root layout itself (the one case `app/error.tsx` can't cover,
 * since it renders inside that layout). Replaces the entire document, so it can't rely on
 * `app/globals.css` having loaded — styles are inlined and colors hardcoded to match the brand.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div
          style={{
            minHeight: "100vh",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 32,
            background: "#f3f1ed",
            fontFamily: "-apple-system, Helvetica, Arial, sans-serif",
          }}
        >
          <h1 style={{ fontWeight: 400, fontSize: 32, margin: "0 0 16px", color: "#2b2926" }}>Algo salió mal</h1>
          <p style={{ color: "#6b6459", maxWidth: 340, margin: "0 0 28px" }}>
            Ocurrió un error inesperado. Puedes intentar de nuevo o volver más tarde.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#c9a877",
              color: "#2b2926",
              font: "500 12px/1.5 -apple-system, Helvetica, Arial, sans-serif",
              padding: "14px 28px",
              border: "none",
              borderRadius: 2,
              letterSpacing: "0.1em",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
