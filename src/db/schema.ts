import {text, integer, sqliteTable} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';

// Shoes table that has id, name, link, price, originalPrice, date, image
export const shoes = sqliteTable('shoes', {
  id: text('id').notNull().primaryKey(),
  name: text('name').notNull(),
  link: text('link').notNull(),
  price: integer('price').notNull(),
  originalPrice: integer('originalPrice').notNull(),
  updatedAt: text('date').default(sql`CURRENT_TIMESTAMP`),
  image: text('image').notNull(),
  addToFeed: integer('addToFeed', {mode: 'boolean'}).default(true),
});
