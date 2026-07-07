import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull(),
  registration_number: text('registration_number').notNull(),
  capacity: integer('capacity').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const routes = pgTable('transport_routes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});
