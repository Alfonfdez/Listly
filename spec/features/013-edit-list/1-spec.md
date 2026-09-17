# 013 — Edit list

- **Objective**
  Let users edit an existing list's name, icon, and color from the List detail screen, persisting changes via the existing `listRepo.update`.

---

## Functional requirements

### 1. Data layer
- Reuses the existing `listRepo.update(id, { name, icon, color })` — no schema change.
- Name-uniqueness validation reuses `listRepo.existsByName(name, excludeId?)` so a list keeps its own name without a false "duplicate" error.

### 2. Shared list form (create + edit reuse one component)
- A `ListForm` component (extracted from `CreateListScreen`) provides: name input, icon grid, color grid (+ custom color picker), debounced duplicate-name validation, and a submit button.
- `CreateListScreen` keeps its exact current behavior by wrapping the form.
- `EditListScreen` renders the same form pre-filled with the list's `name`, `icon`, and `color`, passing the list id as `excludeId`.
- No in-screen heading (the nav header shows "Edit list"); field labels use the shared section-title typography (`textStyles.sectionTitle`).

### 3. EditListScreen
- New route `EditList: { listId: number }`.
- Pre-fills name/icon/color from the targeted list.
- A missing/invalid list id renders the existing not-found empty state.
- Save calls `listRepo.update(listId, { name, icon, color })`, refreshes app state, and goes back.
- The submit button label is "Save"; screen/nav titles use "Edit list".

### 4. Entry point: List detail header
- A pencil button sits at the right edge of the list header block on `ListDetailScreen` (next to the list icon/name/progress).
- Tapping it navigates to `EditList` for the current list. It is always available (list exists) and does not conflict with item select/search modes.

---

## Non-functional requirements

- **Multilingual**: new strings in `en` and `es` (`edit_list_title`, `list_edit_label`, `list_save`), existing validation/color/icon keys reused.
- **Theme/text size**: form renders with the current theme tokens and `fs()` font scaling, same as create.
- **Tests**: `EditListScreen` tests (prefill, duplicate-excludes-self, save+refresh+goBack, not-found); `ListDetailScreen` pencil navigation test; existing `CreateListScreen` tests stay green after the shared-form extraction.
- **Verification**: web loop at 375px (open edit from the pencil, change name/icon/color, save, see the header update; duplicate name error; same-name save allowed).

---

## Acceptance criteria

- [x] A pencil button on the List detail screen opens the Edit List screen for that list.
- [x] The form is pre-filled with the list's current name, icon, and color.
- [x] Changing the name/icon/color and saving persists the change and the list detail header reflects it after returning.
- [x] Saving without changing the name does not trigger a duplicate-name error.
- [x] A different existing list's name triggers the duplicate-name error and blocks saving.
- [x] Create list still works exactly as before (shared form, no behavior change).