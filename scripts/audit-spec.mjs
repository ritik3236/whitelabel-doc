import fs from 'node:fs';
import yaml from 'yaml';

const SPEC = '/Users/peach/Codespace/gekko/src/app/docs/openapi.bundle.yaml';
const MDX_ROOT = '/Users/peach/Codespace/gekko/docs/content/docs';

const spec = yaml.parse(fs.readFileSync(SPEC, 'utf8'));

// Pre-load every MDX file's text, keyed by tag
const tagMdx = {
  Payout: fs.readFileSync(`${MDX_ROOT}/api/payouts.mdx`, 'utf8'),
  Beneficiary: fs.readFileSync(`${MDX_ROOT}/api/beneficiaries.mdx`, 'utf8'),
  Balance: fs.readFileSync(`${MDX_ROOT}/api/balances.mdx`, 'utf8'),
  OTC: fs.readFileSync(`${MDX_ROOT}/api/otc.mdx`, 'utf8'),
};

function resolveRef(ref) {
  if (!ref) return null;
  const parts = ref.replace('#/', '').split('/');
  let cur = spec;
  for (const p of parts) cur = cur?.[p];
  return cur;
}

const missing = [];
function miss(loc, what) { missing.push(`${loc}  ::  ${what}`); }

// ---- Walk every operation ----
for (const [path, methods] of Object.entries(spec.paths || {})) {
  for (const m of ['get','post','put','patch','delete']) {
    const op = methods[m];
    if (!op) continue;
    const tag = (op.tags || [])[0] || 'unknown';
    const mdx = tagMdx[tag];
    const loc = `${m.toUpperCase()} ${path} (${tag})`;
    if (!mdx) { miss(loc, `no MDX file for tag ${tag}`); continue; }

    // 1. path appears
    if (!mdx.includes(path)) miss(loc, `endpoint path "${path}" not found in MDX`);

    // 2. operation summary appears (loose check)
    if (op.summary && !mdx.toLowerCase().includes(op.summary.toLowerCase().slice(0,15))) {
      miss(loc, `summary fragment "${op.summary.slice(0,30)}…" not found`);
    }

    // 3. every parameter
    for (const pRef of (op.parameters || [])) {
      const p = pRef.$ref ? resolveRef(pRef.$ref) : pRef;
      if (!mdx.includes('`'+p.name+'`')) miss(loc, `param \`${p.name}\` not in MDX`);
      if (p.schema?.enum) {
        for (const v of p.schema.enum) {
          if (!mdx.includes('`'+v+'`')) miss(loc, `param ${p.name} enum value \`${v}\` not in MDX`);
        }
      }
    }

    // 4. request body
    if (op.requestBody) {
      const schema = op.requestBody.content?.['application/json']?.schema;
      const resolved = schema?.$ref ? resolveRef(schema.$ref) : schema;
      if (resolved?.properties) {
        for (const [field, fs] of Object.entries(resolved.properties)) {
          if (!mdx.includes('`'+field+'`')) miss(loc, `request field \`${field}\` not in MDX`);
          if (fs.example !== undefined && fs.example !== null) {
            const ex = typeof fs.example === 'string' ? fs.example : JSON.stringify(fs.example);
            if (!mdx.includes(ex)) miss(loc, `request field ${field} example "${ex}" not shown in MDX`);
          }
          if (fs.pattern && !mdx.includes(fs.pattern)) miss(loc, `request field ${field} pattern "${fs.pattern}" not in MDX`);
          if (fs.minLength !== undefined && !mdx.match(new RegExp(fs.minLength+'.*'+fs.maxLength))) {
            // soft check
          }
          if (fs.enum) {
            for (const v of fs.enum) {
              if (!mdx.includes('`'+v+'`')) miss(loc, `request field ${field} enum value \`${v}\` not in MDX`);
            }
          }
        }
      }
    }

    // 5. responses
    for (const [code, rRef] of Object.entries(op.responses || {})) {
      if (!mdx.includes('`'+code+'`')) miss(loc, `response code \`${code}\` not in MDX`);
      const r = rRef.$ref ? resolveRef(rRef.$ref) : rRef;
      const content = r.content?.['application/json'];
      // example
      if (content?.example) {
        // hard to check structural — skip unless top-level marker present
      }
      // examples (multiple)
      if (content?.examples) {
        for (const exName of Object.keys(content.examples)) {
          // each named example — at minimum its name should be reflected (e.g. "bank_account" → "bank account")
          // skip strict
        }
      }
      // schema fields
      const schema = content?.schema;
      const resolvedSchema = schema?.$ref ? resolveRef(schema.$ref) : (schema?.items?.$ref ? resolveRef(schema.items.$ref) : schema?.items || schema);
      if (resolvedSchema?.properties) {
        for (const [field, fs] of Object.entries(resolvedSchema.properties)) {
          if (!mdx.includes('`'+field+'`')) miss(loc, `response field \`${field}\` (HTTP ${code}) not in MDX`);
          if (fs.enum) {
            for (const v of fs.enum) {
              if (!mdx.includes('`'+v+'`')) miss(loc, `response field ${field} enum \`${v}\` (HTTP ${code}) not in MDX`);
            }
          }
        }
      }
    }
  }
}

// ---- Walk every schema ----
for (const [name, s] of Object.entries(spec.components?.schemas || {})) {
  if (!s.properties) continue;
  // find which MDX page documents this schema — match by name
  const owners = Object.entries(tagMdx).filter(([_, txt]) => txt.includes('`'+name+'`'));
  if (!owners.length) {
    miss(`SCHEMA ${name}`, `schema name "${name}" never referenced in any MDX`);
    continue;
  }
  const [, mdx] = owners[0];
  for (const [field, fs] of Object.entries(s.properties)) {
    if (!mdx.includes('`'+field+'`')) miss(`SCHEMA ${name}`, `field \`${field}\` not in MDX`);
    if (fs.enum) {
      for (const v of fs.enum) {
        if (!mdx.includes('`'+v+'`')) miss(`SCHEMA ${name}`, `field ${field} enum \`${v}\` not in MDX`);
      }
    }
  }
}

// ---- Frontmatter must be plain text (no JSX components) ----
function walkMdx(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) walkMdx(p);
    else if (e.name.endsWith('.mdx')) {
      const txt = fs.readFileSync(p, 'utf8');
      const m = txt.match(/^---\n([\s\S]*?)\n---/);
      if (!m) continue;
      const fm = m[1];
      // JSX component opener inside frontmatter — YAML doesn't process it,
      // so the component string renders literally in <title>/<meta>/DocsDescription.
      const offenders = fm.match(/<[A-Z][A-Za-z0-9]*[^>]*\/?>/g);
      if (offenders) {
        miss(`FRONTMATTER ${p.replace(MDX_ROOT, '')}`, `JSX in frontmatter (would render literally): ${offenders.join(', ')}`);
      }
    }
  }
}
walkMdx(MDX_ROOT);

if (!missing.length) {
  console.log('✓ ALL CLEAR — every spec item in MDX and no JSX in frontmatter');
} else {
  console.log(`Found ${missing.length} potential gaps:\n`);
  missing.forEach(m => console.log('  -', m));
  process.exit(1);
}
