import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const rooms = pgTable('hostel_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull(),
  building: text('building').notNull(),
  room_number: text('room_number').notNull(),
  capacity: integer('capacity').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});
