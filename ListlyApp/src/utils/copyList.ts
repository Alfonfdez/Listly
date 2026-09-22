import type { Item } from '../database/types';

const CHECKED_MARK = '✅';
const NOTE_SEPARATOR = ' — ';

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
