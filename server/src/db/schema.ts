
import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, varchar } from "drizzle-orm/pg-core";

export const pollStatus = pgEnum("status", ["draft", "open", "closed"])

export const pollsTable = pgTable("polls", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  question: varchar({ length: 255 }).notNull(),
  status: pollStatus().notNull().default("draft")
});

export const pollsRelations = relations(pollsTable, ({ many }) => ({
  choices: many(choicesTable),
}))

export const choicesTable = pgTable("choices", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  pollId: integer("poll_id").references(() => pollsTable.id), //reference poll
  label: text().notNull(),
},);

export const votesTable = pgTable("votes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  pollId: integer("poll_id").references(() => pollsTable.id), //reference poll
  choicesId: integer("choice_id").references(() => choicesTable.id), //reference choice
});

export const choicesRelations = relations(choicesTable, ({ one }) => ({
  poll: one(pollsTable, {
    fields: [choicesTable.pollId],   // FK column on this table
    references: [pollsTable.id],      // PK it points to
  }),
}))
