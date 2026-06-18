import { env } from './env';

export const docsRoute = '/';

/** Brand metadata exposed to layouts + MDX components. */
export const brand = {
  name: env.DOCS_BRAND_NAME,
  company: env.DOCS_BRAND_COMPANY,
  tenantId: env.DOCS_TENANT_ID,
  logoUrl: env.DOCS_LOGO_URL,
  siteUrl: env.DOCS_SITE_URL,
} as const;

export const api = {
  sandbox: env.DOCS_API_SANDBOX_URL,
  production: env.DOCS_API_PRODUCTION_URL,
  version: env.DOCS_API_VERSION,
} as const;

export const contact = {
  email: env.DOCS_SUPPORT_EMAIL,
  url: env.DOCS_SUPPORT_URL,
  dashboard: env.DOCS_DASHBOARD_URL,
} as const;
