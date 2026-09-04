import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { feedbackTable } from "./feedback";
import { z } from "zod/v4";

export const actionsTable = pgTable("actions", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id")
    .notNull()
    .references(() => feedbackTable.id),
  issue: text("issue").notNull(),
  department: text("department").notNull(),
  priority: text("priority").notNull().default("Medium"),
  status: text("status").notNull().default("New"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertActionSchema = createInsertSchema(actionsTable).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAction = z.infer<typeof insertActionSchema>;
export type Action = typeof actionsTable.$inferSelect;