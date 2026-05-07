import 'server-only';
import type { Locale } from './config';

const loaders = {
  en: () => import('@/locales/en.json').then((m) => m.default),
  ar: () => import('@/locales/ar.json').then((m) => m.default),
} as const;

export type Dictionary = Awaited<ReturnType<(typeof loaders)['en']>>;

export const getDictionary = async (locale: Locale): Promise<Dictionary> =>
  loaders[locale]() as Promise<Dictionary>;
