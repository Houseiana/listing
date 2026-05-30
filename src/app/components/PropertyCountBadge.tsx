'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { ChevronDown, Home } from 'lucide-react';
import { AdminsAPI } from '@/lib/api/backend-api';
import { useTranslation } from '@/lib/i18n/context';

type Status = 'idle' | 'loading' | 'ok' | 'error' | 'no-token';

type DateRange = { from: string; to: string };

const EMPTY_RANGE: DateRange = { from: '', to: '' };

type PresetKey = 'today' | 'week' | 'month' | 'year' | 'all';

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildPreset(key: PresetKey): DateRange {
  if (key === 'all') return EMPTY_RANGE;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === 'today') {
    const ymd = toYMD(today);
    return { from: ymd, to: ymd };
  }
  if (key === 'week') {
    const day = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - day);
    return { from: toYMD(start), to: toYMD(today) };
  }
  if (key === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toYMD(start), to: toYMD(today) };
  }
  const start = new Date(today.getFullYear(), 0, 1);
  return { from: toYMD(start), to: toYMD(today) };
}

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

export function PropertyCountBadge({ align = 'auto' }: { align?: 'auto' | 'start' } = {}) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const { t, dir } = useTranslation();

  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [appliedRange, setAppliedRange] = useState<DateRange>(EMPTY_RANGE);
  const [draftRange, setDraftRange] = useState<DateRange>(EMPTY_RANGE);
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      const token = await getToken();
      if (!token) {
        if (!cancelled) setStatus('no-token');
        return;
      }
      if (cancelled) return;

      const res = await AdminsAPI.getPropertyCount(userId, token, {
        from: appliedRange.from || undefined,
        to: appliedRange.to || undefined,
        signal: controller.signal,
      });
      if (cancelled) return;

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
  }, [isLoaded, isSignedIn, userId, getToken, appliedRange]);

  const hasActiveFilter = Boolean(appliedRange.from || appliedRange.to);

  const applyPreset = useCallback((key: PresetKey) => {
    const next = buildPreset(key);
    setDraftRange(next);
    setAppliedRange(next);
    setOpen(false);
  }, []);

  const onApply = useCallback(() => {
    if (draftRange.from && draftRange.to && draftRange.from > draftRange.to) return;
    setAppliedRange(draftRange);
    setOpen(false);
  }, [draftRange]);

  const onClear = useCallback(() => {
    setDraftRange(EMPTY_RANGE);
    setAppliedRange(EMPTY_RANGE);
  }, []);

  const onToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) setDraftRange(appliedRange);
      return !prev;
    });
  }, [appliedRange]);

  const display = useMemo(() => {
    if (status === 'ok' && count !== null) return count.toLocaleString();
    if (status === 'loading') return t('propertyCount.loading');
    if (status === 'error' || status === 'no-token') return t('propertyCount.error');
    return '';
  }, [status, count, t]);

  const rangeInvalid = Boolean(
    draftRange.from && draftRange.to && draftRange.from > draftRange.to
  );

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={t('propertyCount.tooltip')}
        className="inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold text-[#1D242B] border border-[#F0F2F5] rounded-full bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="relative inline-flex">
          <Home className="w-4 h-4 text-[#fcc519]" />
          {hasActiveFilter && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#fcc519] rounded-full ring-2 ring-white" />
          )}
        </span>
        <span className="tabular-nums">{display}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="dialog"
          className={`absolute top-full mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#F0F2F5] bg-white shadow-lg p-4 ${
            align === 'start' ? 'left-0' : dir === 'rtl' ? 'left-0' : 'right-0'
          }`}
        >
          <p className="text-xs font-semibold text-[#1D242B] mb-3">
            {t('propertyCount.title')}
          </p>

          <div className="space-y-2">
            <label className="block">
              <span className="block text-[11px] font-medium text-gray-600 mb-1">
                {t('propertyCount.from')}
              </span>
              <input
                type="date"
                value={draftRange.from}
                max={draftRange.to || undefined}
                onChange={(e) => setDraftRange((r) => ({ ...r, from: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-[#F0F2F5] rounded-lg focus:outline-none focus:border-[#fcc519]"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-medium text-gray-600 mb-1">
                {t('propertyCount.to')}
              </span>
              <input
                type="date"
                value={draftRange.to}
                min={draftRange.from || undefined}
                onChange={(e) => setDraftRange((r) => ({ ...r, to: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-[#F0F2F5] rounded-lg focus:outline-none focus:border-[#fcc519]"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClear}
              disabled={!hasActiveFilter && !draftRange.from && !draftRange.to}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-[#1D242B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('propertyCount.clear')}
            </button>
            <button
              type="button"
              onClick={onApply}
              disabled={rangeInvalid}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#fcc519] rounded-full hover:bg-[#e6b817] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('propertyCount.apply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
