#!/usr/bin/env node
// Append a well-formed entry to docs/changelog.md.
//
// Why this exists: appending by hand kept producing two defects — a missing
// blank line between entries, and (on trimming) losing the final "." of the
// previous entry. This script makes the append deterministic:
//   - strips ONLY trailing newlines (never other whitespace, never punctuation)
//   - refuses to write if the existing tail looks truncated (doesn't end in
//     sentence punctuation) — a guard against eating content
//   - guarantees exactly one blank line between the previous entry and the new
//     one
//   - writes CRLF (repo convention) with a single trailing newline
//
// Usage:
//   node scripts/append-changelog.mjs \
//     --type fix \
//     --files "ListlyApp/src/foo.ts, ListlyApp/tests/foo.test.ts" \
//     --bullet "- Did X." \
//     --bullet "- Did Y." \
//     [--date 2026-10-02] [--root <repoRoot>] [--dry-run]
//
// --bullet can be repeated; each becomes its own line. A bullet may be given
// without the leading "- " (the script adds it).
//
// Shell-safe alternatives (use these when bullets contain backticks, quotes,
// `$`, or other characters the shell would mangle — notably PowerShell):
//   --bullets-file <path>  read bullet lines verbatim from a file (one/line)
//   --stdin                read the entry body from stdin; accepts either a
//                          full entry ("[date] type | files" + bullets) or
//                          just the bullet lines (pair with --type/--files)
//
// Examples:
//   node scripts/append-changelog.mjs --type fix --files x.ts \
//     --bullet 'Uses `backtick` freely.'
//
//   # PowerShell-safe: pipe the body from a file (or heredoc)
//   Get-Content entry.txt | node scripts/append-changelog.mjs --stdin
//
// Type is one of: + (added), ~ (modified), - (removed), or a Conventional
// Commits-ish word (feat/fix/docs/refactor/style/test/chore). The script prints
// the normalized header it writes so the caller can confirm.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { bullets: [], dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--stdin') out.stdin = true;
    else if (a === '--type') out.type = argv[++i];
    else if (a === '--files') out.files = argv[++i];
    else if (a === '--bullet') out.bullets.push(argv[++i]);
    else if (a === '--bullets-file') out.bulletsFile = argv[++i];
    else if (a === '--date') out.date = argv[++i];
    else if (a === '--root') out.root = argv[++i];
    else throw new Error(`Unknown argument: ${a}`);
  }
  return out;
}

// Read the whole stdin stream synchronously (Node 20+). Used by --stdin so the
// entry body never passes through the shell (backticks, quotes, $ etc. stay
// verbatim — PowerShell would otherwise mangle them).
function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function normalizeType(type) {
  if (!type) throw new Error('--type is required');
  const t = type.trim();
  if (['+', '~', '-'].includes(t)) return t;
  return t; // allow word forms (feat/fix/...)
}

function normalizeBullet(b) {
  const s = String(b).replace(/\r?\n/g, ' ').trim();
  if (!s) throw new Error('Empty bullet');
  return /^[-*]\s/.test(s) ? s : `- ${s}`;
}

function append({ root, date, type, files, bullets, dryRun }) {
  const file = path.join(root, 'docs', 'changelog.md');
  if (!existsSync(file)) throw new Error(`Changelog not found: ${file}`);
  if (!files) throw new Error('--files is required');
  if (bullets.length === 0) throw new Error('At least one --bullet is required');

  // Read and normalize to LF.
  let content = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

  // Strip ONLY trailing newlines — never spaces/tabs, never a period.
  content = content.replace(/\n+$/, '');

  // Guard: the existing tail must end in sentence-like punctuation. This
  // catches the "ate the ." failure mode where content got truncated.
  const tail = content.slice(-1);
  if (!/[.)\]`>!?]$/.test(tail)) {
    throw new Error(
      `Refusing to append: changelog tail ends with ${JSON.stringify(tail)} — ` +
        'it looks truncated (expected a sentence-ending char). Fix the last entry first.'
    );
  }

  const header = `[${date}] ${type} | ${files}`;
  const entry = [header, ...bullets.map(normalizeBullet)].join('\n');

  // Exactly one blank line between the previous entry and the new one.
  const next = `${content}\n\n${entry}\n`;

  if (dryRun) {
    return { file, header, preview: next.slice(-entry.length - 4) };
  }

  writeFileSync(file, next.replace(/\n/g, '\r\n'), 'utf8');
  return { file, header };
}

try {
  const args = parseArgs(process.argv.slice(2));
  const root = args.root ? path.resolve(args.root) : path.resolve(here, '..');

  // Sources of bullets (verbatim, no shell). Precedence:
  //   --stdin (whole stdin)  >  --bullets-file  >  repeated --bullet args.
  let bullets = args.bullets;
  let files = args.files;
  let type = args.type;
  let headerOverrides = {};

  if (args.stdin) {
    // The stdin body may be either:
    //   (a) a full entry: "[date] type | files" then bullet lines, or
    //   (b) just bullet lines (with --type/--files provided, or in the header).
    const raw = readStdin().replace(/\r\n/g, '\n').replace(/\n+$/, '');
    const lines = raw.split('\n');
    if (lines[0] && /^\[[^\]]+\]\s+\S/.test(lines[0].trim())) {
      const header = lines.shift().trim();
      const m = header.match(/^\[([^\]]+)\]\s+(\S+)\s+\|\s+(.+)$/);
      if (m) headerOverrides = { date: m[1], type: m[2], files: m[3] };
      bullets = lines;
    } else {
      bullets = lines;
    }
  } else if (args.bulletsFile) {
    const raw = readFileSync(path.resolve(args.bulletsFile), 'utf8');
    bullets = raw.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  }

  const result = append({
    root,
    date: args.date || headerOverrides.date || todayISO(),
    type: normalizeType(type || headerOverrides.type),
    files: files || headerOverrides.files,
    bullets: bullets.filter((b) => b.trim().length > 0),
    dryRun: args.dryRun,
  });
  console.log(`${args.dryRun ? 'would append' : 'appended'}: ${result.header}`);
  if (args.dryRun) console.log(result.preview);
} catch (err) {
  console.error(`append-changelog: ${err.message}`);
  process.exit(1);
}
