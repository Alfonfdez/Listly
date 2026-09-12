# Validations

General data-validation conventions for Listly. Feature specs define their exact rules; this file holds the shared patterns every screen/form follows.

## Text inputs
- **Trim**: names and notes are trimmed on save. Whitespace-only values are invalid/empty.
- **Non-empty**: a required field is invalid when empty after trimming.
- **Max length** (named constants, never magic numbers):
  - List name: `MAX_LIST_NAME_LENGTH = 100`
  - Item name: `MAX_ITEM_NAME_LENGTH = 200`
  - Item note: `MAX_ITEM_NOTE_LENGTH = 2000`
- **Duplicate names**:
  - List names are unique globally (case-insensitive, NOCASE).
  - Item names are unique *within their list* (case-insensitive).
  - Duplicate checks exclude the current row when editing (e.g., `existsByName(name, excludeId)`).
- **Debounce**: duplicate checks run with a ~300 ms debounce against the repository.

## Numeric values
- None in the MVP (no amounts). Added per feature if a numeric field appears.

## Boolean flags
- `checked` is stored as `0`/`1` in SQLite (Drizzle boolean + column default 0).

## Database-boundary validation (Zod)
- Every row read from the database is validated with the Zod schemas in `src/database/schemas.ts` (read-path validation on both native and web backends).
- Invalid rows throw a descriptive error; config rows fall back to `DEFAULT_CONFIG` instead.

## Persistence rules
- No schema/migration change without updating: Drizzle schema, Zod schema, migration step, `PRAGMA user_version`, and the `schema-vs-migration` drift test.
- All user-facing validation messages go through `t()` (en/es).