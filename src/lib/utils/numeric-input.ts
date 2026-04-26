import type { KeyboardEvent } from 'react';

// Arabic-Indic digits (٠-٩) and Extended Arabic-Indic digits (۰-۹)
const ARABIC_NUMERALS_GLOBAL = /[٠-٩۰-۹]/g;
const ARABIC_NUMERAL_TEST = /^[٠-٩۰-۹]$/;
const NEGATIVE_SIGNS_GLOBAL = /[-−–—]/g;

export function stripArabicNumerals(value: string): string {
  return value.replace(ARABIC_NUMERALS_GLOBAL, '');
}

export function blockArabicNumeralKey(e: KeyboardEvent<HTMLInputElement>): void {
  if (ARABIC_NUMERAL_TEST.test(e.key)) {
    e.preventDefault();
  }
}

export function stripNegativeSign(value: string): string {
  return value.replace(NEGATIVE_SIGNS_GLOBAL, '');
}

export function blockNonPositiveNumeralKey(e: KeyboardEvent<HTMLInputElement>): void {
  if (ARABIC_NUMERAL_TEST.test(e.key) || e.key === '-' || e.key === '−' || e.key === 'e' || e.key === 'E' || e.key === '+') {
    e.preventDefault();
  }
}
