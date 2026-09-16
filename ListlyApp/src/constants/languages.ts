export const LANGUAGES = {
  en: 'en',
  es: 'es',
} as const;

export type LanguageId = keyof typeof LANGUAGES;