import { en, type Language } from './en';
import { es } from './es';
import type { Language as LanguageType } from '../constants/languages';

const languages: Record<string, Language> = { en, es };

let currentLanguage: Language = en;

export function setLanguage(id: LanguageType) {
  currentLanguage = languages[id] ?? en;
}

export function t(): Language {
  return currentLanguage;
}