import { env } from './env';

export const docsRoute = '/';

/** Brand metadata exposed to layouts + MDX components. */
export const brand = {
  name: env.DOCS_BRAND_NAME,
  company: env.DOCS_BRAND_COMPANY,
} as const;

export const api = {
  sandbox: env.DOCS_API_SANDBOX_URL,
  production: env.DOCS_API_PRODUCTION_URL,
} as const;

export const contact = {
  dashboard: env.DOCS_DASHBOARD_URL,
} as const;
