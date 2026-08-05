/** Throws early and clearly if a required env var is missing, instead of a cryptic downstream error. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}. Copy .env.example to .env.local and fill it in.`);
  }
  // .env.local wraps values containing special characters in quotes for shell parsing (e.g.
  // `RESEND_FROM_EMAIL="Name <email>"`), but a host's env var UI (Vercel, etc.) doesn't want
  // those quotes — pasting the literal string including them silently breaks whatever depends on
  // the value (e.g. Resend rejecting a `from` address wrapped in stray `"` characters). Strip a
  // single matching pair so that mistake can't happen either way.
  const trimmed = value.trim();
  if (trimmed.length >= 2 && ((trimmed[0] === '"' && trimmed.at(-1) === '"') || (trimmed[0] === "'" && trimmed.at(-1) === "'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
