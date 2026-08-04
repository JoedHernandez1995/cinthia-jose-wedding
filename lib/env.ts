/** Throws early and clearly if a required env var is missing, instead of a cryptic downstream error. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}. Copy .env.example to .env.local and fill it in.`);
  }
  return value;
}
