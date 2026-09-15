import { darkColors, lightColors } from '../constants/themes';
import type { Item, List } from './types';

export const SEED_LISTS: Omit<List, 'created_at'>[] = [
  { id: 1, name: 'Groceries', color: darkColors.primary, icon: 'cart-outline', position: 0 },
  { id: 2, name: 'Work Tasks', color: darkColors.accent, icon: 'briefcase-outline', position: 1 },
  { id: 3, name: 'Reading List', color: darkColors.green, icon: 'book-outline', position: 2 },
  { id: 4, name: 'Travel Plan', color: darkColors.red, icon: 'airplane-outline', position: 3 },
  { id: 5, name: 'Home Chores', color: lightColors.primary, icon: 'home-outline', position: 4 },
  { id: 6, name: 'Fitness', color: lightColors.accent, icon: 'barbell-outline', position: 5 },
];

type SeedItem = Omit<Item, 'created_at' | 'pictures'>;

export const SEED_ITEMS: SeedItem[] = [
  { id: 1, list_id: 1, name: 'Milk', checked: 1, note: null, position: 0 },
  { id: 2, list_id: 1, name: 'Eggs', checked: 1, note: null, position: 1 },
  { id: 3, list_id: 1, name: 'Bread', checked: 0, note: null, position: 2 },
  { id: 4, list_id: 1, name: 'Coffee beans', checked: 0, note: 'medium roast', position: 3 },
  { id: 5, list_id: 1, name: 'Bananas', checked: 0, note: null, position: 4 },
  { id: 6, list_id: 2, name: 'Write PR description', checked: 1, note: null, position: 0 },
  { id: 7, list_id: 2, name: 'Review open PRs', checked: 0, note: null, position: 1 },
  { id: 8, list_id: 2, name: 'Plan sprint notes', checked: 0, note: null, position: 2 },
  { id: 9, list_id: 3, name: 'The Pragmatic Programmer', checked: 1, note: 'reread chapter 4', position: 0 },
  { id: 10, list_id: 3, name: 'Clean Code', checked: 0, note: null, position: 1 },
  { id: 11, list_id: 4, name: 'Book flights', checked: 1, note: null, position: 0 },
  { id: 12, list_id: 4, name: 'Reserve hotel', checked: 0, note: '2 nights downtown', position: 1 },
  { id: 13, list_id: 4, name: 'Check passport', checked: 0, note: null, position: 2 },
  { id: 14, list_id: 5, name: 'Vacuum living room', checked: 1, note: null, position: 0 },
  { id: 15, list_id: 5, name: 'Water plants', checked: 0, note: null, position: 1 },
  { id: 16, list_id: 5, name: 'Clean windows', checked: 0, note: null, position: 2 },
  { id: 17, list_id: 6, name: 'Morning run', checked: 1, note: null, position: 0 },
  { id: 18, list_id: 6, name: 'Stretch routine', checked: 0, note: '10 min after run', position: 1 },
  { id: 19, list_id: 6, name: 'Gym session', checked: 0, note: null, position: 2 },
];