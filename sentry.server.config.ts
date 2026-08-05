import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// No-op without a DSN configured — keeps local dev/builds working before Sentry is set up.
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
  });
}
