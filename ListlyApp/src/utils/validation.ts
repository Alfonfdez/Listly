import {
  MAX_COLLECTION_NAME_LENGTH,
  MAX_ITEM_NAME_LENGTH,
  MAX_LIST_NAME_LENGTH,
} from '../constants/types';

export type ItemNameError = 'item_name_required' | 'item_name_duplicate' | 'item_name_max';

export function validateItemName(
  value: string,
  existingNames: ReadonlySet<string>,
  maxLength = MAX_ITEM_NAME_LENGTH
): ItemNameError | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'item_name_required';
  if (trimmed.length > maxLength) return 'item_name_max';
  if (existingNames.has(trimmed.toLowerCase())) return 'item_name_duplicate';
  return null;
}

export type ListNameError = 'list_name_required' | 'list_name_max' | 'list_name_duplicate';
export type CollectionNameError =
  | 'collection_name_required'
  | 'collection_name_max'
  | 'collection_name_duplicate';

type NameErrorCode = 'name_required' | 'name_max' | 'name_duplicate';

function validateName(value: string, exists: boolean, maxLength: number): NameErrorCode | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'name_required';
  if (trimmed.length > maxLength) return 'name_max';
  if (exists) return 'name_duplicate';
  return null;
}

export function validateListName(
  value: string,
  exists: boolean,
  maxLength = MAX_LIST_NAME_LENGTH
): ListNameError | null {
  const code = validateName(value, exists, maxLength);
  return code ? (`list_${code}` as ListNameError) : null;
}

export function validateCollectionName(
  value: string,
  exists: boolean,
  maxLength = MAX_COLLECTION_NAME_LENGTH
): CollectionNameError | null {
  const code = validateName(value, exists, maxLength);
  return code ? (`collection_${code}` as CollectionNameError) : null;
}

export function uniqueNormalizedNames(names: Iterable<string>): Set<string> {
  const normalized = new Set<string>();
  for (const name of names) {
    const trimmed = name.trim().toLowerCase();
    if (trimmed) normalized.add(trimmed);
  }
  return normalized;
}