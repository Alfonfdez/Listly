import { describe, it, expect, afterAll } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  checkParity,
  discoverLanguages,
  escapeSingleQuoted,
  findKeyExtent,
  functionArity,
  insertKeyInContent,
  normalizeValueSpec,
  parseKeys,
  removeKeyFromContent,
  renderValueLines,
  setValueInContent,
  toCrlf,
  toLf,
  valueSource,
} from '../../scripts/i18n.mjs';

// vitest runs with cwd = ListlyApp/ (see package.json scripts); the app root can
// be overridden for the odd invocation from elsewhere.
const APP_ROOT = process.env.LISTLY_APP_ROOT ?? process.cwd();
const SCRIPT = path.resolve(APP_ROOT, 'scripts/i18n.mjs');
const REAL_I18N = path.resolve(APP_ROOT, 'src/i18n');

const crlf = (s: string) => s.replace(/\n/g, '\r\n');
const noLoneLf = (s: string) => s.split('\r\n').join('');

// A miniature en/es/ca set that mirrors the real shapes: a plain key, a value
// with an escaped apostrophe, a multi-line function value, a blank line +
// section comment, a double-quoted value and (en only) the type export.
function fixtureFiles(): Record<string, string> {
  return {
    en: [
      'export const en = {',
      '  // Generic',
      "  alpha: 'one',",
      "  gamma: 'Three\\'s',",
      '  bulk: (n: number, total: number) =>',
      '    n === 1',
      '      ? `1 of the ${total} selected`',
      '      : `${n} of the ${total} selected`,',
      "  omega: 'last',",
      '',
      '  // Section two',
      '  quote: "double quoted",',
      '};',
      '',
      'export type Language = typeof en;',
      '',
    ].join('\n'),
    es: [
      'export const es = {',
      '  // Generic',
      "  alpha: 'uno',",
      "  gamma: 'Tres',",
      '  bulk: (n: number, total: number) =>',
      '    n === 1',
      '      ? `1 de los ${total}`',
      '      : `${n} de los ${total}`,',
      "  omega: 'ultimo',",
      '',
      '  // Section two',
      '  quote: "comillas dobles",',
      '};',
      '',
    ].join('\n'),
    ca: [
      'export const ca = {',
      '  // Generic',
      "  alpha: 'un',",
      "  gamma: 'Tres',",
      '  bulk: (n: number, total: number) =>',
      '    n === 1',
      '      ? `1 de ${total}`',
      '      : `${n} de ${total}`,',
      "  omega: 'ultim',",
      '',
      '  // Section two',
      '  quote: "cometes dobles",',
      '};',
      '',
    ].join('\n'),
  };
}

const tempDirs: string[] = [];

function makeRoot(files = fixtureFiles()): string {
  const root = mkdtempSync(path.join(tmpdir(), 'listly-i18n-'));
  tempDirs.push(root);
  mkdirSync(path.join(root, 'src', 'i18n'), { recursive: true });
  for (const [code, content] of Object.entries(files)) {
    writeFileSync(path.join(root, 'src', 'i18n', `${code}.ts`), crlf(content), 'utf8');
  }
  return root;
}

function readLang(root: string, code: string): string {
  return readFileSync(path.join(root, 'src', 'i18n', `${code}.ts`), 'utf8');
}

function runCli(args: string[], root: string) {
  return spawnSync(process.execPath, [SCRIPT, ...args, '--root', root], { encoding: 'utf8' });
}

afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

describe('i18n helper: escaping', () => {
  it('escapes backslashes and apostrophes, in that order', () => {
    expect(escapeSingleQuoted("It's C:\\path")).toBe("It\\'s C:\\\\path");
  });

  it('renders a single-quoted line with the 2-space indent', () => {
    expect(renderValueLines('k', { kind: 'string', value: "It's" })).toEqual(["  k: 'It\\'s',"]);
  });

  it('keeps non-ASCII, $ and backticks untouched', () => {
    const value = 'Añadir – ç ñ € `${x}` $HOME';
    expect(renderValueLines('k', { kind: 'string', value })).toEqual([`  k: '${value}',`]);
  });

  it('renders a raw expression verbatim and adds the comma', () => {
    expect(renderValueLines('k', { kind: 'raw', value: '(n: number) => `${n}`' }))
      .toEqual(['  k: (n: number) => `${n}`,']);
  });

  it('indents only the first line of a multi-line raw value', () => {
    const raw = '(n: number) =>\n    n === 1\n      ? `one`\n      : `${n} many`';
    expect(renderValueLines('k', { kind: 'raw', value: raw })).toEqual([
      '  k: (n: number) =>',
      '    n === 1',
      '      ? `one`',
      '      : `${n} many`,',
    ]);
  });

  it('rejects empty and comma-terminated values', () => {
    expect(() => normalizeValueSpec('   ')).toThrow(/empty/);
    expect(() => normalizeValueSpec({ raw: '`x`,' })).toThrow(/comma/);
    expect(() => normalizeValueSpec(42)).toThrow(/string or \{ "raw"/);
    expect(normalizeValueSpec('ok')).toEqual({ kind: 'string', value: 'ok' });
    expect(normalizeValueSpec({ raw: '`x`' })).toEqual({ kind: 'raw', value: '`x`' });
  });
});

describe('i18n helper: anchors and insertion', () => {
  const base = crlf(fixtureFiles().en);

  it('inserts right after a single-line anchor', () => {
    const out = toLf(insertKeyInContent(base, { key: 'beta', spec: { kind: 'string', value: 'two' }, afterKey: 'alpha' }));
    const lines = out.split('\n');
    expect(lines[lines.indexOf("  alpha: 'one',") + 1]).toBe("  beta: 'two',");
    expect(lines[lines.indexOf("  beta: 'two',") + 1]).toBe("  gamma: 'Three\\'s',");
  });

  it('inserts after the LAST line of a multi-line anchor value', () => {
    const out = toLf(insertKeyInContent(base, { key: 'beta', spec: { kind: 'string', value: 'two' }, afterKey: 'bulk' }));
    const lines = out.split('\n');
    const inserted = lines.indexOf("  beta: 'two',");
    expect(lines[inserted - 1]).toBe('      : `${n} of the ${total} selected`,');
    expect(lines[inserted + 1]).toBe("  omega: 'last',");
  });

  it('refuses an unknown anchor', () => {
    expect(() => insertKeyInContent(base, { key: 'beta', spec: { kind: 'string', value: 'x' }, afterKey: 'nope' }))
      .toThrow(/anchor key not found: nope/);
  });

  it('refuses a duplicate key', () => {
    expect(() => insertKeyInContent(base, { key: 'alpha', spec: { kind: 'string', value: 'x' } }))
      .toThrow(/already exists: alpha/);
  });

  it('appends before the closing brace and keeps the type export after it', () => {
    const out = toLf(insertKeyInContent(base, { key: 'zeta', spec: { kind: 'string', value: 'z' } }));
    const lines = out.split('\n');
    const inserted = lines.indexOf("  zeta: 'z',");
    expect(lines[inserted + 1]).toBe('};');
    expect(lines[inserted + 3]).toBe('export type Language = typeof en;');
  });

  it('writes CRLF and leaves every other byte untouched', () => {
    const out = toCrlf(insertKeyInContent(base, { key: 'zeta', spec: { kind: 'string', value: 'z' }, afterKey: 'omega' }));
    expect(noLoneLf(out)).not.toContain('\n');
    expect(out).toBe(base.replace(/  omega: 'last',\r\n/, "  omega: 'last',\r\n  zeta: 'z',\r\n"));
  });
});

describe('i18n helper: multi-line values', () => {
  const base = crlf(fixtureFiles().en);
  const lines = toLf(base).split('\n');

  it('finds the whole extent of a wrapped function value', () => {
    const extent = findKeyExtent(lines, 'bulk');
    expect(extent).toEqual({ start: lines.indexOf('  bulk: (n: number, total: number) =>'), end: lines.indexOf('      : `${n} of the ${total} selected`,') });
  });

  it('stops before the blank line and the next section comment', () => {
    const extent = findKeyExtent(lines, 'omega')!;
    expect(lines[extent.end]).toBe("  omega: 'last',");
    expect(lines[extent.end + 1]).toBe('');
    expect(lines[extent.end + 2]).toBe('  // Section two');
  });

  it('removes the key plus all its continuation lines', () => {
    const out = toLf(removeKeyFromContent(base, 'bulk'));
    expect(out).not.toContain('bulk');
    expect(out).not.toContain('selected');
    expect(out).toContain("  omega: 'last',");
    expect(out.split('\n').length).toBe(lines.length - 4);
  });

  it('reports the function arity of a wrapped value', () => {
    expect(functionArity(valueSource(base, 'bulk'))).toBe(2);
    expect(functionArity(valueSource(base, 'alpha'))).toBeNull();
  });
});

describe('i18n helper: removal and updates', () => {
  const base = crlf(fixtureFiles().en);

  it('refuses to remove a key that is not there', () => {
    expect(() => removeKeyFromContent(base, 'nope')).toThrow(/key not found: nope/);
  });

  it('keeps the key and replaces only the value', () => {
    const out = toLf(setValueInContent(base, 'gamma', { kind: 'string', value: "Four's" }));
    expect(out).toContain("  gamma: 'Four\\'s',");
    expect(out).not.toContain('Three');
    expect(out.split('\n').length).toBe(toLf(base).split('\n').length);
  });

  it('replaces a wrapped value with a single line and vice versa', () => {
    const collapsed = toLf(setValueInContent(base, 'bulk', { kind: 'raw', value: '(n: number) => `${n}`' }));
    expect(collapsed).toContain('  bulk: (n: number) => `${n}`,');
    expect(collapsed).not.toContain('selected');
  });

  it('lists keys in file order', () => {
    expect(parseKeys(base)).toEqual(['alpha', 'gamma', 'bulk', 'omega', 'quote']);
  });
});

describe('i18n helper: parity check', () => {
  it('accepts a mirrored fixture set', () => {
    const contents = Object.fromEntries(Object.entries(fixtureFiles()).map(([k, v]) => [k, v]));
    expect(checkParity(contents)).toEqual([]);
  });

  it('reports a missing key', () => {
    const files = fixtureFiles();
    files.es = files.es.replace("  alpha: 'uno',\n", '');
    const problems = checkParity(files);
    expect(problems.join('\n')).toMatch(/es: missing 1 key\(s\): alpha/);
  });

  it('reports an extra key and an arity mismatch', () => {
    const files = fixtureFiles();
    files.ca = files.ca.replace("  omega: 'ultim',", "  omega: 'ultim',\n  stray: 'x',");
    files.ca = files.ca.replace(/bulk: \(n: number, total: number\) =>[\s\S]*?`,/, "bulk: 'not a function',");
    const problems = checkParity(files);
    expect(problems.join('\n')).toMatch(/ca: 1 key\(s\) not in English: stray/);
    expect(problems.join('\n')).toMatch(/ca: "bulk" should be a function of arity 2/);
  });
});

describe('i18n helper: CLI', () => {
  it('discovers the language files and requires en', () => {
    const root = makeRoot();
    expect(discoverLanguages(root)).toEqual(['en', 'ca', 'es']);
    const broken = makeRoot({ en: fixtureFiles().en, es: fixtureFiles().es });
    expect(discoverLanguages(broken)).toEqual(['en', 'es']);
    expect(() => discoverLanguages(path.join(root, 'nope'))).toThrow(/i18n directory not found/);
  });

  it('list --check exits 0 on a clean set and prints counts', () => {
    const root = makeRoot();
    const res = runCli(['list', '--check'], root);
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/en: 5 keys/);
    expect(res.stdout).toMatch(/parity: OK/);
  });

  it('list --check exits 1 when a key is missing', () => {
    const files = fixtureFiles();
    files.es = files.es.replace("  alpha: 'uno',", '');
    const root = makeRoot(files);
    const res = runCli(['list', '--check'], root);
    expect(res.status).toBe(1);
    expect(res.stdout).toMatch(/es: missing 1 key\(s\): alpha/);
  });

  it('add --dry-run writes nothing', () => {
    const root = makeRoot();
    const before = readLang(root, 'en');
    const res = runCli(['add', '--key', 'zeta', '--value', 'Z', '--after', 'omega', '--dry-run'], root);
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/would add "zeta" after "omega"/);
    expect(res.stdout).toMatch(/en: {3}zeta: 'Z',/);
    expect(readLang(root, 'en')).toBe(before);
  });

  it('add writes every language at the same anchor and is not re-runnable', () => {
    const root = makeRoot();
    const res = runCli(['add', '--key', 'zeta', '--value', 'Z', '--after', 'omega'], root);
    expect(res.status).toBe(0);
    for (const code of ['en', 'es', 'ca']) {
      const content = readLang(root, code);
      expect(content).toContain("  zeta: 'Z',");
      expect(content).not.toMatch(/[^\r]\n/);
      expect(content.indexOf("  zeta: 'Z',")).toBeGreaterThan(content.indexOf('  omega:'));
    }
    const again = runCli(['add', '--key', 'zeta', '--value', 'Z', '--after', 'omega'], root);
    expect(again.status).toBe(1);
    expect(again.stderr).toMatch(/already exists: zeta/);
  });

  it('add escapes apostrophes and reports untranslated languages', () => {
    const root = makeRoot();
    const res = runCli(['add', '--key', 'zeta', '--value', "It's", '--after', 'alpha'], root);
    expect(res.status).toBe(0);
    expect(readLang(root, 'en')).toContain("  zeta: 'It\\'s',");
    expect(res.stdout).toMatch(/untranslated \(English used\) in: ca, es/);
  });

  it('add refuses to write anything when one language cannot take the key', () => {
    const files = fixtureFiles();
    files.ca = files.ca.replace(/bulk: \(n: number, total: number\) =>[\s\S]*?`,/, '');
    const root = makeRoot(files);
    const beforeEn = readLang(root, 'en');
    const res = runCli(['add', '--key', 'zeta', '--value', 'Z', '--after', 'bulk'], root);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/anchor key not found: bulk/);
    expect(readLang(root, 'en')).toBe(beforeEn);
  });

  it('add takes values from a JSON file, including raw expressions', () => {
    const root = makeRoot();
    const valuesFile = path.join(root, 'keys.json');
    writeFileSync(valuesFile, JSON.stringify({
      en: { raw: "(n: number) => `${n} thing${n === 1 ? '' : 's'}`" },
      es: 'cosas',
    }), 'utf8');
    const res = runCli(['add', '--key', 'things', '--values-file', valuesFile, '--after', 'alpha'], root);
    expect(res.status).toBe(0);
    expect(readLang(root, 'en')).toContain("  things: (n: number) => `${n} thing${n === 1 ? '' : 's'}`,");
    expect(readLang(root, 'es')).toContain("  things: 'cosas',");
    expect(readLang(root, 'ca')).toContain("  things: (n: number) => `${n} thing${n === 1 ? '' : 's'}`,");
    expect(res.stdout).toMatch(/untranslated \(English used\) in: ca/);
  });

  it('add accepts a values file with a UTF-8 BOM', () => {
    const root = makeRoot();
    const valuesFile = path.join(root, 'keys.json');
    writeFileSync(valuesFile, '\uFEFF' + JSON.stringify({ en: 'Bommed' }), 'utf8');

    const res = runCli(['add', '--key', 'bommed', '--values-file', valuesFile], root);
    expect(res.status).toBe(0);
    expect(readLang(root, 'en')).toContain("  bommed: 'Bommed',");
  });

  it('add rejects an unknown language code in the values file', () => {
    const root = makeRoot();
    const valuesFile = path.join(root, 'keys.json');
    writeFileSync(valuesFile, JSON.stringify({ en: 'x', xx: 'y' }), 'utf8');
    const res = runCli(['add', '--key', 'zeta', '--values-file', valuesFile], root);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/unknown language code\(s\) in values file: xx/);
  });

  it('set updates one language or many', () => {
    const root = makeRoot();
    const one = runCli(['set', '--key', 'gamma', '--value', "Cuatro's", '--lang', 'es'], root);
    expect(one.status).toBe(0);
    expect(readLang(root, 'es')).toContain("  gamma: 'Cuatro\\'s',");
    expect(readLang(root, 'en')).toContain("  gamma: 'Three\\'s',");

    const valuesFile = path.join(root, 'set.json');
    writeFileSync(valuesFile, JSON.stringify({ en: 'One', ca: 'Un' }), 'utf8');
    const many = runCli(['set', '--key', 'alpha', '--values-file', valuesFile], root);
    expect(many.status).toBe(0);
    expect(readLang(root, 'en')).toContain("  alpha: 'One',");
    expect(readLang(root, 'ca')).toContain("  alpha: 'Un',");
    expect(readLang(root, 'es')).toContain("  alpha: 'uno',");
  });

  it('set requires --lang when --value is used', () => {
    const root = makeRoot();
    const res = runCli(['set', '--key', 'alpha', '--value', 'x'], root);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/--value requires --lang/);
  });

  it('remove deletes the key everywhere, and refuses a partial removal', () => {
    const root = makeRoot();
    const res = runCli(['remove', '--key', 'bulk'], root);
    expect(res.status).toBe(0);
    expect(readLang(root, 'en')).not.toContain('bulk');
    expect(readLang(root, 'es')).not.toContain('bulk');

    const files = fixtureFiles();
    files.ca = files.ca.replace(/bulk: \(n: number, total: number\) =>[\s\S]*?`,/, '');
    const partial = makeRoot(files);
    const before = readLang(partial, 'en');
    const bad = runCli(['remove', '--key', 'bulk'], partial);
    expect(bad.status).toBe(1);
    expect(bad.stderr).toMatch(/missing from: ca/);
    expect(readLang(partial, 'en')).toBe(before);
  });

  it('rejects an invalid key name and an unknown command', () => {
    const root = makeRoot();
    expect(runCli(['add', '--key', '2bad', '--value', 'x'], root).stderr).toMatch(/invalid key name/);
    expect(runCli(['nope'], root).stderr).toMatch(/unknown command: nope/);
    expect(runCli(['add', '--key', 'zeta'], root).stderr).toMatch(/provide --value or an "en" entry/);
  });
});

describe('i18n helper: against the real language files', () => {
  it('parses every real file and finds no parity problem', () => {
    const codes = discoverLanguages(APP_ROOT);
    expect(codes).toEqual(['en', 'ca', 'de', 'es', 'eu', 'fr', 'gl', 'it', 'pt']);
    const contents = Object.fromEntries(codes.map((code) => [code, readFileSync(path.join(REAL_I18N, `${code}.ts`), 'utf8')]));
    expect(checkParity(contents)).toEqual([]);
    expect(parseKeys(contents.en).length).toBeGreaterThan(200);
  });
});
