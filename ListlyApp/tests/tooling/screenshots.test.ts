import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { parseBackup } from '../../src/database/backup';
import { DB_KEY_MAP } from '../../src/database/configDefaults';
import { SCREENS, SET } from '../../scripts/screenshots/manifest.mjs';

const APP_ROOT = process.env.LISTLY_APP_ROOT ?? process.cwd();
const REPO_ROOT = path.resolve(APP_ROOT, '..');
const FIXTURE_PATH = path.join(APP_ROOT, 'scripts', 'screenshots', 'fixture.json');
const README_RE = /^README(\.[a-z]{2})?\.md$/;
const IMAGE_RE = /!\[[^\]]*\]\((images\/screenshots\/[^)]+)\)/g;

const readmes = readdirSync(REPO_ROOT).filter(name => README_RE.test(name)).sort();

function screenshotRefs(name: string): string[] {
  const content = readFileSync(path.join(REPO_ROOT, name), 'utf8');
  return [...content.matchAll(IMAGE_RE)].map(match => match[1]);
}

describe('screenshot workflow', () => {
  it('defines a valid, self-consistent backup fixture', () => {
    const backup = parseBackup(readFileSync(FIXTURE_PATH, 'utf8'));
    const { collections, lists, items, vaults, config } = backup.data;

    expect(backup.schema).toBe(9);
    expect(backup.app).toBe('Listly');
    expect(backup.kind).toBe('backup');

    expect(collections).toHaveLength(2);
    expect(lists).toHaveLength(5);
    expect(items).toHaveLength(19);
    expect(vaults).toHaveLength(0);

    const collectionIds = new Set(collections.map(collection => collection.id));
    const listIds = new Set(lists.map(list => list.id));

    for (const list of lists) {
      if (list.collection_id !== null) {
        expect(collectionIds.has(list.collection_id)).toBe(true);
      }
    }
    for (const item of items) {
      expect(listIds.has(item.list_id)).toBe(true);
      expect(item.created_at.startsWith('2026-11')).toBe(true);
    }
    for (const vault of vaults) {
      expect(listIds.has(vault.list_id)).toBe(true);
    }
    for (const row of config) {
      expect(Object.keys(DB_KEY_MAP)).toContain(row.key);
    }

    // The fixture must keep showing the features the screenshots advertise.
    expect(lists.some(list => list.pinned === 1)).toBe(true);
    expect(lists.some(list => list.kind === 'numeric')).toBe(true);
    expect(lists.some(list => list.collection_id === null)).toBe(true);
    expect(items.some(item => item.pictures?.includes('data:image/'))).toBe(true);
    expect(items.some(item => item.note !== null && item.note.length > 60)).toBe(true);
    expect(items.some(item => item.amount_minor !== null && item.amount_minor > 0)).toBe(true);
    expect(items.some(item => item.name.length > 30)).toBe(true);
  });

  it('keeps the 9 READMEs on the exact ordered screenshot set', () => {
    expect(readmes).toHaveLength(9);
    expect(SCREENS).toHaveLength(21);
    expect(new Set(SCREENS.map(screen => screen.key)).size).toBe(SCREENS.length);
    for (const screen of SCREENS) {
      expect(screen.phase === 'empty' || screen.phase === 'fixture').toBe(true);
      expect(typeof screen.run).toBe('function');
    }

    const expected = SCREENS.map(screen => `images/screenshots/${SET}-${screen.key}.png`);
    const sets = readmes.map(name => ({ name, refs: screenshotRefs(name) }));

    expect(expected.every(ref => ref.includes(`/${SET}-`))).toBe(true);
    expect(sets[0].refs).toEqual(expected);
    for (const entry of sets) {
      expect(entry.refs).toEqual(expected);
      for (const ref of entry.refs) {
        expect(existsSync(path.join(REPO_ROOT, ref)), `${entry.name}: ${ref}`).toBe(true);
      }
    }
  });
});
