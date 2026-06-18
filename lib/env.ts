/**
 * Typed accessor for DOCS_* env. Read once at module load; fail loud if any
 * required key is missing so a misconfigured deploy never silently serves the
 * wrong tenant (or, worse, unauthenticated docs).
 *
 * Minimal contract — only the values actually consumed by the app are listed
 * here. If you add a new component that needs an env value, add the key here
 * with a clear required/optional intent.
 */

const required = [
  'DOCS_BRAND_NAME',
  'DOCS_PASSWORDS',
  'DOCS_AUTH_SECRET',
  'DOCS_API_SANDBOX_URL',
  'DOCS_API_PRODUCTION_URL',
  'DOCS_DASHBOARD_URL',
] as const;

type RequiredKey = (typeof required)[number];

interface DocsEnv extends Record<RequiredKey, string> {
  DOCS_BRAND_COMPANY: string; // optional in env, defaults to DOCS_BRAND_NAME
}

function read(): DocsEnv {
  const missing: string[] = [];
  const out = {} as DocsEnv;

  for (const key of required) {
    const value = process.env[key]?.trim();
    if (!value) missing.push(key);
    else out[key] = value;
  }

  if (missing.length) {
    throw new Error(
      `[docs] missing required env: ${missing.join(', ')} — see .env.local.example`,
    );
  }

  out.DOCS_BRAND_COMPANY = process.env.DOCS_BRAND_COMPANY?.trim() || out.DOCS_BRAND_NAME;
  return out;
}

export const env = read();

/** Accepted passwords, parsed from the comma-separated DOCS_PASSWORDS list. */
export const passwords: ReadonlySet<string> = new Set(
  env.DOCS_PASSWORDS.split(',')
    .map((p) => p.trim())
    .filter(Boolean),
);

if (passwords.size === 0) {
  throw new Error('[docs] DOCS_PASSWORDS parses to an empty list');
}
