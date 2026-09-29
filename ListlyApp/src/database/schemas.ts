import { z } from 'zod';

import { LANGUAGES } from '../constants/languages';
import { LIST_KINDS, LIST_LAYOUTS, TEXT_SIZES, THEMES } from '../constants/types';

const themeSchema = z.enum([THEMES.dark, THEMES.light, THEMES.system]);
const textSizeSchema = z.enum([TEXT_SIZES.small, TEXT_SIZES.medium, TEXT_SIZES.large]);
const languageSchema = z.enum([LANGUAGES.en, LANGUAGES.es]);
const layoutSchema = z.enum([LIST_LAYOUTS.grid, LIST_LAYOUTS.list]);
const listKindSchema = z.enum([LIST_KINDS.standard, LIST_KINDS.numeric]);

export const listSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
  created_at: z.string(),
  position: z.number().int(),
  pinned: z.union([z.literal(0), z.literal(1)]),
  kind: listKindSchema,
  collection_id: z.number().int().nullable(),
});

export const collectionSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
  created_at: z.string(),
  position: z.number().int(),
  pinned: z.union([z.literal(0), z.literal(1)]),
});

export const itemSchema = z.object({
  id: z.number().int(),
  list_id: z.number().int(),
  name: z.string(),
  checked: z.union([z.literal(0), z.literal(1)]),
  note: z.string().nullable(),
  position: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
  pictures: z.string().nullable(),
  amount_minor: z.number().int().nullable(),
  quantity: z.number().int(),
});

export const vaultSchema = z.object({
  list_id: z.number().int(),
  salt: z.string(),
  kdf_iterations: z.number().int(),
  kdf_digest: z.string(),
  kdf_version: z.number().int(),
  verifier: z.string(),
  payload: z.string(),
  updated_at: z.string(),
});

export const configSchema = z.object({
  theme: themeSchema,
  language: languageSchema,
  textSize: textSizeSchema,
  homeCollectionsLayout: layoutSchema,
  homeListsLayout: layoutSchema,
  collectionsLayout: layoutSchema,
  collectionDetailLayout: layoutSchema,
  listsLayout: layoutSchema,
  showNotes: z.boolean(),
  showPhotos: z.boolean(),
  editShowNotes: z.boolean(),
  editShowPhotos: z.boolean(),
});