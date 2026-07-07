import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull(),
  user_id: uuid('user_id').notNull(),
  department: text('department').notNull(),
  designation: text('designation').notNull(),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});
