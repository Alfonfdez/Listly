export const LANGUAGES = {
  en: 'en',
  es: 'es',
} as const;

export type Language = keyof typeof LANGUAGES;