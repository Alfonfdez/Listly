import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const collections = sqliteTable('collections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
  created_at: text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
  position: integer('position').notNull().default(0),
});

export const lists = sqliteTable('lists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
  created_at: text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
  position: integer('position').notNull().default(0),
  collection_id: integer('collection_id').references(() => collections.id),
});

export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  list_id: integer('list_id').notNull(),
  name: text('name').notNull(),
  checked: integer('checked').notNull().default(0),
  note: text('note'),
  position: integer('position').notNull().default(0),
  created_at: text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
  pictures: text('pictures'),
});

export const config = sqliteTable('config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});