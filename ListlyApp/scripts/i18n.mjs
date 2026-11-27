// i18n key helper for ListlyApp/src/i18n/*.ts.
//
// Why this exists: every UI string must exist in all 9 languages with the same
// key set (enforced by tests/i18n/parity.test.ts). Adding them by hand was
// error-prone in exactly the ways PowerShell makes worse:
//   - a key added to one file but not the others (parity test fails later)
//   - `'` inside a value not escaped, breaking the TS file
//   - losing the 2-space indent, the section comments, or the CRLF endings
//   - mangling backticks / ${} / `$` when a function value passes through the
//     shell (so function values come from a JSON file, never argv)
//
// So this tool edits the language files surgically, line by line:
//   - it never re-serialises the object, so comments, section grouping,
//     multi-line function values and existing quoting survive untouched
//   - the 9 files stay mirrored line-for-line (same insertion anchor)
//   - writes CRLF + UTF-8, exactly one trailing newline
//   - nothing is written unless EVERY language file checks out (all-or-nothing)
//
// The languages are discovered from src/i18n/*.ts (minus index.ts) instead of
// being hardcoded, which also lets the tests run it against a temp fixture dir.
//
// Run from ListlyApp/ (or anywhere — paths resolve from --root, then the script):
//   node scripts/i18n.mjs list [--key <substr>] [--check] [--json]
//   node scripts/i18n.mjs add --key <name> --value "Text" [--after <key>] [--dry-run]
//   node scripts/i18n.mjs add --key <name> --values-file keys.json [--after <key>]
//   node scripts/i18n.mjs set --key <name> --values-file keys.json
//   node scripts/i18n.mjs set --key <name> --value "Texto" --lang es
//   node scripts/i18n.mjs remove --key <name> [--dry-run]
//
//   npm run i18n -- add --key foo --value "Foo" --after bar
//
// --values-file is a JSON object keyed by language code; a value is either a
// string (single-quoted, escaped for you) or { "raw": "<TS expression>" } which
// is inserted verbatim (how function values are added). Languages missing from
// the file fall back to the English value and are reported as untranslated.
//
//   { "en": "Add account", "es": "Añadir cuenta" }
//   { "en": { "raw": "(n: number) => `${n} item${n === 1 ? '' : 's'}`" } }
//
// Values containing a quote, a backslash, `$` or a backtick MUST come from
// --values-file (a file), never from --value on the command line.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(HERE, '..'); // ListlyApp/
const I18N_DIR = ['src', 'i18n'];
const INDENT = '  ';

const KEY_LINE_RE = /^([ \t]*)([A-Za-z_$][\w$]*)([ \t]*):/;
const CLOSE_LINE_RE = /^[ \t]*\};?[ \t]*$/;
const VALID_KEY_RE = /^[A-Za-z_$][\w$]*$/;
const COMMENT_RE = /^[ \t]*\/\//;

// ---------------------------------------------------------------- pure core

/**
 * A value to write for one key. `kind: 'string'` is single-quoted and escaped;
 * `kind: 'raw'` is inserted verbatim (a TS expression).
 * @typedef {{ kind: 'string' | 'raw', value: string }} ValueSpec
 */

/** @param {string} content @returns {string} */
export function toLf(content) {
  return String(content).replace(/\r\n/g, '\n');
}

/** @param {string} content @returns {string} */
export function toCrlf(content) {
  return String(content).replace(/\r?\n/g, '\r\n');
}

/** @param {string} line @returns {number} */
export function indentOf(line) {
  const m = String(line).match(/^[ \t]*/);
  return m ? m[0].length : 0;
}

/** @param {string} line @returns {string | null} */
export function keyNameOf(line) {
  const m = String(line).match(KEY_LINE_RE);
  return m ? m[2] : null;
}

/** @param {string} value @returns {string} */
export function escapeSingleQuoted(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Normalize a --values-file entry into a ValueSpec.
 * @param {unknown} entry
 * @param {string} [label]
 * @returns {ValueSpec}
 */
export function normalizeValueSpec(entry, label = 'value') {
  if (typeof entry === 'string') {
    if (entry.trim() === '') throw new Error(`${label} is empty`);
    return { kind: 'string', value: entry };
  }
  if (entry && typeof entry === 'object' && typeof (/** @type {any} */ (entry).raw) === 'string') {
    const raw = /** @type {any} */ (entry).raw;
    if (raw.trim() === '') throw new Error(`${label}.raw is empty`);
    if (/,\s*$/.test(raw)) throw new Error(`${label}.raw must not end with a comma (the script adds it)`);
    return { kind: 'raw', value: raw };
  }
  throw new Error(`${label} must be a string or { "raw": "<TS expression>" }`);
}

/**
 * The lines to write for one key. String values are single-quoted + escaped;
 * raw values are verbatim (only the first line gets the indentation, so a
 * hand-wrapped multi-line expression keeps the author's own alignment).
 * @param {string} key
 * @param {ValueSpec} spec
 * @param {string} [indent]
 * @returns {string[]}
 */
export function renderValueLines(key, spec, indent = INDENT) {
  if (spec.kind === 'raw') {
    const parts = String(spec.value).split('\n');
    if (parts.length === 1) return [`${indent}${key}: ${parts[0]},`];
    return [
      `${indent}${key}: ${parts[0]}`,
      ...parts.slice(1, -1),
      `${parts[parts.length - 1]},`,
    ];
  }
  return [`${indent}${key}: '${escapeSingleQuoted(spec.value)}',`];
}

/**
 * Locate a key's full extent (a value may span several lines). Continuation
 * lines are indented deeper than the key line; a blank/comment line counts as
 * part of the value only when a deeper-indented line follows it, so the blank
 * line before the next `// Section` is never swallowed.
 * @param {string[]} lines
 * @param {string} key
 * @returns {{ start: number, end: number } | null}
 */
export function findKeyExtent(lines, key) {
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (keyNameOf(lines[i]) === key) {
      start = i;
      break;
    }
  }
  if (start === -1) return null;

  const base = indentOf(lines[start]);
  let end = start;
  let j = start + 1;
  while (j < lines.length) {
    const line = lines[j];
    if (keyNameOf(line) !== null || CLOSE_LINE_RE.test(line)) break;
    if (line.trim() === '' || COMMENT_RE.test(line)) {
      let k = j;
      while (k < lines.length && lines[k].trim() === '') k++;
      const next = k < lines.length ? lines[k] : null;
      if (next !== null && keyNameOf(next) === null && !CLOSE_LINE_RE.test(next) && indentOf(next) > base) {
        end = k;
        j = k + 1;
        continue;
      }
      break;
    }
    if (indentOf(line) > base) {
      end = j;
      j++;
      continue;
    }
    break;
  }
  return { start, end };
}

function joinLines(lines) {
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

/**
 * @param {string} content
 * @param {{ key: string, spec: ValueSpec, afterKey?: string | null }} options
 * @returns {string}
 */
export function insertKeyInContent(content, { key, spec, afterKey = null }) {
  const lines = toLf(content).split('\n');
  if (findKeyExtent(lines, key)) throw new Error(`key already exists: ${key}`);

  let at;
  if (afterKey) {
    const anchor = findKeyExtent(lines, afterKey);
    if (!anchor) throw new Error(`anchor key not found: ${afterKey}`);
    at = anchor.end + 1;
  } else {
    const close = lines.findIndex((l) => CLOSE_LINE_RE.test(l));
    if (close === -1) throw new Error('could not find the closing "};" of the language object');
    at = close;
  }

  const rendered = renderValueLines(key, spec, INDENT);
  return joinLines([...lines.slice(0, at), ...rendered, ...lines.slice(at)]);
}

/** @param {string} content @param {string} key @returns {string} */
export function removeKeyFromContent(content, key) {
  const lines = toLf(content).split('\n');
  const extent = findKeyExtent(lines, key);
  if (!extent) throw new Error(`key not found: ${key}`);
  return joinLines([...lines.slice(0, extent.start), ...lines.slice(extent.end + 1)]);
}

/** @param {string} content @param {string} key @param {ValueSpec} spec @returns {string} */
export function setValueInContent(content, key, spec) {
  const lines = toLf(content).split('\n');
  const extent = findKeyExtent(lines, key);
  if (!extent) throw new Error(`key not found: ${key}`);
  const indent = lines[extent.start].match(/^[ \t]*/)[0];
  const rendered = renderValueLines(key, spec, indent);
  return joinLines([...lines.slice(0, extent.start), ...rendered, ...lines.slice(extent.end + 1)]);
}

/** Key names, in file order (continuation lines never look like key lines). @param {string} content @returns {string[]} */
export function parseKeys(content) {
  const keys = [];
  for (const line of toLf(content).split('\n')) {
    const name = keyNameOf(line);
    if (name !== null) keys.push(name);
  }
  return keys;
}

/** The value source of a key (its line minus the name, plus continuations). @param {string} content @param {string} key @returns {string | null} */
export function valueSource(content, key) {
  const lines = toLf(content).split('\n');
  const extent = findKeyExtent(lines, key);
  if (!extent) return null;
  return lines.slice(extent.start, extent.end + 1).join('\n');
}

/** @param {string | null} source @returns {number | null} */
export function functionArity(source) {
  if (!source) return null;
  const body = source.slice(source.indexOf(':') + 1);
  if (!body.includes('=>')) return null;
  const paren = body.match(/^\s*\(([^)]*)\)\s*=>/);
  if (paren) {
    const params = paren[1].trim();
    return params === '' ? 0 : params.split(',').length;
  }
  const bare = body.match(/^\s*[A-Za-z_$][\w$]*\s*=>/);
  return bare ? 1 : null;
}

/** @param {string | null} source @returns {string | null} */
export function stringValue(source) {
  if (!source) return null;
  const after = source.slice(source.indexOf(':') + 1).trim();
  const m = after.match(/^'((?:[^'\\]|\\.)*)'/);
  if (m) return m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  const d = after.match(/^"((?:[^"\\]|\\.)*)"/);
  if (d) return d[1];
  return null;
}

/**
 * Compare every language against English. Returns a list of human-readable
 * problems (empty when the files are in parity). Mirrors the intent of
 * tests/i18n/parity.test.ts without needing the TS toolchain.
 * @param {Record<string, string>} contents
 * @returns {string[]}
 */
export function checkParity(contents) {
  const codes = Object.keys(contents);
  const enKeys = parseKeys(contents.en ?? '');
  const problems = [];

  for (const code of codes) {
    if (code === 'en') continue;
    const keys = parseKeys(contents[code]);
    const set = new Set(keys);
    const enSet = new Set(enKeys);
    const missing = enKeys.filter((k) => !set.has(k));
    const extra = keys.filter((k) => !enSet.has(k));
    if (missing.length) problems.push(`${code}: missing ${missing.length} key(s): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', …' : ''}`);
    if (extra.length) problems.push(`${code}: ${extra.length} key(s) not in English: ${extra.slice(0, 5).join(', ')}${extra.length > 5 ? ', …' : ''}`);

    for (const key of enKeys) {
      if (!set.has(key)) continue;
      const en = valueSource(contents.en, key);
      const other = valueSource(contents[code], key);
      const enArity = functionArity(en);
      const otherArity = functionArity(other);
      if (enArity !== null && otherArity !== enArity) {
        problems.push(`${code}: "${key}" should be a function of arity ${enArity} (got ${otherArity === null ? 'a non-function' : otherArity})`);
      }
      if (otherArity === null) {
        const s = stringValue(other);
        if (s !== null && s.trim() === '') problems.push(`${code}: "${key}" is an empty string`);
      }
    }
  }
  return problems;
}

// ------------------------------------------------------------------- the CLI

/** @param {string} root @returns {string[]} */
export function discoverLanguages(root) {
  const dir = path.join(root, ...I18N_DIR);
  if (!existsSync(dir)) throw new Error(`i18n directory not found: ${dir}`);
  const codes = readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .map((f) => f.slice(0, -3))
    .sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b)));
  if (!codes.includes('en')) throw new Error(`no en.ts found in ${dir}`);
  return codes;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--check') out.check = true;
    else if (a === '--json') out.json = true;
    else if (a === '--key') out.key = argv[++i];
    else if (a === '--value') out.value = argv[++i];
    else if (a === '--lang') out.lang = argv[++i];
    else if (a === '--after') out.after = argv[++i];
    else if (a === '--values-file') out.valuesFile = argv[++i];
    else if (a === '--root') out.root = argv[++i];
    else if (a.startsWith('--')) throw new Error(`unknown argument: ${a}`);
    else out._.push(a);
  }
  return out;
}

function readValuesFile(file) {
  if (!file) return null;
  const resolved = path.resolve(file);
  if (!existsSync(resolved)) throw new Error(`values file not found: ${resolved}`);
  let parsed;
  try {
    // A BOM is common in Windows-authored JSON files and breaks JSON.parse.
    parsed = JSON.parse(readFileSync(resolved, 'utf8').replace(/^\uFEFF/, ''));
  } catch (err) {
    throw new Error(`values file is not valid JSON: ${err.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('values file must be a JSON object keyed by language code');
  }
  return parsed;
}

function readLanguageFiles(root, codes) {
  const out = {};
  for (const code of codes) {
    const file = path.join(root, ...I18N_DIR, `${code}.ts`);
    if (!existsSync(file)) throw new Error(`missing language file: ${file}`);
    out[code] = readFileSync(file, 'utf8');
  }
  return out;
}

function langFilePath(root, code) {
  return path.join(root, ...I18N_DIR, `${code}.ts`);
}

function requireKey(args) {
  if (!args.key) throw new Error('--key is required');
  if (!VALID_KEY_RE.test(args.key)) throw new Error(`invalid key name: ${args.key}`);
}

function commandAdd(args, root, codes) {
  requireKey(args);
  const fromFile = readValuesFile(args.valuesFile);

  if (!args.value && !(fromFile && fromFile.en !== undefined)) {
    throw new Error('provide --value or an "en" entry in --values-file');
  }
  if (args.value !== undefined && fromFile && fromFile.en !== undefined) {
    throw new Error('use either --value or --values-file, not both');
  }
  if (fromFile) {
    const unknown = Object.keys(fromFile).filter((c) => !codes.includes(c));
    if (unknown.length) throw new Error(`unknown language code(s) in values file: ${unknown.join(', ')}`);
  }

  const enSpec = fromFile && fromFile.en !== undefined
    ? normalizeValueSpec(fromFile.en, 'en')
    : { kind: 'string', value: args.value };

  const specs = {};
  const untranslated = [];
  for (const code of codes) {
    if (fromFile && fromFile[code] !== undefined) {
      specs[code] = normalizeValueSpec(fromFile[code], code);
    } else {
      specs[code] = enSpec;
      if (code !== 'en') untranslated.push(code);
    }
  }

  // All-or-nothing: render every file first, write only if they all check out.
  const contents = readLanguageFiles(root, codes);
  const next = {};
  for (const code of codes) {
    next[code] = insertKeyInContent(contents[code], { key: args.key, spec: specs[code], afterKey: args.after });
  }

  if (args.dryRun) {
    console.log(`would add "${args.key}"${args.after ? ` after "${args.after}"` : ' at the end of the object'} in ${codes.length} file(s):`);
    for (const code of codes) {
      for (const line of renderValueLines(args.key, specs[code], INDENT)) console.log(`  ${code}: ${line}`);
    }
  } else {
    for (const code of codes) writeFileSync(langFilePath(root, code), toCrlf(next[code]), 'utf8');
    console.log(`added "${args.key}" to ${codes.length} file(s)${args.after ? ` after "${args.after}"` : ''}`);
  }
  if (untranslated.length) {
    console.log(`untranslated (English used) in: ${untranslated.join(', ')}`);
  }
  console.log('next: npm run test:all (the i18n parity test must pass)');
}

function commandSet(args, root, codes) {
  requireKey(args);
  const fromFile = readValuesFile(args.valuesFile);
  if (!fromFile && !args.value) throw new Error('provide --values-file or --value');
  if (fromFile && args.value) throw new Error('use either --value or --values-file, not both');
  if (args.value && !args.lang) throw new Error('--value requires --lang');

  let targets;
  if (fromFile) {
    targets = Object.keys(fromFile);
    const unknown = targets.filter((c) => !codes.includes(c));
    if (unknown.length) throw new Error(`unknown language code(s) in values file: ${unknown.join(', ')}`);
  } else {
    if (!codes.includes(args.lang)) throw new Error(`unknown language code: ${args.lang}`);
    targets = [args.lang];
  }
  if (targets.length === 0) throw new Error('no language to update');

  const contents = readLanguageFiles(root, codes);
  const next = {};
  for (const code of targets) {
    const spec = fromFile ? normalizeValueSpec(fromFile[code], code) : { kind: 'string', value: args.value };
    next[code] = setValueInContent(contents[code], args.key, spec);
  }

  if (args.dryRun) {
    console.log(`would set "${args.key}" in: ${targets.join(', ')}`);
    for (const code of targets) console.log(`  ${code}: ${renderValueLines(args.key, fromFile ? normalizeValueSpec(fromFile[code], code) : { kind: 'string', value: args.value })[0]}`);
  } else {
    for (const code of targets) writeFileSync(langFilePath(root, code), toCrlf(next[code]), 'utf8');
    console.log(`updated "${args.key}" in: ${targets.join(', ')}`);
  }
}

function commandRemove(args, root, codes) {
  requireKey(args);
  const contents = readLanguageFiles(root, codes);
  const missing = codes.filter((code) => !findKeyExtent(toLf(contents[code]).split('\n'), args.key));
  if (missing.length) throw new Error(`key "${args.key}" is missing from: ${missing.join(', ')} (refusing a partial removal)`);

  const next = {};
  for (const code of codes) next[code] = removeKeyFromContent(contents[code], args.key);

  if (args.dryRun) {
    console.log(`would remove "${args.key}" from ${codes.length} file(s)`);
  } else {
    for (const code of codes) writeFileSync(langFilePath(root, code), toCrlf(next[code]), 'utf8');
    console.log(`removed "${args.key}" from ${codes.length} file(s)`);
  }
}

function commandList(args, root, codes) {
  const contents = readLanguageFiles(root, codes);
  const problems = checkParity(contents);

  if (args.key) {
    const needle = args.key.toLowerCase();
    const enKeys = parseKeys(contents.en).filter((k) => k.toLowerCase().includes(needle));
    if (args.json) {
      console.log(JSON.stringify(enKeys.map((key) => ({
        key,
        values: Object.fromEntries(codes.map((code) => [code, stringValue(valueSource(contents[code], key))])),
        present: codes.filter((code) => findKeyExtent(toLf(contents[code]).split('\n'), key)),
      })), null, 2));
      return;
    }
    for (const key of enKeys) {
      const absent = codes.filter((code) => !findKeyExtent(toLf(contents[code]).split('\n'), key));
      const source = valueSource(contents.en, key);
      const preview = stringValue(source) ?? source?.slice(source.indexOf(':') + 1).trim() ?? '';
      console.log(`${key}: ${preview.length > 60 ? `${preview.slice(0, 57)}…` : preview}`);
      if (absent.length) console.log(`  missing from: ${absent.join(', ')}`);
    }
    console.log(`${enKeys.length} key(s) matching "${args.key}"`);
    return;
  }

  if (args.json) {
    console.log(JSON.stringify({
      languages: codes,
      counts: Object.fromEntries(codes.map((code) => [code, parseKeys(contents[code]).length])),
      problems,
    }, null, 2));
  } else {
    for (const code of codes) console.log(`${code}: ${parseKeys(contents[code]).length} keys`);
    console.log(problems.length ? `\n${problems.length} parity problem(s):\n- ${problems.join('\n- ')}` : '\nparity: OK');
  }
  if (args.check && problems.length) process.exitCode = 1;
}

/** @param {string[]} argv @returns {void} */
export function runCli(argv) {
  const args = parseArgs(argv);
  const command = args._[0];
  const root = args.root ? path.resolve(args.root) : DEFAULT_ROOT;

  if (!command) throw new Error('usage: i18n.mjs <list|add|set|remove> [options]');
  if (!existsSync(root)) throw new Error(`root not found: ${root}`);

  const codes = discoverLanguages(root);
  if (command === 'list') return commandList(args, root, codes);
  if (command === 'add') return commandAdd(args, root, codes);
  if (command === 'set') return commandSet(args, root, codes);
  if (command === 'remove') return commandRemove(args, root, codes);
  throw new Error(`unknown command: ${command}`);
}

const invokedDirectly = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (invokedDirectly) {
  try {
    runCli(process.argv.slice(2));
  } catch (err) {
    console.error(`i18n: ${err.message}`);
    process.exit(1);
  }
}
