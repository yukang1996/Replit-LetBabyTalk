import {
  users,
  babyProfiles,
  recordings,
  cryReasonDescriptions,
  legalDocuments,
  feedback,
  type UpsertUser,
  type User,
  type InsertBabyProfile,
  type BabyProfile,
  type InsertRecording,
  type Recording,
  type CryReasonDescription,
  type InsertLegalDocument,
  type LegalDocument,
  type InsertFeedback,
  type Feedback,
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
  updateRecordingRate(id: number, userId: string, rateState: string, rateReason?: string): Promise<Recording | undefined>;
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
    const rawRecordings = await db
      .select()
      .from(recordings)
      .where(eq(recordings.userId, userId))
      .orderBy(desc(recordings.recordedAt));

    // Transform snake_case database fields to camelCase for frontend
    return rawRecordings.map(recording => ({
      id: recording.id,
      userId: recording.userId,
      filename: recording.filename,
      audioUrl: recording.audioUrl,
      duration: recording.duration,
      babyProfileId: recording.babyProfileId,
      analysisResult: recording.analysisResult,
      rateState: recording.rateState,
      predictClass: recording.predictClass, // This should now properly map
      rateTime: recording.rateTime,
      rateReason: recording.rateReason,
      recordedAt: recording.recordedAt
    }));
  }

  async createRecording(userId: string, recording: InsertRecording): Promise<Recording> {
    const [newRecording] = await db
      .insert(recordings)
      .values({ ...recording, userId })
      .returning();
    
    // Transform snake_case database fields to camelCase for frontend
    return {
      id: newRecording.id,
      userId: newRecording.userId,
      filename: newRecording.filename,
      audioUrl: newRecording.audioUrl,
      duration: newRecording.duration,
      babyProfileId: newRecording.babyProfileId,
      analysisResult: newRecording.analysisResult,
      rateState: newRecording.rateState,
      predictClass: newRecording.predictClass, // This should now properly map
      rateTime: newRecording.rateTime,
      rateReason: newRecording.rateReason,
      recordedAt: newRecording.recordedAt
    };
  }

  async getRecording(id: number, userId: string): Promise<Recording | undefined> {
    const [recording] = await db
      .select()
      .from(recordings)
      .where(and(eq(recordings.id, id), eq(recordings.userId, userId)));
    
    if (!recording) {
      return undefined;
    }

    // Transform snake_case database fields to camelCase for frontend
    return {
      id: recording.id,
      userId: recording.userId,
      filename: recording.filename,
      audioUrl: recording.audioUrl,
      duration: recording.duration,
      babyProfileId: recording.babyProfileId,
      analysisResult: recording.analysisResult,
      rateState: recording.rateState,
      predictClass: recording.predictClass, // This should now properly map
      rateTime: recording.rateTime,
      rateReason: recording.rateReason,
      recordedAt: recording.recordedAt
    };
  }

  async updateRecordingRate(id: number, userId: string, rateState: string, rateReason?: string): Promise<Recording | undefined> {
    const [recording] = await db
      .update(recordings)
      .set({ 
        rateState,
        rateTime: new Date(),
        rateReason
      })
      .where(and(eq(recordings.id, id), eq(recordings.userId, userId)))
      .returning();
    
    if (!recording) {
      return undefined;
    }

    // Transform snake_case database fields to camelCase for frontend
    return {
      id: recording.id,
      userId: recording.userId,
      filename: recording.filename,
      audioUrl: recording.audioUrl,
      duration: recording.duration,
      babyProfileId: recording.babyProfileId,
      analysisResult: recording.analysisResult,
      rateState: recording.rateState,
      predictClass: recording.predictClass, // This should now properly map
      rateTime: recording.rateTime,
      rateReason: recording.rateReason,
      recordedAt: recording.recordedAt
    };
  }

  async getCryReasonDescription(className: string): Promise<CryReasonDescription | undefined> {
    const [description] = await db
      .select()
      .from(cryReasonDescriptions)
      .where(eq(cryReasonDescriptions.className, className))
      .limit(1);
    return description;
  }

  async getAllCryReasonDescriptions(): Promise<CryReasonDescription[]> {
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

  // Feedback methods
  async createFeedback(userId: string, data: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedback)
      .values({ ...data, userId })
      .returning();
    return newFeedback;
  }

  async getUserFeedback(userId: string): Promise<Feedback[]> {
    return await db
      .select()
      .from(feedback)
      .where(eq(feedback.userId, userId))
      .orderBy(desc(feedback.createdAt));
  }

  // Legal document operations
  async getActiveLegalDocument(type: string, locale: string) {
    const [document] = await db
      .select()
      .from(legalDocuments)
      .where(and(
        eq(legalDocuments.type, type),
        eq(legalDocuments.locale, locale),
        eq(legalDocuments.isActive, true)
      ))
      .limit(1);
    return document;
  }

  async createLegalDocument(document: any) {
    const [newDocument] = await db
      .insert(legalDocuments)
      .values(document)
      .returning();
    return newDocument;
  }

  async updateLegalDocument(id: string, updates: any) {
    const [updatedDocument] = await db
      .update(legalDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(legalDocuments.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteLegalDocument(id: string) {
    const result = await db
      .delete(legalDocuments)
      .where(eq(legalDocuments.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();