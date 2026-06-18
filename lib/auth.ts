/**
 * Tiny password-list session for the docs gate. Replaces HTTP Basic Auth so the
 * UX is "one password box, no username" and so the accepted password list can
 * be rotated by editing env (DOCS_PASSWORDS) without code changes.
 *
 * Session shape: an HMAC-SHA256 of a fixed payload, keyed by DOCS_AUTH_SECRET.
 * No DB, no session store. Bumping the secret invalidates every existing
 * cookie. Edge-runtime safe (uses Web Crypto, not node:crypto).
 */

export const SESSION_COOKIE = 'docs-session';
export const SESSION_PAYLOAD = 'docs-session-v1';
const enc = new TextEncoder();

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

function toBase64Url(buf: ArrayBuffer): string {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Constant-time string comparison — avoids leaking timing on cookie check. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Mint the session cookie value. Same value for every authorized session;
 * we only assert "presented a valid password", not "which one". */
export async function signSession(secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(SESSION_PAYLOAD));
  return toBase64Url(sig);
}

/** Verify a cookie value against the configured secret. */
export async function verifySession(secret: string, cookie: string | undefined): Promise<boolean> {
  if (!cookie) return false;
  const expected = await signSession(secret);
  return timingSafeEqual(cookie, expected);
}
