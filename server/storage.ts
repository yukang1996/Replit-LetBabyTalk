import {
  users,
  babyProfiles,
  recordings,
  cryReasonDescriptions,
  type User,
  type UpsertUser,
  type BabyProfile,
  type InsertBabyProfile,
  type Recording,
  type InsertRecording,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  createGuestUser(): Promise<User>;
  updateUserLanguage(id: string, language: string): Promise<User | undefined>;
  updateUserOnboarding(id: string, completed: boolean): Promise<User | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;
  linkGuestAccount(guestId: string, userData: Partial<UpsertUser>): Promise<User | undefined>;

  // Baby profile operations
  getBabyProfiles(userId: string): Promise<BabyProfile[]>;
  createBabyProfile(userId: string, profile: InsertBabyProfile): Promise<BabyProfile>;
  updateBabyProfile(id: number, userId: string, profile: Partial<InsertBabyProfile>): Promise<BabyProfile | undefined>;
  deleteBabyProfile(id: number, userId: string): Promise<boolean>;

  // Recording operations
  getRecordings(userId: string): Promise<Recording[]>;
  createRecording(userId: string, recording: InsertRecording): Promise<Recording>;
  getRecording(id: number, userId: string): Promise<Recording | undefined>;
  updateRecordingVote(id: number, userId: string, vote: string): Promise<Recording | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
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

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserRole(id: string, userRole: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        userRole: userRole,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
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
      .where(and(eq(babyProfiles.id, id), eq(babyProfiles.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async createGuestUser(): Promise<User> {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [user] = await db
      .insert(users)
      .values({
        id: guestId,
        email: null,
        firstName: "Guest",
        lastName: "User",
        profileImageUrl: null,
        isGuest: true,
        language: "en",
        hasCompletedOnboarding: false,
      })
      .returning();
    return user;
  }

  async updateUserLanguage(userId: string, language: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ language, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async updateUserOnboarding(id: string, completed: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ hasCompletedOnboarding: completed, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserProfileImage(userId: string, profileImageUrl: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ profileImageUrl, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
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

  async updateRecordingVote(id: number, userId: string, vote: string): Promise<Recording | undefined> {
    const [recording] = await db
      .update(recordings)
      .set({ vote })
      .where(and(eq(recordings.id, id), eq(recordings.userId, userId)))
      .returning();
    return recording;
  }

  async getCryReasonDescription(className: string) {
    const [description] = await db
      .select()
      .from(cryReasonDescriptions)
      .where(eq(cryReasonDescriptions.className, className))
      .limit(1);
    return description;
  }

  async getAllCryReasonDescriptions() {
    return await db
      .select()
      .from(cryReasonDescriptions);
  }

  async linkGuestAccount(guestId: string, userData: Partial<UpsertUser>): Promise<User | undefined> {
    // Update guest account to full account
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        isGuest: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, guestId))
      .returning();
    return user;
  }

  // Update user onboarding status
  async updateUserOnboarding(userId: string, completed: boolean) {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        hasCompletedOnboarding: completed,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  // Deactivate user account
  async deactivateUser(userId: string) {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        deactivated: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }
}

export const storage = new DatabaseStorage();