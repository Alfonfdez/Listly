import { en, type Translations } from './en';
import { es } from './es';
import type { LanguageId } from '../constants/languages';

const languages: Record<LanguageId, Translations> = { en, es };

let currentLanguage: Translations = en;

export function setLanguage(id: LanguageId) {
  currentLanguage = languages[id] ?? en;
}

export function t(): Translations {
  return currentLanguage;
}
