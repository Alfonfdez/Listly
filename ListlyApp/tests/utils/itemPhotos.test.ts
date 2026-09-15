import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  deleteItemPhotos,
  itemPhotoFileName,
  parseItemPhotos,
  serializeItemPhotos,
} from '../../src/utils/itemPhotos';

const { MockFile, files } = vi.hoisted(() => {
  const files = new Map<string, boolean>();
  class MockFile {
    uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
    get exists(): boolean {
      return files.get(this.uri) ?? false;
    }
    delete(): void {
      files.delete(this.uri);
    }
  }
  return { MockFile, files };
});

vi.mock('expo-file-system', () => ({ File: MockFile }));

describe('itemPhotos', () => {
  beforeEach(() => {
    files.clear();
  });

  describe('parseItemPhotos', () => {
    it('returns an empty array for null and undefined', () => {
      expect(parseItemPhotos(null)).toEqual([]);
      expect(parseItemPhotos(undefined)).toEqual([]);
    });

    it('parses a JSON array of uris', () => {
      expect(parseItemPhotos('["file://a","file://b"]')).toEqual(['file://a', 'file://b']);
    });

    it('treats a non-array value as a single legacy photo', () => {
      expect(parseItemPhotos('file://legacy')).toEqual(['file://legacy']);
    });

    it('treats invalid JSON as a single legacy photo', () => {
      expect(parseItemPhotos('not-json')).toEqual(['not-json']);
    });
  });

  describe('serializeItemPhotos', () => {
    it('returns null for an empty array', () => {
      expect(serializeItemPhotos([])).toBeNull();
    });

    it('serializes a photo array to a JSON string', () => {
      expect(serializeItemPhotos(['file://a', 'file://b'])).toBe('["file://a","file://b"]');
    });
  });

  describe('deleteItemPhotos', () => {
    it('deletes existing photo files', async () => {
      files.set('file://photo1', true);
      files.set('file://photo2', true);
      await deleteItemPhotos(['file://photo1', 'file://photo2']);
      expect(files.size).toBe(0);
    });

    it('leaves data uris untouched', async () => {
      files.set('file://photo1', true);
      await deleteItemPhotos(['data:image/png;base64,AAA']);
      expect(files.has('file://photo1')).toBe(true);
    });

    it('is a no-op for an empty list', async () => {
      await expect(deleteItemPhotos([])).resolves.toBeUndefined();
    });
  });

  describe('itemPhotoFileName', () => {
    it('produces a unique, non-empty name each time', () => {
      const a = itemPhotoFileName();
      const b = itemPhotoFileName();
      expect(a.length).toBeGreaterThan(0);
      expect(b.length).toBeGreaterThan(0);
      expect(a).not.toBe(b);
    });
  });
});