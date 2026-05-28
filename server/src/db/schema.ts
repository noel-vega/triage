
import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";

export const pollsTable = pgTable("polls", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  question: varchar({ length: 255 }).notNull(),
});

export const choicesTable = pgTable("choices", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  pollId: integer("poll_id"), //reference poll
  label: text().notNull(),
},);

export const votesTable = pgTable("votes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  pollId: integer("poll_id"), //reference poll
  choicesId: integer("choice_id"), //reference choice
});
