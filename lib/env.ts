/**
 * Typed accessor for DOCS_* env. Read once at module load; fail loud if any
 * required key is missing so a misconfigured deploy never silently serves the
 * wrong tenant (or, worse, unauthenticated docs).
 */

const required = [
  'DOCS_TENANT_ID',
  'DOCS_BRAND_NAME',
  'DOCS_BRAND_COMPANY',
  'DOCS_PASSWORDS',
  'DOCS_AUTH_SECRET',
  'DOCS_API_SANDBOX_URL',
  'DOCS_API_PRODUCTION_URL',
  'DOCS_API_VERSION',
  'DOCS_SITE_URL',
  'DOCS_SUPPORT_EMAIL',
  'DOCS_SUPPORT_URL',
  'DOCS_DASHBOARD_URL',
] as const;

const optional = ['DOCS_LOGO_URL', 'DOCS_PRIMARY_COLOR'] as const;

type RequiredKey = (typeof required)[number];
type OptionalKey = (typeof optional)[number];

function read(): Record<RequiredKey, string> & Partial<Record<OptionalKey, string>> {
  const missing: string[] = [];
  const out = {} as Record<RequiredKey, string> & Partial<Record<OptionalKey, string>>;

  for (const key of required) {
    const value = process.env[key]?.trim();
    if (!value) missing.push(key);
    else out[key] = value;
  }
  for (const key of optional) {
    const value = process.env[key]?.trim();
    if (value) out[key] = value;
  }

  if (missing.length) {
    throw new Error(
      `[docs] missing required env: ${missing.join(', ')} — see .env.local.example`,
    );
  }
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
