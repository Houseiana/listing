import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isLocale, LOCALE_COOKIE } from '@/lib/i18n/config';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const next = body?.locale;

  if (!isLocale(next)) {
    return NextResponse.json({ ok: false, error: 'Invalid locale' }, { status: 400 });
  }

  const store = await cookies();
  store.set(LOCALE_COOKIE, next, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  return NextResponse.json({ ok: true, locale: next });
}
