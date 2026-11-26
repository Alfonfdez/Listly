import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const I18N_DIR = path.join(process.cwd(), 'src', 'i18n');
const LANGUAGE_FILES = readdirSync(I18N_DIR).filter(file => /^[a-z]{2}\.ts$/.test(file));

function read(file: string): string {
  return readFileSync(path.join(I18N_DIR, file), 'utf8');
}

function scalarValues(source: string): Map<string, string> {
  const values = new Map<string, string>();
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+):\s*'((?:\\'|[^'])*)'\s*,\s*$/);
    if (match) values.set(match[1], match[2]);
  }
  return values;
}

describe('i18n source encoding', () => {
  it('has no replacement characters, mojibake or question marks inside words', () => {
    const violations: string[] = [];
    for (const file of LANGUAGE_FILES) {
      const lines = read(file).split(/\r?\n/);
      lines.forEach((line, index) => {
        if (line.includes('\uFFFD')) violations.push(`${file}:${index + 1} replacement character`);
        // `Ã`/`Â` are valid letters (e.g. pt "Âmbar"), so only flag the
        // sequences that UTF-8-read-as-Latin-1 mojibake produces (a following
        // high Latin-1 char or whitespace), plus the `â€` punctuation prefix.
        if (/\u00C3[\u0080-\u00BF\s]|\u00C2[\u0080-\u00BF]|\u00E2\u20AC/.test(line)) violations.push(`${file}:${index + 1} mojibake`);
        if (/\?[A-Za-z\u00C0-\u024F]/.test(line)) violations.push(`${file}:${index + 1} question mark before a letter`);
        if (/[A-Za-z\u00C0-\u024F]\?[A-Za-z\u00C0-\u024F]/.test(line)) violations.push(`${file}:${index + 1} question mark inside a word`);
      });
    }
    expect(violations).toEqual([]);
  });

  it('keeps question marks consistent with the English source', () => {
    const english = scalarValues(read('en.ts'));
    const violations: string[] = [];
    for (const file of LANGUAGE_FILES.filter(name => name !== 'en.ts')) {
      for (const [key, value] of scalarValues(read(file))) {
        const englishValue = english.get(key);
        if (englishValue === undefined) continue;
        if (englishValue.includes('?') !== value.includes('?')) {
          violations.push(`${file}:${key}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
