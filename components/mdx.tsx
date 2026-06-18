import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import type { MDXComponents } from 'mdx/types';
import { api, brand, contact } from '@/lib/shared';

/** Inline tenant brand name (e.g. "QuikPe"). */
function Brand() {
  return <>{brand.name}</>;
}

/** Inline tenant company name (e.g. "QuikPe Payments"). */
function Company() {
  return <>{brand.company}</>;
}

/** Inline an API base URL as plain text. Wrap in JSX `<code>` if you want
 * code-formatting — Markdown backticks turn the whole thing into literal text. */
function ApiUrl({ env: target = 'production' }: { env?: 'sandbox' | 'production' }) {
  const url = target === 'sandbox' ? api.sandbox : api.production;
  return <>{url}</>;
}

/** Inline the support email as a mailto link. */
function SupportEmail() {
  return <a href={`mailto:${contact.email}`}>{contact.email}</a>;
}

/** Inline a link to the support site. */
function SupportLink({ children }: { children?: React.ReactNode }) {
  return <a href={contact.url}>{children ?? contact.url}</a>;
}

/** Wrap link text into an anchor pointing at the merchant dashboard. */
function DashboardLink({ children }: { children: React.ReactNode }) {
  return <a href={contact.dashboard}>{children}</a>;
}

const tenantComponents = {
  Brand,
  Company,
  ApiUrl,
  SupportEmail,
  SupportLink,
  DashboardLink,
} satisfies MDXComponents;

const extraFumadocsComponents = {
  Steps,
  Step,
} satisfies MDXComponents;

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...extraFumadocsComponents,
    ...tenantComponents,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
