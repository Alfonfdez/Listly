import { LANGUAGES, type Language } from '../constants/languages';

export { LANGUAGES };
export type { Language };

export const isEnglish = (lang: Language) => lang === LANGUAGES.en;
export const isSpanish = (lang: Language) => lang === LANGUAGES.es;