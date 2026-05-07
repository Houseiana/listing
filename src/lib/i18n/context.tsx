'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getDirection, type Locale } from './config';

type Dictionary = Record<string, unknown>;

type TranslateVars = Record<string, string | number>;

type LocaleContextValue = {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  dict: Dictionary;
  t: (key: string, vars?: TranslateVars) => string;
  setLocale: (next: Locale) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const lookup = (dict: Dictionary, key: string): unknown =>
  key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);

const interpolate = (template: string, vars?: TranslateVars): string => {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match
  );
};

export function LocaleProvider({
  initialLocale,
  initialDict,
  children,
}: {
  initialLocale: Locale;
  initialDict: Dictionary;
  children: ReactNode;
}) {
  const router = useRouter();

  const t = useCallback(
    (key: string, vars?: TranslateVars) => {
      const value = lookup(initialDict, key);
      if (typeof value === 'string') return interpolate(value, vars);
      return key;
    },
    [initialDict]
  );

  const setLocale = useCallback(
    async (next: Locale) => {
      if (next === initialLocale) return;
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: next }),
      });
      // Update <html lang/dir> immediately so RTL flips without waiting
      // for the server round-trip; router.refresh() then re-renders the
      // layout with the new dictionary while preserving client state.
      if (typeof document !== 'undefined') {
        document.documentElement.lang = next;
        document.documentElement.dir = getDirection(next);
      }
      router.refresh();
    },
    [initialLocale, router]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: initialLocale,
      dir: getDirection(initialLocale),
      dict: initialDict,
      t,
      setLocale,
    }),
    [initialLocale, initialDict, t, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}

export function useTranslation() {
  return useLocale();
}
