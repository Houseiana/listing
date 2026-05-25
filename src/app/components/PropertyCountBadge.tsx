'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Home } from 'lucide-react';
import { AdminsAPI } from '@/lib/api/backend-api';

type Status = 'idle' | 'loading' | 'ok' | 'error' | 'no-token';

function extractCount(data: unknown): number | null {
  if (typeof data === 'number') return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const candidates = ['count', 'propertyCount', 'data', 'value', 'total', 'result'];
    for (const key of candidates) {
      const v = obj[key];
      if (typeof v === 'number') return v;
      if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
      if (v && typeof v === 'object') {
        const nested = extractCount(v);
        if (nested !== null) return nested;
      }
    }
  }
  return null;
}

export function PropertyCountBadge() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  console.log('[PropertyCountBadge] render', { isLoaded, isSignedIn, userId, status, count });

  useEffect(() => {
    console.log('[PropertyCountBadge] effect fired', { isLoaded, isSignedIn, userId });

    if (!isLoaded) {
      console.log('[PropertyCountBadge] skipped: not loaded yet');
      return;
    }
    if (!isSignedIn || !userId) {
      console.log('[PropertyCountBadge] skipped: not signed in');
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      const token = await getToken();
      console.log('[PropertyCountBadge] got token?', !!token);
      if (!token) {
        if (!cancelled) setStatus('no-token');
        return;
      }
      if (cancelled) return;

      const res = await AdminsAPI.getPropertyCount(userId, token, controller.signal);
      if (cancelled) return;

      console.log('[PropertyCountBadge] response:', res);

      if (!res.success) {
        setStatus('error');
        return;
      }

      const value = extractCount(res.data);
      if (value === null) {
        console.warn('[PropertyCountBadge] could not extract count from:', res.data);
        setStatus('error');
        return;
      }

      setCount(value);
      setStatus('ok');
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isLoaded, isSignedIn, userId, getToken]);

  const display =
    status === 'ok' && count !== null
      ? count.toLocaleString()
      : status === 'loading'
        ? '...'
        : status === 'no-token'
          ? 'no-token'
          : status === 'error'
            ? 'err'
            : 'idle';

  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold text-[#1D242B] border border-[#F0F2F5] rounded-full bg-white"
      title={`Status: ${status} | isLoaded: ${isLoaded} | isSignedIn: ${isSignedIn} | userId: ${userId ?? 'null'}`}
    >
      <Home className="w-4 h-4 text-[#fcc519]" />
      <span className="tabular-nums">{display}</span>
    </div>
  );
}
