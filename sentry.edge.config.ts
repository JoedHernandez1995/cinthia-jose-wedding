import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Covers middleware.ts (the /admin and /checkin auth gate), which runs on the edge runtime and
// isn't reached by sentry.server.config.ts. No-op without a DSN configured.
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
  });
}
