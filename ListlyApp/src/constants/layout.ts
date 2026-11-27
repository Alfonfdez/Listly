// UI layout tokens: line counts, field heights and photo-section metrics.
// Behavioural constants (MAX_*, LIST_KINDS, timings) stay in `types.ts`.

// Edit-item modal text areas: the name wraps and the note shows several lines,
// both with internal vertical scrolling. Heights derive from the scaled line
// height plus vertical padding (and border).
export const EDIT_ITEM_NAME_LINES = 3;
export const EDIT_ITEM_NOTE_LINES = 7;
export const EDIT_ITEM_FIELD_LINE_HEIGHT = 20;
export const EDIT_ITEM_FIELD_VERTICAL_PADDING = 24;

// Compact add bar (list detail): the note reserves 3 lines by default.
export const ADD_ITEM_NOTE_LINES = 3;

// Photo section tiles: the edit modal uses the regular size, the inline add
// bar uses the compact one so the details area stays light.
export const PHOTO_METRICS = {
  regular: {
    size: 64,
    addIcon: 'images-outline',
    addIconSize: 22,
    removeBadgeSize: 20,
    removeIconSize: 12,
    badgeOffset: -5,
    titleFontSize: 15,
    titleMarginBottom: 10,
    rowGap: 10,
    bottomMargin: 0,
  },
  compact: {
    size: 56,
    addIcon: 'images-outline',
    addIconSize: 20,
    removeBadgeSize: 18,
    removeIconSize: 12,
    badgeOffset: -5,
    // Compact hides the "Photos" title; the values stay for a shared shape.
    titleFontSize: 13,
    titleMarginBottom: 6,
    rowGap: 8,
    bottomMargin: 8,
  },
} as const;
