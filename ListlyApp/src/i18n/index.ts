import { en, type Translations } from './en';
import { es } from './es';
import { ca } from './ca';
import { gl } from './gl';
import { eu } from './eu';
import { fr } from './fr';
import { de } from './de';
import { pt } from './pt';
import { it } from './it';
import type { LanguageId } from '../constants/languages';

const languages: Record<LanguageId, Translations> = { en, es, ca, gl, eu, fr, de, pt, it };

let currentLanguage: Translations = en;

export function setLanguage(id: LanguageId) {
  currentLanguage = languages[id] ?? en;
}

export function getLabels(id: LanguageId): Translations {
  return languages[id] ?? en;
}

export function t(): Translations {
  return currentLanguage;
}
