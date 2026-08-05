import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// No-op without a DSN configured — keeps local dev/builds working before Sentry is set up.
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    // Session replay is off by default — the site handles guest email addresses and RSVP
    // details, and replay would need explicit PII scrubbing before it's worth turning on.
  });
}
