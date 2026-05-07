'use client';

import { Globe } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

export function LocaleSwitcher() {
  const { locale, setLocale } = useTranslation();
  const next = locale === 'en' ? 'ar' : 'en';
  const label = next === 'ar' ? 'العربية' : 'English';

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label="Switch language"
      className="flex items-center gap-2 px-4 py-3 text-xs font-normal text-[#1D242B] border border-[#F0F2F5] rounded-full hover:bg-gray-50 transition-colors"
    >
      <Globe className="w-4 h-4" />
      {label}
    </button>
  );
}
