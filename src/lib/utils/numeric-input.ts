import type { KeyboardEvent } from 'react';

// Arabic-Indic digits (٠-٩) and Extended Arabic-Indic digits (۰-۹)
const ARABIC_NUMERALS_GLOBAL = /[٠-٩۰-۹]/g;
const ARABIC_NUMERAL_TEST = /^[٠-٩۰-۹]$/;

export function stripArabicNumerals(value: string): string {
  return value.replace(ARABIC_NUMERALS_GLOBAL, '');
}

export function blockArabicNumeralKey(e: KeyboardEvent<HTMLInputElement>): void {
  if (ARABIC_NUMERAL_TEST.test(e.key)) {
    e.preventDefault();
  }
}
