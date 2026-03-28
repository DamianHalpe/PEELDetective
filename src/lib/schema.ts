import { pgTable, text, timestamp, boolean, index, integer, jsonb } from "drizzle-orm/pg-core";

// IMPORTANT! ID fields should ALWAYS use UUID types, EXCEPT the BetterAuth tables.

export const school = pgTable("school", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  leaderboardEnabled: boolean("leaderboard_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    role: text("role").notNull().default("student"), // "student" | "teacher" | "admin"
    schoolId: text("school_id").references(() => school.id),
    points: integer("points").notNull().default(0),
    nickname: text("nickname").unique(),
    banned: boolean("banned").notNull().default(false),
    subscribed: boolean("subscribed").notNull().default(false),
    subscribedAt: timestamp("subscribed_at"),
    subscriptionPeriodEnd: timestamp("subscription_period_end"),
    themePreference: text("theme_preference").default("system"),
    customTheme: text("custom_theme"),
    leaderboardEnabled: boolean("leaderboard_enabled").notNull().default(true),
  },
  (table) => [index("user_email_idx").on(table.email)]
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("session_user_id_idx").on(table.userId),
    index("session_token_idx").on(table.token),
  ]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    index("account_provider_account_idx").on(table.providerId, table.accountId),
  ]
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const scenario = pgTable("scenario", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  crimeDescription: text("crime_description").notNull(),
  suspects: jsonb("suspects").notNull(), // { name, background }[]
  clues: jsonb("clues").notNull(), // string[]
  correctCulprit: text("correct_culprit").notNull(),
  difficulty: integer("difficulty").notNull().default(1), // 1-3
  createdBy: text("created_by").notNull().references(() => user.id),
  published: boolean("published").notNull().default(false),
  freeToView: boolean("free_to_view").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const submission = pgTable(
  "submission",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    scenarioId: text("scenario_id").notNull().references(() => scenario.id, { onDelete: "cascade" }),
    responseText: text("response_text").notNull(),
    scorePoint: integer("score_point"),
    scoreEvidence: integer("score_evidence"),
    scoreExplain: integer("score_explain"),
    scoreLink: integer("score_link"),
    totalScore: integer("total_score"),
    feedbackJson: jsonb("feedback_json"), // { point, evidence, explain, link }
    grammarFlagsJson: jsonb("grammar_flags_json"), // string[]
    modelAnswer: text("model_answer"),
    teacherOverrideScore: integer("teacher_override_score"),
    teacherOverrideNote: text("teacher_override_note"),
    status: text("status").notNull().default("pending"), // "pending" | "evaluated" | "failed"
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    aiEvaluatedAt: timestamp("ai_evaluated_at"),
  },
  (table) => [
    index("submission_student_id_idx").on(table.studentId),
    index("submission_scenario_id_idx").on(table.scenarioId),
    index("submission_status_idx").on(table.status),
    index("submission_student_scenario_idx").on(table.studentId, table.scenarioId),
  ]
);

export const badge = pgTable("badge", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(), // Lucide icon name string
  triggerCondition: text("trigger_condition").notNull(),
});

export const subscriptionHistory = pgTable("subscription_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // "activated" | "revoked"
  changedById: text("changed_by_id").references(() => user.id, { onDelete: "set null" }),
  changedByRole: text("changed_by_role").notNull(), // "student" | "teacher" | "admin"
  amount: integer("amount"), // amount charged in cents (e.g. 1000 = $10.00); null or 0 = manual/free
  periodEnd: timestamp("period_end"), // subscription period end for this billing cycle
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const studentBadge = pgTable("student_badge", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  badgeId: text("badge_id").notNull().references(() => badge.id),
  awardedAt: timestamp("awarded_at").notNull().defaultNow(),
});
