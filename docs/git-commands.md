# Git Commands — Listly

## Important Rules for opencode

opencode must **never** run any of the following git commands. Only the developer performs these actions manually:

- `git commit`
- `git push`
- `git pull`
- `git fetch`
- `git checkout` / `git switch`
- `git merge`
- `gh pr create` / `gh pr merge`
- Any command that modifies the repository state

opencode is only allowed to run **read-only** git commands (e.g., `git status`, `git diff`, `git log`, `git branch`).

---

## Commit Message Generation

When the user says **"give me the commit message"**, run these two commands:

```bash
git status
git diff --stat
```

With this info, generate:
1. A **branch name** following the project convention (`feature/`, `fix/`, `refactor/`, `chore/`, `docs/`)
2. A **commit message** in Conventional Commits format:
   ```
   <type>(<scope>): <description>
   ```
   - Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
   - Scope is optional (e.g., `feat(lists):`, `fix(home):`)
   - Description in English, imperative mood, lowercase, no period
   - Max 50 chars for subject line

### Branch-name-only requests

When the user asks only for **"the branch name"** (not a commit message), return just the
branch name following the same convention (e.g., `fix/form-name-check-button-blink`). The
developer creates and switches branches — opencode never runs `git checkout` / `git switch`
/ `git branch -b`.

If the developer explicitly says **"do not create a branch"** for a given task (a common
one-off instruction), follow it: do not suggest branch creation, do not add a branch to the
workflow for that task, and do not run any branch-related git command.

---

## GitHub Protected Branches

Listly enforces PR-only merges through GitHub branch rulesets on `main` and `develop`:
- No direct commits or pushes to `main` or `develop`.
- Every change lands via a pull request with at least one approval.
- The developer creates branches, opens PRs, and merges them manually.

---

## Branch Cleanup

Delete all local branches except `develop` and `main`:

```bash
git branch | Where-Object { $_.Trim() -notmatch '^\*?\s*(develop|main)$' } | ForEach-Object { git branch -D $_.Trim() }
```

> **Note:** The `.Trim()`, `\*?`, and `\s*` handle the current-branch `* ` prefix correctly, so `main` or `develop` are never accidentally deleted.