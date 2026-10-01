import type { Item } from '../database/types';
import { MAX_LIST_NAME_LENGTH } from '../constants/types';
import { isOn } from './flags';
import { formatMinor, lineTotalMinor, sumTotals } from './numeric';

const CHECKED_MARK = '✅';
const NOTE_SEPARATOR = ' — ';
const COPY_SUFFIX = ' copy';

export interface CopyLabels {
  total: string;
  done: string;
}

export interface CopyOptions {
  withNotes: boolean;
  numeric?: boolean;
  labels?: CopyLabels;
}

function sortByPosition(items: Item[]): Item[] {
  return [...items].sort((a, b) => a.position - b.position);
}

function buildNamePrefix(checked: boolean, name: string): string {
  return checked ? `${CHECKED_MARK} ${name}` : name;
}

function buildNoteSuffix(note: string | null, withNotes: boolean): string {
  if (withNotes && note && note.trim().length > 0) {
    return `${NOTE_SEPARATOR}${note}`;
  }
  return '';
}

export function buildListCopyText(listName: string, items: Item[], opts: CopyOptions): string {
  const { withNotes, numeric = false, labels } = opts;
  const lines: string[] = [listName];

  for (const item of sortByPosition(items)) {
    const checked = isOn(item.checked);
    let line: string;
    if (numeric) {
      const amount = formatMinor(item.amount_minor);
      const quantity = item.quantity;
      const total = formatMinor(lineTotalMinor(item.amount_minor, quantity));
      line = `${buildNamePrefix(checked, item.name)}${NOTE_SEPARATOR}${amount} × ${quantity} = ${total}`;
    } else {
      line = buildNamePrefix(checked, item.name);
    }
    line += buildNoteSuffix(item.note, withNotes);
    lines.push(line);
  }

  if (numeric && items.length > 0 && labels) {
    lines.push('');
    lines.push(`${labels.total}: ${formatMinor(sumTotals(items, { onlyDone: false }))}`);
    lines.push(`${labels.done}: ${formatMinor(sumTotals(items, { onlyDone: true }))}`);
  }

  return lines.join('\n');
}

export function makeListCopyName(name: string, maxLength: number = MAX_LIST_NAME_LENGTH): string {
  const trimmed = name.trim();
  const suffix = COPY_SUFFIX;
  if (trimmed.length + suffix.length <= maxLength) return `${trimmed}${suffix}`;
  return `${trimmed.slice(0, maxLength - suffix.length).trimEnd()}${suffix}`;
}
