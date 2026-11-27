# 035 - Form name feedback (create/edit list and collection)

- **Objective**
  Make the name field of the Create/Edit **list** and **collection** forms behave like Finly's forms: never greet an untouched form with an error, flag an invalid name only after the user has interacted with it, show that error inline under the name field, and show a live character counter in the "Name" label row that turns red and bold at the limit.

> Superseded in part by **036**: the message moved from a band above Save to inline under the field so the keyboard cannot hide it. The touched-gating, red border and counter rules here are unchanged.

---

## Functional requirements

### 1. Untouched forms are clean
- On opening Create list, Edit list, Create collection or Edit collection, the name field shows **no error message** and **no red border**, even when the initial name is empty.
- Create/Save stays disabled while the name is empty (unchanged).

### 2. Error after interaction
- The name field becomes **touched** when the value changes or the input is blurred.
- Once touched and invalid (empty or whitespace-only, duplicate, too long), the field shows:
  - a **red border** on the input;
  - a **red message under the name field** with the existing text (`list_name_required` / `collection_name_required`, duplicate and max messages).
- Tapping the input and tapping elsewhere without typing is enough to reveal the "name is required" hint.
- The message is announced to assistive technology (`role="alert"`, polite live region); it now renders inline, so the form shifts by one line when it appears (the former reserved band was removed).

### 3. Character counter
- The name field shows `current/max` in the **right side of the "Name" label row** (`MAX_LIST_NAME_LENGTH` = 100, `MAX_COLLECTION_NAME_LENGTH` = 100).
- The counter updates as the user types and includes leading/trailing spaces in the count (the value is trimmed only on submit).
- At the limit the counter turns **red and bold**; below the limit it is muted and medium weight.

### 4. Consistency
- Item name (200) and item note (2000) counters keep their existing behaviour and gain the bold-at-limit style.
- No other input uses a maximum length; no new i18n keys are required.

---

## Non-functional requirements

- **Components**: `CharCounter` owns the counter styling; `FormField` owns the inline error (with alert role) and the optional right slot; `EntityForm` owns the touched state and the red border.
- **Tests**: `CharCounter` (muted/500 below the limit, red/700 at and over it); `CreateListScreen` (clean on mount, counter updates, blur reveals hint + red border, bold counter at max); `EditListScreen` (initial counter, clearing shows hint + red border + disabled Save); `EditCollectionScreen` (initial counter).
- **Verification**: `npm run test:all`; screenshots at 375px show the counter in Create list and Edit list and no error in the untouched Create form.

---

## Acceptance criteria

- [x] An untouched Create/Edit list or collection form shows no error and no red border.
- [x] The name error appears only after the field is changed or blurred, with a red border and an inline message under the field.
- [x] The message is announced as an alert; there is no reserved band (the inline placement keeps the buttons reachable while the keyboard is open).
- [x] The name field shows a live `current/max` counter in the label row.
- [x] The counter turns red and bold at the maximum length.
- [x] Item name/note counters also render bold at the limit.
- [x] No new i18n keys are needed.
- [x] `npm run test:all` passes.
