import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isGuest: boolean("is_guest").default(false),
  language: varchar("language").default("en"), // en, zh, ar, id
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Baby profiles table
export const babyProfiles = pgTable("baby_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: varchar("gender").notNull(), // 'male' or 'female'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audio recordings table
export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  babyProfileId: integer("baby_profile_id").references(() => babyProfiles.id),
  filename: varchar("filename").notNull(),
  duration: integer("duration"), // in seconds
  analysisResult: jsonb("analysis_result"), // AI analysis results
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertBabyProfileSchema = createInsertSchema(babyProfiles).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBabyProfile = z.infer<typeof insertBabyProfileSchema>;
export type BabyProfile = typeof babyProfiles.$inferSelect;

export const insertRecordingSchema = createInsertSchema(recordings).omit({
  id: true,
  userId: true,
  recordedAt: true,
});
export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type Recording = typeof recordings.$inferSelect;
