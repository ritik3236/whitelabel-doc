import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';

/**
 * Frontmatter is plain YAML — MDX components (`<Brand />` etc.) don't render
 * there, so a `<Brand />` in `description` would appear literally in <meta>
 * and the page subtitle. To keep frontmatter brand-aware per tenant, we
 * substitute the `{{BRAND}}` token with `DOCS_BRAND_NAME` at build time.
 *
 * Same token also recognised in `title` so multi-tenant page titles work.
 * Read the env directly — `lib/env.ts` validates it at module load elsewhere,
 * but source.config.ts runs before that and shouldn't import app code.
 */
const BRAND = process.env.DOCS_BRAND_NAME?.trim() || '';
const subst = (s: string) => s.replaceAll('{{BRAND}}', BRAND);

const customPageSchema = pageSchema.transform((page) => ({
  ...page,
  title: subst(page.title),
  description: page.description ? subst(page.description) : page.description,
}));

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: customPageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {},
});
