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
import { sql } from "drizzle-orm";
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
  id: text("id").primaryKey(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  password: text("password"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  userRole: text("user_role"),
  profileImageUrl: text("profile_image_url"),
  isGuest: boolean("is_guest").default(false),
  language: text("language").default("en"),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  deactivated: boolean("deactivated").default(false),
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
  photoUrl: varchar("photo_url"), // URL to baby's photo
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
  vote: varchar("vote"), // 'good' or 'bad' for user feedback
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

// Cry reason descriptions table
export const cryReasonDescriptions = pgTable("cry_reason_descriptions", {
  id: serial("id").primaryKey(),
  className: varchar("class_name").unique().notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  recommendations: jsonb("recommendations").notNull(), // Array of recommendation strings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type CryReasonDescription = typeof cryReasonDescriptions.$inferSelect;

// Legal documents table
export const legalDocuments = pgTable("legal_documents", {
  id: text("id").primaryKey().default(sql`uuid_generate_v4()`),
  type: text("type").notNull(), // 'terms', 'privacy', etc.
  locale: text("locale").notNull().default("en"), // 'en', 'id', 'zh', etc.
  title: text("title").notNull(),
  content: text("content").notNull(), // HTML or markdown content
  isActive: boolean("is_active").default(false).notNull(),
  version: text("version"), // optional version tag like 'v1.0'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_legal_documents_type_locale").on(table.type, table.locale),
  index("idx_legal_documents_active").on(table.isActive),
]);

export const insertLegalDocumentSchema = createInsertSchema(legalDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLegalDocument = z.infer<typeof insertLegalDocumentSchema>;
export type LegalDocument = typeof legalDocuments.$inferSelect;