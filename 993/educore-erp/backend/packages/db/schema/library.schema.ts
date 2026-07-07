import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const books = pgTable('books', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull(),
  title: text('title').notNull(),
  isbn: text('isbn').notNull(),
  author: text('author'),
  created_at: timestamp('created_at').defaultNow(),
});
