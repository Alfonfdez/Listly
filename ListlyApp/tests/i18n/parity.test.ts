import { describe, expect, it } from 'vitest';
import { en } from '../../src/i18n/en';
import { es } from '../../src/i18n/es';
import { ca } from '../../src/i18n/ca';
import { gl } from '../../src/i18n/gl';
import { eu } from '../../src/i18n/eu';
import { fr } from '../../src/i18n/fr';
import { de } from '../../src/i18n/de';
import { pt } from '../../src/i18n/pt';
import { it as itLocale } from '../../src/i18n/it';
import { LANGUAGES } from '../../src/constants/languages';
import type { Translations } from '../../src/i18n/en';

const ALL: Record<string, Translations> = { en, es, ca, gl, eu, fr, de, pt, it: itLocale };
const EN = en as Record<string, unknown>;

describe('i18n key parity', () => {
  it('registers every language in LANGUAGES', () => {
    expect(Object.keys(ALL).sort()).toEqual(Object.values(LANGUAGES).sort());
  });

  it.each(Object.entries(ALL))('"%s" has exactly the same keys as English', (_code, translations) => {
    expect(Object.keys(translations).sort()).toEqual(Object.keys(en).sort());
  });

  it.each(Object.entries(ALL))(
    '"%s" mirrors the function arity of every function key',
    (_code, translations) => {
      for (const [key, value] of Object.entries(EN)) {
        if (typeof value === 'function') {
          const other = (translations as Record<string, unknown>)[key];
          expect(typeof other, `${key} should be a function`).toBe('function');
          expect((other as (...args: unknown[]) => unknown).length).toBe(value.length);
        }
      }
    }
  );

  it.each(Object.entries(ALL).filter(([code]) => code !== 'en'))(
    '"%s" has no empty string values',
    (_code, translations) => {
      for (const [key, value] of Object.entries(translations)) {
        if (typeof value === 'string') {
          expect(value.trim(), `${key} should not be empty`).not.toBe('');
        }
      }
    }
  );
});
