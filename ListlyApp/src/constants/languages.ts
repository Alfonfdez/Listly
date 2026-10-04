export const LANGUAGES = {
  en: 'en',
  es: 'es',
  ca: 'ca',
  gl: 'gl',
  eu: 'eu',
  fr: 'fr',
  de: 'de',
  pt: 'pt',
  it: 'it',
} as const;

export type LanguageId = keyof typeof LANGUAGES;
