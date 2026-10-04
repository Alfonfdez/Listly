---
name: changelog
description: Creates or updates docs/changelog.md with a chronological record of all code implementations, modifications, and deletions in the project. Use whenever a code change is made.
---

# Changelog

Every time code is added, modified, or deleted in the project, update `docs/changelog.md` by appending an entry at the end. **Do not hand-edit the file** — use the script, so the entry is always well-formed.

## How to append (always)

```bash
# from the repo root
node scripts/append-changelog.mjs \
  --type <type> \
  --files "<comma-separated paths>" \
  --bullet "<change line 1>" \
  --bullet "<change line 2>"
```

- `--type` — one of `+` (added), `~` (modified), `-` (removed), or a word (`feat`/`fix`/`docs`/`refactor`/`style`/`test`/`chore`).
- `--files` — the affected file(s).
- `--bullet` — one per line; repeat the flag for multiple lines. A leading `- ` is optional (added automatically).
- `--date YYYY-MM-DD` — optional (defaults to today).
- `--dry-run` — preview without writing.

### Shell-safe input (use when bullets contain backticks, `$`, quotes…)

**PowerShell mangles backticks and `$`** inside `--bullet` arguments. When a bullet needs `` `code` `` or `$var`, pass the text via a file or stdin instead — it never becomes a shell argument, so it stays verbatim:

```bash
# one bullet per line, verbatim:
node scripts/append-changelog.mjs --type fix --files x.ts --bullets-file entry.txt

# whole entry from stdin (optionally with a "[date] type | files" first line):
Get-Content entry.txt | node scripts/append-changelog.mjs --stdin

# bullets-only via stdin, header from flags:
Get-Content bullets.txt | node scripts/append-changelog.mjs --stdin --type fix --files x.ts
```

Use `--bullet` directly only for plain text without backticks/`$`.

Examples:

```bash
node scripts/append-changelog.mjs --type feat \
  --files "ListlyApp/src/utils/copyList.ts, ListlyApp/tests/utils/copyList.test.ts" \
  --bullet "Numeric copy now includes amounts, quantities and totals." \
  --bullet "Tests updated; \`npm run test:all\` green."
```

Resulting entry:

```markdown
[YYYY-MM-DD] Type | Affected file(s)
- Description of the change
```

| Type | Meaning |
|------|---------|
| `+` | New implementation / file created |
| `~` | Modification of existing code |
| `-` | Deletion of files or code |

## Why the script (do not append by hand)

Hand-appending repeatedly caused two defects: a **missing blank line** between entries, and losing the previous entry's final `.`. The script guarantees:
- exactly **one blank line** between the previous entry and the new one;
- it strips only trailing newlines (never punctuation), and **refuses to write** if the existing tail looks truncated;
- **CRLF** line endings (repo convention) with a single trailing newline.

Never remove previous entries; always append at the end.
