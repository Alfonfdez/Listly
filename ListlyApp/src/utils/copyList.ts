import type { Item } from '../database/types';
import { MAX_LIST_NAME_LENGTH } from '../constants/types';

const CHECKED_MARK = '✅';
const NOTE_SEPARATOR = ' — ';
const COPY_SUFFIX = ' copy';

function sortByPosition(items: Item[]): Item[] {
  return [...items].sort((a, b) => a.position - b.position);
}

export function buildListCopyText(listName: string, items: Item[], withNotes: boolean): string {
  const lines: string[] = [listName];
  for (const item of sortByPosition(items)) {
    let line = item.checked === 1 ? `${CHECKED_MARK} ${item.name}` : item.name;
    if (withNotes && item.note && item.note.trim().length > 0) {
      line += `${NOTE_SEPARATOR}${item.note}`;
    }
    lines.push(line);
  }
  return lines.join('\n');
}

export function makeListCopyName(name: string, maxLength: number = MAX_LIST_NAME_LENGTH): string {
  const trimmed = name.trim();
  const suffix = COPY_SUFFIX;
  if (trimmed.length + suffix.length <= maxLength) return `${trimmed}${suffix}`;
  return `${trimmed.slice(0, maxLength - suffix.length).trimEnd()}${suffix}`;
}
