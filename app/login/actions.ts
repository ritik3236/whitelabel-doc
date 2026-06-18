'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env, passwords } from '@/lib/env';
import { SESSION_COOKIE, signSession } from '@/lib/auth';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function safeNext(raw: FormDataEntryValue | null): string {
  // Only follow local paths, never an arbitrary URL. Anything else → home.
  const value = typeof raw === 'string' ? raw : '';
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  return '/';
}

export async function login(formData: FormData): Promise<void> {
  const password = String(formData.get('password') ?? '').trim();
  const next = safeNext(formData.get('next'));

  if (!password || !passwords.has(password)) {
    // Bounce back to /login with an error flag; keep `next` so the success
    // path still goes where the user originally tried to land.
    const params = new URLSearchParams({ error: '1' });
    if (next !== '/') params.set('next', next);
    redirect(`/login?${params.toString()}`);
  }

  const token = await signSession(env.DOCS_AUTH_SECRET);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });

  redirect(next);
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect('/login');
}
