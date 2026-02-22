import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    email_verified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("user_email_unique_idx").on(table.email)],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ip_address: text("ip_address"),
    user_agent: text("user_agent"),
    user_id: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_unique_idx").on(table.token),
    index("session_user_id_idx").on(table.user_id),
    index("session_expires_at_idx").on(table.expires_at),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    account_id: text("account_id").notNull(),
    provider_id: text("provider_id").notNull(),
    user_id: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    access_token: text("access_token"),
    refresh_token: text("refresh_token"),
    id_token: text("id_token"),
    access_token_expires_at: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refresh_token_expires_at: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("account_provider_account_unique_idx").on(
      table.provider_id,
      table.account_id,
    ),
    index("account_user_id_idx").on(table.user_id),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("verification_value_unique_idx").on(table.value),
    index("verification_identifier_idx").on(table.identifier),
  ],
);

export const conversation = pgTable(
  "conversation",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New conversation"),
    ai_mode: text("ai_mode").notNull().default("relationship_coach"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("conversation_user_id_idx").on(table.user_id),
    index("conversation_created_at_idx").on(table.created_at),
  ],
);

export const message = pgTable(
  "message",
  {
    id: text("id").primaryKey(),
    conversation_id: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: jsonb("content").notNull(),
    sequence: integer("sequence").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("message_conversation_id_idx").on(table.conversation_id),
    index("message_conversation_sequence_idx").on(
      table.conversation_id,
      table.sequence,
    ),
  ],
);

// ─── CRM Tables ──────────────────────────────────────────────

export const people = pgTable(
  "people",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    display_name: text("display_name").notNull(),
    relationship_type: text("relationship_type"),
    birthday: timestamp("birthday", { withTimezone: true }),
    anniversary: timestamp("anniversary", { withTimezone: true }),
    notes: text("notes"),
    image: text("image"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("people_user_id_idx").on(table.user_id)],
);

export const notes = pgTable(
  "notes",
  {
    id: text("id").primaryKey(),
    person_id: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    source: text("source"),
    occurred_at: timestamp("occurred_at", { withTimezone: true }),
    meta_json: jsonb("meta_json"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("notes_person_id_idx").on(table.person_id)],
);

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    person_id: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    event_type: text("event_type"),
    start_at: timestamp("start_at", { withTimezone: true }).notNull(),
    end_at: timestamp("end_at", { withTimezone: true }),
    is_all_day: boolean("is_all_day").default(false).notNull(),
    details: text("details"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("events_person_id_idx").on(table.person_id),
    index("events_start_at_idx").on(table.start_at),
  ],
);

export const gestureTemplates = pgTable(
  "gesture_templates",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category").notNull(),
    effort: text("effort").notNull(),
    description: text("description"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("gesture_templates_user_id_idx").on(table.user_id)],
);

export const gestures = pgTable(
  "gestures",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    person_id: text("person_id").references(() => people.id, {
      onDelete: "set null",
    }),
    template_id: text("template_id").references(() => gestureTemplates.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    category: text("category").notNull(),
    effort: text("effort").notNull(),
    status: text("status").notNull().default("pending"),
    due_at: timestamp("due_at", { withTimezone: true }),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    repeat_mode: text("repeat_mode"),
    repeat_every_days: integer("repeat_every_days"),
    notes: text("notes"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("gestures_user_id_idx").on(table.user_id),
    index("gestures_status_due_at_idx").on(table.status, table.due_at),
  ],
);

export const personPreferences = pgTable(
  "person_preferences",
  {
    id: text("id").primaryKey(),
    person_id: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    value: text("value").notNull(),
    source_note_id: text("source_note_id").references(() => notes.id, {
      onDelete: "set null",
    }),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("person_preferences_person_id_idx").on(table.person_id),
    uniqueIndex("person_preferences_person_kind_value_idx").on(
      table.person_id,
      table.kind,
      table.value,
    ),
  ],
);

export const notificationSettings = pgTable("notification_settings", {
  user_id: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  event_reminders: boolean("event_reminders").default(true).notNull(),
  ai_suggestions: boolean("ai_suggestions").default(false).notNull(),
  weekly_summary: boolean("weekly_summary").default(true).notNull(),
  email_reminders_enabled: boolean("email_reminders_enabled")
    .default(true)
    .notNull(),
  email_address: text("email_address"),
  lead_time: text("lead_time").default("1-day").notNull(),
  email_scope: text("email_scope").default("all").notNull(),
  include_event_details: boolean("include_event_details")
    .default(true)
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  user_id: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  theme: text("theme").default("system").notNull(),
  language: text("language").default("en").notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const importsInstagramDm = pgTable(
  "imports_instagram_dm",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    person_id: text("person_id").references(() => people.id, {
      onDelete: "set null",
    }),
    filename: text("filename"),
    source: text("source"),
    status: text("status").notNull().default("uploaded"),
    content: text("content").notNull(),
    parsed_data: jsonb("parsed_data"),
    notes_created: integer("notes_created").default(0).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("imports_instagram_dm_user_id_idx").on(table.user_id),
    index("imports_instagram_dm_status_idx").on(table.status),
  ],
);
