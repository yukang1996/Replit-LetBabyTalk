import {
  users,
  babyProfiles,
  recordings,
  type User,
  type UpsertUser,
  type BabyProfile,
  type InsertBabyProfile,
  type Recording,
  type InsertRecording,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Baby profile operations
  getBabyProfiles(userId: string): Promise<BabyProfile[]>;
  createBabyProfile(userId: string, profile: InsertBabyProfile): Promise<BabyProfile>;
  updateBabyProfile(id: number, userId: string, profile: Partial<InsertBabyProfile>): Promise<BabyProfile | undefined>;
  deleteBabyProfile(id: number, userId: string): Promise<boolean>;
  
  // Recording operations
  getRecordings(userId: string): Promise<Recording[]>;
  createRecording(userId: string, recording: InsertRecording): Promise<Recording>;
  getRecording(id: number, userId: string): Promise<Recording | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Baby profile operations
  async getBabyProfiles(userId: string): Promise<BabyProfile[]> {
    return await db
      .select()
      .from(babyProfiles)
      .where(eq(babyProfiles.userId, userId))
      .orderBy(desc(babyProfiles.createdAt));
  }

  async createBabyProfile(userId: string, profile: InsertBabyProfile): Promise<BabyProfile> {
    const [babyProfile] = await db
      .insert(babyProfiles)
      .values({ ...profile, userId })
      .returning();
    return babyProfile;
  }

  async updateBabyProfile(id: number, userId: string, profile: Partial<InsertBabyProfile>): Promise<BabyProfile | undefined> {
    const [updated] = await db
      .update(babyProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(babyProfiles.id, id) && eq(babyProfiles.userId, userId))
      .returning();
    return updated;
  }

  async deleteBabyProfile(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(babyProfiles)
      .where(eq(babyProfiles.id, id) && eq(babyProfiles.userId, userId));
    return result.rowCount > 0;
  }

  // Recording operations
  async getRecordings(userId: string): Promise<Recording[]> {
    return await db
      .select()
      .from(recordings)
      .where(eq(recordings.userId, userId))
      .orderBy(desc(recordings.recordedAt));
  }

  async createRecording(userId: string, recording: InsertRecording): Promise<Recording> {
    const [newRecording] = await db
      .insert(recordings)
      .values({ ...recording, userId })
      .returning();
    return newRecording;
  }

  async getRecording(id: number, userId: string): Promise<Recording | undefined> {
    const [recording] = await db
      .select()
      .from(recordings)
      .where(eq(recordings.id, id) && eq(recordings.userId, userId));
    return recording;
  }
}

export const storage = new DatabaseStorage();
