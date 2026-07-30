import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  spaceId: text("space_id").notNull().default("shared"),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("Другое"),
  status: text("status").notNull().default("active"),
  amount: integer("amount"),
  currency: text("currency").notNull().default("RUB"),
  paidBy: text("paid_by"),
  assignedTo: text("assigned_to"),
  dueDate: text("due_date"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  link: text("link"),
  metadata: text("metadata").notNull().default("{}"),
  createdBy: text("created_by").notNull().default("me"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
