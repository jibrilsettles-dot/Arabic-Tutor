import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

/**
 * The learner's long-term memory. This is the "state tracker": a hidden
 * summary the tutor rewrites as the learner progresses, injected into every
 * request so the tutor always knows where the learner is.
 */
export const profiles = sqliteTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  onboarded: integer("onboarded", { mode: "boolean" }).notNull().default(false),
  /** How the tutor addresses the learner in Arabic (masculine/feminine forms). */
  addressAs: text("address_as", { enum: ["m", "f"] }).notNull().default("m"),
  madinahStart: text("madinah_start").notNull().default("none"),
  abyStart: text("aby_start").notNull().default("none"),
  goals: text("goals").notNull().default(""),
  summary: text("summary").notNull().default(""),
  strengths: text("strengths", { mode: "json" }).$type<string[]>().notNull().default([]),
  struggles: text("struggles", { mode: "json" }).$type<string[]>().notNull().default([]),
  currentTopicId: text("current_topic_id"),
  timezone: text("timezone").notNull().default("UTC"),
  notifyEnabled: integer("notify_enabled", { mode: "boolean" }).notNull().default(false),
  notifyHour: integer("notify_hour").notNull().default(18),
  lastProactiveAt: integer("last_proactive_at", { mode: "timestamp_ms" }),
  proactiveCount: integer("proactive_count").notNull().default(0),
  lastMemoryMessageId: integer("last_memory_message_id").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  kind: text("kind", { enum: ["chat", "proactive"] }).notNull().default("chat"),
  content: text("content").notNull(),
  createdAt: createdAt(),
});

export const skills = sqliteTable(
  "skills",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topicId: text("topic_id").notNull(),
    status: text("status", { enum: ["learning", "shaky", "solid"] }).notNull(),
    note: text("note").notNull().default(""),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.topicId] })],
);

export const vocab = sqliteTable(
  "vocab",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    word: text("word").notNull(),
    root: text("root").notNull().default(""),
    meaning: text("meaning").notNull().default(""),
    misses: integer("misses").notNull().default(0),
    hits: integer("hits").notNull().default(0),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [uniqueIndex("vocab_user_word").on(t.userId, t.word)],
);

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  endpoint: text("endpoint").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: createdAt(),
});

export type Profile = typeof profiles.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Vocab = typeof vocab.$inferSelect;
