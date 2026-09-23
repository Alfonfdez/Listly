import { describe, expect, it } from 'vitest';
import { itemSchema, listSchema, configSchema } from '../../src/database/schemas';
import { DEFAULT_CONFIG, sanitizeConfig } from '../../src/database/configDefaults';
import { LANGUAGES } from '../../src/constants/languages';
import { LIST_LAYOUTS, TEXT_SIZES, THEMES } from '../../src/constants/types';

const VALID_LIST = { id: 1, name: 'Work Tasks', color: '#22D3EE', icon: 'briefcase-outline', created_at: '2026-09-05 08:00:00', position: 0, collection_id: null };

describe('schemas', () => {
  describe('listSchema', () => {
    it('accepts a fully valid row', () => {
      expect(listSchema.parse(VALID_LIST)).toEqual(VALID_LIST);
    });

    it('rejects a non-integer id', () => {
      expect(() => listSchema.parse({ ...VALID_LIST, id: 1.5 })).toThrow();
      expect(() => listSchema.parse({ ...VALID_LIST, id: '1' })).toThrow();
    });

    it('rejects a missing required field', () => {
      expect(() => listSchema.parse({ ...VALID_LIST, name: undefined })).toThrow();
      expect(() => listSchema.parse({ ...VALID_LIST, color: undefined })).toThrow();
    });
  });

  describe('itemSchema', () => {
    const VALID_ITEM = { id: 10, list_id: 1, name: 'Milk', checked: 0, note: null, position: 0, created_at: '2026-09-05 08:00:00', pictures: null };

    it('accepts a fully valid row', () => {
      expect(itemSchema.parse(VALID_ITEM)).toEqual(VALID_ITEM);
      expect(itemSchema.parse({ ...VALID_ITEM, checked: 1 })).toEqual({ ...VALID_ITEM, checked: 1 });
    });

    it('rejects checked values outside 0/1', () => {
      expect(() => itemSchema.parse({ ...VALID_ITEM, checked: 2 })).toThrow();
      expect(() => itemSchema.parse({ ...VALID_ITEM, checked: -1 })).toThrow();
    });

    it('rejects non-integer list_id or missing required fields', () => {
      expect(() => itemSchema.parse({ ...VALID_ITEM, list_id: 1.5 })).toThrow();
      expect(() => itemSchema.parse({ ...VALID_ITEM, name: undefined })).toThrow();
    });
  });

  describe('configSchema', () => {
    it('accepts the full default config', () => {
      expect(configSchema.parse(DEFAULT_CONFIG)).toEqual(DEFAULT_CONFIG);
    });

    it('accepts all valid enum values', () => {
      expect(
        configSchema.parse({
          theme: THEMES.dark,
          language: LANGUAGES.es,
          textSize: TEXT_SIZES.large,
          homeCollectionsLayout: LIST_LAYOUTS.list,
          homeListsLayout: LIST_LAYOUTS.grid,
          collectionsLayout: LIST_LAYOUTS.list,
          collectionDetailLayout: LIST_LAYOUTS.list,
          listsLayout: LIST_LAYOUTS.grid,
          showNotes: false,
          showPhotos: false,
          editShowNotes: false,
          editShowPhotos: false,
        })
      ).toEqual({
        theme: THEMES.dark,
        language: LANGUAGES.es,
        textSize: TEXT_SIZES.large,
        homeCollectionsLayout: LIST_LAYOUTS.list,
        homeListsLayout: LIST_LAYOUTS.grid,
        collectionsLayout: LIST_LAYOUTS.list,
        collectionDetailLayout: LIST_LAYOUTS.list,
        listsLayout: LIST_LAYOUTS.grid,
        showNotes: false,
        showPhotos: false,
        editShowNotes: false,
        editShowPhotos: false,
      });
    });

    it('rejects a non-boolean visibility flag', () => {
      expect(() => configSchema.parse({ ...DEFAULT_CONFIG, showNotes: 'yes' })).toThrow();
      expect(() => configSchema.parse({ ...DEFAULT_CONFIG, showPhotos: 1 })).toThrow();
      expect(() => configSchema.parse({ ...DEFAULT_CONFIG, editShowNotes: 'no' })).toThrow();
      expect(() => configSchema.parse({ ...DEFAULT_CONFIG, editShowPhotos: 0 })).toThrow();
    });

    it('rejects an invalid list layout', () => {
      expect(() => configSchema.parse({ ...DEFAULT_CONFIG, homeCollectionsLayout: 'columns' })).toThrow();
      expect(() => configSchema.parse({ ...DEFAULT_CONFIG, homeListsLayout: 'columns' })).toThrow();
      expect(() => configSchema.parse({ ...DEFAULT_CONFIG, collectionsLayout: 'columns' })).toThrow();
      expect(() => configSchema.parse({ ...DEFAULT_CONFIG, collectionDetailLayout: 'columns' })).toThrow();
      expect(() => configSchema.parse({ ...DEFAULT_CONFIG, listsLayout: 'columns' })).toThrow();
    });

    it('rejects an invalid theme', () => {
      expect(() => configSchema.parse({ theme: 'neon', language: LANGUAGES.en, textSize: TEXT_SIZES.medium })).toThrow();
    });

    it('rejects an invalid textSize', () => {
      expect(() => configSchema.parse({ theme: THEMES.system, language: LANGUAGES.en, textSize: 'huge' })).toThrow();
    });

    it('rejects an invalid language', () => {
      expect(() => configSchema.parse({ theme: THEMES.system, language: 'fr', textSize: TEXT_SIZES.medium })).toThrow();
    });
  });

  describe('sanitizeConfig', () => {
    it('passes through a valid config unchanged', () => {
      expect(sanitizeConfig(DEFAULT_CONFIG)).toEqual(DEFAULT_CONFIG);
    });

    it('falls back to defaults for invalid theme', () => {
      expect(sanitizeConfig({ theme: 'neon' } as never)).toEqual(DEFAULT_CONFIG);
    });

    it('falls back to defaults for invalid textSize', () => {
      expect(sanitizeConfig({ textSize: 'huge' } as never)).toEqual(DEFAULT_CONFIG);
    });

    it('falls back to defaults for invalid language', () => {
      expect(sanitizeConfig({ language: 'fr' } as never)).toEqual(DEFAULT_CONFIG);
    });
  });
});