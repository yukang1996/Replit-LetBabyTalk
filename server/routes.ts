import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedCryReasons } from "./seed-cry-reasons";
import { seedLegalDocuments } from "./seed-legal-documents";
import { eq, and } from "drizzle-orm";
import { setupAuth, isAuthenticated, hashPassword } from "./auth";
import passport from "passport";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { insertBabyProfileSchema, insertRecordingSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import {
  users,
  babyProfiles,
  recordings,
  cryReasonDescriptions,
  legalDocuments,
  feedback,
  insertBabyProfileSchema,
  insertRecordingSchema,
  insertFeedbackSchema,
  type User,
  type BabyProfile,
  type Recording,
  type InsertFeedback,
} from "@shared/schema";

// Temporary in-memory storage for OTPs (use Redis or database in production)
const otpStorage = new Map<
  string,
  { code: string; expiresAt: number; type: "forgot-password" | "signup" }
>();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "Supabase credentials not found. Profile image upload will fall back to local storage.",
  );
}

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "audio/webm",
      "audio/mp4",
      "audio/wav",
      "audio/ogg",
      "audio/mpeg",
      "audio/mp3",
    ];
    if (
      allowedMimes.includes(file.mimetype) ||
      file.mimetype.startsWith("audio/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
});

// Configure multer for profile image uploads
const profileUpload = multer({
  dest: "uploads/profiles/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Configure multer specifically for baby profile images
const babyProfileUpload = multer({
  dest: "uploads/baby-profiles/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for baby profiles"));
    }
  },
});

const registerSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(6),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone number is required",
  });

const loginSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string(),
  })
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone number is required",
  });

const forgotPasswordSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone number is required",
  });

const resetPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, phone, password, firstName, lastName } =
        registerSchema.parse(req.body);

      // Check if user already exists
      let existingUser = null;
      if (email) {
        existingUser = await storage.getUserByEmail(email);
      }
      if (!existingUser && phone) {
        existingUser = await storage.getUserByPhone(phone);
      }

      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        id: uuidv4(),
        email,
        phone,
        password: hashedPassword,
        firstName,
        lastName,
        isGuest: false,
        language: "en",
        hasCompletedOnboarding: false,
      });

      res
        .status(201)
        .json({ message: "User created successfully", userId: newUser.id });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login user
  app.post("/api/auth/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ message: "Authentication error" });
        }
        if (!user) {
          return res
            .status(401)
            .json({ message: info.message || "Invalid credentials" });
        }
        req.logIn(user, (err) => {
          if (err) {
            return res.status(500).json({ message: "Login failed" });
          }
          return res.json({ message: "Login successful", user });
        });
      })(req, res, next);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Logout user
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Forgot password - generate and store OTP
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email, phone } = forgotPasswordSchema.parse(req.body);
      console.log("Forgot password request for:", email || phone);

      let user = null;
      let identifier = "";

      if (email) {
        user = await storage.getUserByEmail(email);
        identifier = email;
      } else if (phone) {
        user = await storage.getUserByPhone(phone);
        identifier = phone;
      }

      if (!user) {
        // Don't reveal if user exists for security
        return res.status(200).json({
          success: true,
          message: "If the contact info exists, a reset code has been sent",
        });
      }

      // Generate OTP and store it
      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      otpStorage.set(identifier, {
        code: otp,
        expiresAt,
        type: "forgot-password",
      });

      // In a real app, you would send an email/SMS here
      console.log(
        `Generated OTP for ${identifier}: ${otp} (expires at ${new Date(expiresAt)})`,
      );

      res.status(200).json({
        success: true,
        message: "If the contact info exists, a reset code has been sent",
        // Remove this in production - only for testing
        debug: { otp },
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(400).json({
        success: false,
        message: "Invalid request data",
      });
    }
  });

  // Verify OTP endpoint
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, phone, code, type } = req.body;

      if ((!email && !phone) || !code || !type) {
        return res
          .status(400)
          .json({ message: "Email or phone, code, and type are required" });
      }

      const identifier = email || phone;
      const storedOTP = otpStorage.get(identifier);

      if (!storedOTP) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      if (storedOTP.code !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      if (Date.now() > storedOTP.expiresAt) {
        otpStorage.delete(identifier);
        return res
          .status(400)
          .json({ message: "Verification code has expired" });
      }

      if (storedOTP.type !== type) {
        return res.status(400).json({ message: "Invalid verification type" });
      }

      // Don't delete OTP yet for forgot-password (needed for reset)
      if (type === "signup") {
        otpStorage.delete(identifier);
      }

      res.json({
        success: true,
        message: "Verification successful",
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Reset password (requires prior OTP verification)
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, password } = resetPasswordSchema.parse(req.body);

      // Check if there's a valid OTP for this email
      const storedOTP = otpStorage.get(email);
      if (!storedOTP || storedOTP.type !== "forgot-password") {
        return res.status(400).json({
          message: "Invalid reset request. Please request a new code.",
        });
      }

      if (Date.now() > storedOTP.expiresAt) {
        otpStorage.delete(email);
        return res.status(400).json({
          message: "Reset code has expired. Please request a new one.",
        });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(user.id, hashedPassword);

      // Clean up the OTP after successful reset
      otpStorage.delete(email);

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });

  // Guest user creation
  app.post("/api/auth/guest", async (req, res) => {
    try {
      const guestUser = await storage.createGuestUser();
      req.logIn(guestUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Guest login failed" });
        }
        res.status(201).json(guestUser);
      });
    } catch (error) {
      console.error("Guest user creation error:", error);
      res.status(500).json({ message: "Failed to create guest user" });
    }
  });

  // Recording rate endpoint (updated from vote)
  app.post(
    "/api/recordings/:id/rate",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const recordingId = parseInt(req.params.id);
        const { rateState, rateReason } = req.body;
        const userId = req.user.id;

        if (!["good", "bad"].includes(rateState)) {
          return res
            .status(400)
            .json({ message: "Rate state must be 'good' or 'bad'" });
        }

        const updatedRecording = await storage.updateRecordingRate(
          recordingId,
          userId,
          rateState,
          rateReason,
        );
        if (!updatedRecording) {
          return res.status(404).json({ message: "Recording not found" });
        }

        res.json(updatedRecording);
      } catch (error) {
        console.error("Rate update error:", error);
        res.status(500).json({ message: "Failed to update rate" });
      }
    },
  );

  // Update user language
  app.patch(
    "/api/auth/user/language",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { language } = req.body;
        const user = await storage.updateUserLanguage(userId, language);
        res.json(user);
      } catch (error) {
        console.error("Error updating user language:", error);
        res.status(500).json({ message: "Failed to update language" });
      }
    },
  );

  // Update user onboarding status
  app.patch(
    "/api/auth/user/onboarding",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { completed } = req.body;
        const user = await storage.updateUserOnboarding(userId, completed);
        res.json(user);
      } catch (error) {
        console.error("Error updating onboarding status:", error);
        res.status(500).json({ message: "Failed to update onboarding status" });
      }
    },
  );

  // Update user profile
  app.put(
    "/api/auth/profile",
    isAuthenticated,
    profileUpload.single("profileImage"),
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        console.log("Profile update request:", req.body);
        console.log("Profile image file:", req.file);

        let updatedUser = req.user;

        // Check if userRole is provided in the request body
        if (req.body.userRole !== undefined) {
          console.log("Updating user role to:", req.body.userRole);
          updatedUser = await storage.updateUserRole(userId, req.body.userRole);
        }

        // Handle profile image upload if provided
        if (req.file) {
          let profileImageUrl = `/api/images/${req.file.filename}`;

          if (supabase) {
            try {
              console.log("\n=== SUPABASE UPLOAD DEBUG ===");
              console.log("Supabase URL:", supabaseUrl);
              console.log(
                "Supabase Service Key (first 20 chars):",
                supabaseServiceKey?.substring(0, 20) + "...",
              );
              console.log("User ID:", userId);
              console.log("Original file name:", req.file.originalname);
              console.log("File path:", req.file.path);
              console.log("File mime type:", req.file.mimetype);

              // First, check if the bucket exists and create it if it doesn't
              console.log("Step 1: Listing existing buckets...");
              const { data: buckets, error: listError } =
                await supabase.storage.listBuckets();

              if (listError) {
                console.error("❌ Error listing buckets:", listError);
                throw listError;
              }

              console.log(
                "✅ Available buckets:",
                buckets?.map((b) => ({
                  name: b.name,
                  id: b.id,
                  public: b.public,
                })),
              );

              const bucketExists = buckets?.some(
                (bucket) => bucket.name === "user-profile-images",
              );
              console.log("Bucket exists:", bucketExists);

              if (!bucketExists) {
                console.log("Step 2: Creating user-profile-images bucket...");
                const { data: newBucket, error: createError } =
                  await supabase.storage.createBucket("user-profile-images", {
                    public: false,
                    allowedMimeTypes: [
                      "image/jpeg",
                      "image/png",
                      "image/webp",
                      "image/jpg",
                    ],
                    fileSizeLimit: 5242880, // 5MB
                  });

                if (createError) {
                  console.error("❌ Error creating bucket:", createError);
                  throw new Error(
                    `Failed to create storage bucket: ${createError.message}`,
                  );
                } else {
                  console.log("✅ Bucket created successfully:", newBucket);
                }
              } else {
                console.log("✅ Bucket already exists, skipping creation");
              }

              // Generate unique filename
              const fileExtension = path.extname(req.file.originalname || "");
              const fileName = `profile_${userId}_${Date.now()}${fileExtension}`;
              console.log("Step 3: Generated filename:", fileName);

              // Read file data
              const fileData = fs.readFileSync(req.file.path);
              console.log("Step 4: File read successfully");
              console.log("File size:", fileData.length, "bytes");
              console.log("File buffer type:", typeof fileData);

              // Upload to Supabase storage
              console.log("Step 5: Uploading to Supabase storage...");
              console.log("Upload parameters:", {
                bucket: "user-profile-images",
                fileName: fileName,
                contentType: req.file.mimetype,
                fileSize: fileData.length,
              });

              const uploadResult = await supabase.storage
                .from("user-profile-images")
                .upload(fileName, fileData, {
                  contentType: req.file.mimetype,
                  upsert: true,
                });

              console.log("Upload result:", {
                data: uploadResult.data,
                error: uploadResult.error,
              });

              if (uploadResult.error) {
                console.error("❌ Supabase upload error:", uploadResult.error);
                console.error(
                  "Error details:",
                  JSON.stringify(uploadResult.error, null, 2),
                );
                throw uploadResult.error;
              } else {
                console.log("✅ Successfully uploaded to Supabase!");
                console.log("Upload data:", uploadResult.data);

                // Verify the file was uploaded by listing files in bucket
                console.log(
                  "Step 6: Verifying upload by listing bucket contents...",
                );
                const { data: files, error: listFilesError } =
                  await supabase.storage.from("user-profile-images").list();

                if (listFilesError) {
                  console.error("❌ Error listing files:", listFilesError);
                } else {
                  console.log(
                    "✅ Files in bucket:",
                    files?.map((f) => ({
                      name: f.name,
                      size: f.metadata?.size,
                    })),
                  );
                }

                // Create signed URL that expires in 1 year (private access)
                console.log("Step 7: Creating signed URL...");
                const { data: urlData, error: urlError } =
                  await supabase.storage
                    .from("user-profile-images")
                    .createSignedUrl(fileName, 31536000); // 1 year in seconds

                if (urlError) {
                  console.error("❌ Error creating signed URL:", urlError);
                  throw urlError;
                } else {
                  console.log("✅ Created signed URL successfully");
                  console.log(
                    "Signed URL (first 50 chars):",
                    urlData.signedUrl.substring(0, 50) + "...",
                  );
                  profileImageUrl = urlData.signedUrl;
                }
              }

              console.log("=== SUPABASE UPLOAD COMPLETE ===\n");
            } catch (supabaseError) {
              console.error("\n❌ SUPABASE STORAGE ERROR:", supabaseError);
              console.error("Error stack:", supabaseError.stack);
              console.log("Falling back to local storage...\n");
              // Fall back to local storage
            }
          } else {
            console.log(
              "❌ Supabase client not initialized - missing credentials",
            );
          }

          console.log("Updating profile image to:", profileImageUrl);
          updatedUser = await storage.updateUserProfileImage(
            userId,
            profileImageUrl,
          );

          // Clean up local file
          try {
            fs.unlinkSync(req.file.path);
          } catch (cleanupError) {
            console.error("File cleanup error:", cleanupError);
          }
        }

        console.log("Updated user:", updatedUser);
        res.json(updatedUser);
      } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    },
  );

  // Baby profile routes
  app.get("/api/baby-profiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profiles = await storage.getBabyProfiles(userId);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching baby profiles:", error);
      res.status(500).json({ message: "Failed to fetch baby profiles" });
    }
  });

  app.post(
    "/api/baby-profiles",
    isAuthenticated,
    babyProfileUpload.single("photo"),
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        console.log("Baby profile creation request:", req.body);
        console.log("Baby profile image file:", req.file);

        // Convert dateOfBirth string to Date object before validation
        const requestData = {
          ...req.body,
          dateOfBirth: new Date(req.body.dateOfBirth),
        };

        let photoUrl = null;

        // Handle photo upload if provided
        if (req.file) {
          photoUrl = `/api/images/${req.file.filename}`;

          if (supabase) {
            try {
              console.log("\n=== SUPABASE BABY PROFILE UPLOAD DEBUG ===");
              console.log("User ID:", userId);
              console.log("Original file name:", req.file.originalname);
              console.log("File path:", req.file.path);
              console.log("File mime type:", req.file.mimetype);

              // Check if baby-profile-images bucket exists and create it if it doesn't
              console.log("Step 1: Listing existing buckets...");
              const { data: buckets, error: listError } =
                await supabase.storage.listBuckets();

              if (listError) {
                console.error("❌ Error listing buckets:", listError);
                throw listError;
              }

              console.log(
                "✅ Available buckets:",
                buckets?.map((b) => ({
                  name: b.name,
                  id: b.id,
                  public: b.public,
                })),
              );

              const bucketExists = buckets?.some(
                (bucket) => bucket.name === "baby-profile-images",
              );
              console.log("Baby profile bucket exists:", bucketExists);

              if (!bucketExists) {
                console.log("Step 2: Creating baby-profile-images bucket...");
                const { data: newBucket, error: createError } =
                  await supabase.storage.createBucket("baby-profile-images", {
                    public: false,
                    allowedMimeTypes: [
                      "image/jpeg",
                      "image/png",
                      "image/webp",
                      "image/jpg",
                    ],
                    fileSizeLimit: 5242880, // 5MB
                  });

                if (createError) {
                  console.error("❌ Error creating bucket:", createError);
                  throw new Error(
                    `Failed to create storage bucket: ${createError.message}`,
                  );
                } else {
                  console.log("✅ Bucket created successfully:", newBucket);
                }
              } else {
                console.log("✅ Bucket already exists, skipping creation");
              }

              // Generate unique filename
              const fileExtension = path.extname(req.file.originalname || "");
              const fileName = `baby_profile_${userId}_${Date.now()}${fileExtension}`;
              console.log("Step 3: Generated filename:", fileName);

              // Read file data
              const fileData = fs.readFileSync(req.file.path);
              console.log("Step 4: File read successfully");
              console.log("File size:", fileData.length, "bytes");

              // Upload to Supabase storage
              console.log("Step 5: Uploading to Supabase storage...");
              const uploadResult = await supabase.storage
                .from("baby-profile-images")
                .upload(fileName, fileData, {
                  contentType: req.file.mimetype,
                  upsert: true,
                });

              console.log("Upload result:", {
                data: uploadResult.data,
                error: uploadResult.error,
              });

              if (uploadResult.error) {
                console.error("❌ Supabase upload error:", uploadResult.error);
                throw uploadResult.error;
              } else {
                console.log("✅ Successfully uploaded to Supabase!");

                // Create signed URL that expires in 1 year (private access)
                console.log("Step 6: Creating signed URL...");
                const { data: urlData, error: urlError } =
                  await supabase.storage
                    .from("baby-profile-images")
                    .createSignedUrl(fileName, 31536000); // 1 year in seconds

                if (urlError) {
                  console.error("❌ Error creating signed URL:", urlError);
                  throw urlError;
                } else {
                  console.log("✅ Created signed URL successfully");
                  photoUrl = urlData.signedUrl;
                }
              }

              console.log("=== SUPABASE BABY PROFILE UPLOAD COMPLETE ===\n");
            } catch (supabaseError) {
              console.error("\n❌ SUPABASE STORAGE ERROR:", supabaseError);
              console.log("Falling back to local storage...\n");
              // Fall back to local storage
            }
          }

          // Clean up local file
          try {
            fs.unlinkSync(req.file.path);
          } catch (cleanupError) {
            console.error("File cleanup error:", cleanupError);
          }
        }

        // Add photo URL to request data
        if (photoUrl) {
          requestData.photoUrl = photoUrl;
        }

        const validatedData = insertBabyProfileSchema.parse(requestData);
        const profile = await storage.createBabyProfile(userId, validatedData);
        res.status(201).json(profile);
      } catch (error) {
        console.error("Error creating baby profile:", error);
        res.status(400).json({ message: "Failed to create baby profile" });
      }
    },
  );

  app.put(
    "/api/baby-profiles/:id",
    isAuthenticated,
    babyProfileUpload.single("photo"),
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const profileId = parseInt(req.params.id);
        console.log("Baby profile update request:", req.body);
        console.log("Baby profile image file:", req.file);

        // Convert dateOfBirth string to Date object before validation
        const requestData = {
          ...req.body,
          ...(req.body.dateOfBirth && {
            dateOfBirth: new Date(req.body.dateOfBirth),
          }),
        };

        // Handle photo upload if provided
        if (req.file) {
          let photoUrl = `/api/images/${req.file.filename}`;

          if (supabase) {
            try {
              console.log(
                "\n=== SUPABASE BABY PROFILE UPDATE UPLOAD DEBUG ===",
              );
              console.log("User ID:", userId);
              console.log("Profile ID:", profileId);
              console.log("Original file name:", req.file.originalname);

              // Generate unique filename
              const fileExtension = path.extname(req.file.originalname || "");
              const fileName = `baby_profile_${userId}_${profileId}_${Date.now()}${fileExtension}`;
              console.log("Generated filename:", fileName);

              // Read file data
              const fileData = fs.readFileSync(req.file.path);
              console.log(
                "File read successfully, size:",
                fileData.length,
                "bytes",
              );

              // Upload to Supabase storage
              const uploadResult = await supabase.storage
                .from("baby-profile-images")
                .upload(fileName, fileData, {
                  contentType: req.file.mimetype,
                  upsert: true,
                });

              if (uploadResult.error) {
                console.error("❌ Supabase upload error:", uploadResult.error);
                throw uploadResult.error;
              } else {
                console.log("✅ Successfully uploaded to Supabase!");

                // Create signed URL
                const { data: urlData, error: urlError } =
                  await supabase.storage
                    .from("baby-profile-images")
                    .createSignedUrl(fileName, 31536000); // 1 year in seconds

                if (urlError) {
                  console.error("❌ Error creating signed URL:", urlError);
                  throw urlError;
                } else {
                  console.log("✅ Created signed URL successfully");
                  photoUrl = urlData.signedUrl;
                }
              }

              console.log(
                "=== SUPABASE BABY PROFILE UPDATE UPLOAD COMPLETE ===\n",
              );
            } catch (supabaseError) {
              console.error("\n❌ SUPABASE STORAGE ERROR:", supabaseError);
              console.log("Falling back to local storage...\n");
            }
          }

          // Add photo URL to request data
          requestData.photoUrl = photoUrl;

          // Clean up local file
          try {
            fs.unlinkSync(req.file.path);
          } catch (cleanupError) {
            console.error("File cleanup error:", cleanupError);
          }
        }

        const validatedData = insertBabyProfileSchema
          .partial()
          .parse(requestData);
        const profile = await storage.updateBabyProfile(
          profileId,
          userId,
          validatedData,
        );

        if (!profile) {
          return res.status(404).json({ message: "Baby profile not found" });
        }

        res.json(profile);
      } catch (error) {
        console.error("Error updating baby profile:", error);
        res.status(400).json({ message: "Failed to update baby profile" });
      }
    },
  );

  app.delete(
    "/api/baby-profiles/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const profileId = parseInt(req.params.id);
        const deleted = await storage.deleteBabyProfile(profileId, userId);

        if (!deleted) {
          return res.status(404).json({ message: "Baby profile not found" });
        }

        res.status(204).send();
      } catch (error) {
        console.error("Error deleting baby profile:", error);
        res.status(500).json({ message: "Failed to delete baby profile" });
      }
    },
  );

  // Recording routes
  app.get("/api/recordings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const recordings = await storage.getRecordings(userId);
      res.json(recordings);
    } catch (error) {
      console.error("Error fetching recordings:", error);
      res.status(500).json({ message: "Failed to fetch recordings" });
    }
  });

  app.post(
    "/api/recordings",
    isAuthenticated,
    upload.single("audio"),
    async (req: any, res) => {
      try {
        const userId = req.user.id;

        if (!req.file) {
          return res.status(400).json({ message: "No audio file provided" });
        }

        // Parse additional metadata from request
        const { duration, babyProfileId, pressing = true } = req.body;
        const timestamp = new Date().toISOString();
        const audioFormat = req.file.mimetype || "audio/webm";
        
        console.log('Audio format metadata:', {
          originalName: req.file.originalname,
          detectedMimeType: req.file.mimetype,
          audioFormat: audioFormat,
          fileSize: req.file.size
        });

        let audioUrl = `/api/audio/${req.file.filename}`; // Default to local storage

        // Upload audio to Supabase storage if available
        if (supabase) {
          try {
            console.log("\n=== SUPABASE AUDIO RECORDING UPLOAD DEBUG ===");
            console.log("User ID:", userId);
            console.log("Original file name:", req.file.originalname);
            console.log("File path:", req.file.path);
            console.log("File mime type:", req.file.mimetype);

            // Check if audio-recordings bucket exists and create it if it doesn't
            console.log("Step 1: Listing existing buckets...");
            const { data: buckets, error: listError } =
              await supabase.storage.listBuckets();

            if (listError) {
              console.error("❌ Error listing buckets:", listError);
              throw listError;
            }

            console.log(
              "✅ Available buckets:",
              buckets?.map((b) => ({
                name: b.name,
                id: b.id,
                public: b.public,
              })),
            );

            const bucketExists = buckets?.some(
              (bucket) => bucket.name === "audio-recordings",
            );
            console.log("Audio recordings bucket exists:", bucketExists);

            if (!bucketExists) {
              console.log("Step 2: Creating audio-recordings bucket...");
              const { data: newBucket, error: createError } =
                await supabase.storage.createBucket("audio-recordings", {
                  public: false,
                  allowedMimeTypes: [
                    "audio/webm",
                    "audio/wav",
                    "audio/mp3",
                    "audio/mp4",
                    "audio/mpeg",
                    "audio/ogg",
                    "audio/aac",
                  ],
                  fileSizeLimit: 10485760, // 10MB
                });

              if (createError) {
                console.error("❌ Error creating bucket:", createError);
                throw new Error(
                  `Failed to create storage bucket: ${createError.message}`,
                );
              } else {
                console.log("✅ Bucket created successfully:", newBucket);
              }
            } else {
              console.log("✅ Bucket already exists, skipping creation");
            }

            // Generate unique filename for audio recording based on actual MIME type
            let fileExtension = path.extname(req.file.originalname || "");
            if (!fileExtension) {
              // Determine extension based on MIME type
              if (audioFormat.includes('mp4')) {
                fileExtension = '.mp4';
              } else if (audioFormat.includes('webm')) {
                fileExtension = '.webm';
              } else if (audioFormat.includes('wav')) {
                fileExtension = '.wav';
              } else if (audioFormat.includes('ogg')) {
                fileExtension = '.ogg';
              } else {
                fileExtension = '.webm'; // fallback
              }
            }
            const fileName = `recording_${userId}_${Date.now()}${fileExtension}`;
            console.log("Step 3: Generated filename:", fileName);

            // Read file data
            const fileData = fs.readFileSync(req.file.path);
            console.log("Step 4: File read successfully");
            console.log("File size:", fileData.length, "bytes");

            // Upload to Supabase storage
            console.log("Step 5: Uploading to Supabase storage...");
            const uploadResult = await supabase.storage
              .from("audio-recordings")
              .upload(fileName, fileData, {
                contentType: req.file.mimetype,
                upsert: true,
              });

            console.log("Upload result:", {
              data: uploadResult.data,
              error: uploadResult.error,
            });

            if (uploadResult.error) {
              console.error("❌ Supabase upload error:", uploadResult.error);
              throw uploadResult.error;
            } else {
              console.log("✅ Successfully uploaded to Supabase!");

              // Create signed URL that expires in 1 year (private access)
              console.log("Step 6: Creating signed URL...");
              const { data: urlData, error: urlError } = await supabase.storage
                .from("audio-recordings")
                .createSignedUrl(fileName, 31536000); // 1 year in seconds

              if (urlError) {
                console.error("❌ Error creating signed URL:", urlError);
                throw urlError;
              } else {
                console.log("✅ Created signed URL successfully");
                audioUrl = urlData.signedUrl;
              }
            }

            console.log("=== SUPABASE AUDIO RECORDING UPLOAD COMPLETE ===\n");
          } catch (supabaseError) {
            console.error("\n❌ SUPABASE STORAGE ERROR:", supabaseError);
            console.log("Falling back to local storage...\n");
            // Continue with local storage as fallback
          }
        } else {
          console.log(
            "❌ Supabase client not initialized - using local storage",
          );
        }

        // Call AI API (mock in development, real in production)
        let analysisResult;
        let predictClass = "unknown"; // Initialize with default value
        
        try {
          const useMockAPI = process.env.NODE_ENV === "development" || process.env.USE_MOCK_API === "true";
          const apiUrl = useMockAPI 
            ? `${req.protocol}://${req.get('host')}/api/mock_process_audio`
            : "https://api.letbabytalk.com/process_audio";

          console.log(`Using ${useMockAPI ? 'MOCK' : 'REAL'} AI API: ${apiUrl}`);

          const FormData = await import("form-data");
          const fetch = await import("node-fetch");

          const formData = new FormData.default();
          formData.append("audio", fs.createReadStream(req.file.path), {
            filename: req.file.originalname || "recording.webm",
            contentType: audioFormat,
          });

          // Prepare metadata according to API specification
          const metadata = {
            user_id: userId,
            timestamp: timestamp,
            audio_format: audioFormat,
            pressing: pressing === "true" || pressing === true,
          };

          formData.append("metadata", JSON.stringify(metadata));

          const response = await fetch.default(apiUrl, {
            method: "POST",
            headers: {
              ...formData.getHeaders(),
            },
            body: formData,
            timeout: 30000, // 30 seconds timeout
          });
          console.log("see: ", response);
          if (!response.ok) {
            const errorText = await response.text(); // Read the response body
            console.error("AI API Error Response Body:", errorText); // Log the raw response
            throw new Error(
              `AI API responded with status: ${response.status} - ${errorText}`,
            );
          }

          const aiResponse = await response.json();
          const result = aiResponse.data?.result;

          if (!result) {
            throw new Error("Invalid response format from AI API");
          }

          // Extract predict_class and probs for new schema
          predictClass = result.class || "unknown";
          const probs = result.probs;

          // Store only probs in analysis_result (JSONB)
          analysisResult = probs;
        } catch (aiError) {
          console.error("AI API Error:", aiError);
          // Fallback to basic analysis if AI API fails
          predictClass = "unknown";
          analysisResult = {
            unknown: 1.0,
            error: aiError.message,
          };
        }

        // Save recording with metadata, analysis result, and audio URL
        const recordingData = {
          userId: userId, // Add userId to the recording data
          filename: req.file.filename,
          audioUrl: audioUrl, // Store the Supabase URL or local URL
          duration: duration ? parseInt(duration) : undefined,
          babyProfileId: babyProfileId ? parseInt(babyProfileId) : undefined,
          analysisResult: analysisResult, // Store probs object
          predictClass: predictClass, // Store the AI prediction class
        };

        const validatedData = insertRecordingSchema.parse(recordingData);
        const recording = await storage.createRecording(userId, validatedData);

        // Clean up uploaded file
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("File cleanup error:", cleanupError);
        }

        res.status(201).json(recording);
      } catch (error) {
        console.error("Error creating recording:", error);
        res.status(400).json({ message: "Failed to create recording" });
      }
    },
  );

  app.get("/api/recordings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const recordingId = parseInt(req.params.id);
      const recording = await storage.getRecording(recordingId, userId);

      if (!recording) {
        return res.status(404).json({ message: "Recording not found" });
      }

      res.json(recording);
    } catch (error) {
      console.error("Error fetching recording:", error);
      res.status(500).json({ message: "Failed to fetch recording" });
    }
  });

  // Mock process_audio endpoint for development
  app.post("/api/mock_process_audio", upload.single("audio"), async (req, res) => {
    try {
      console.log("Mock AI API called with:", {
        filename: req.file?.originalname,
        mimetype: req.file?.mimetype,
        metadata: req.body.metadata
      });

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Return hardcoded successful response
      const mockResponse = {
        "data": {
          "result": {
            "class": "hunger_food",
            "probs": {
              "hunger_food": 0.961,
              "hunger_milk": 0.02,
              "sleepiness": 0.04,
              "lack_of_security": 0.022,
              "diaper_urine": 0.032,
              "diaper_bowel": 0.03,
              "internal_pain": 0.02,
              "external_pain": 0.001,
              "physical_discomfort": 0.01,
              "unmet_needs": 0.003,
              "breathing_difficulties": 0.001,
              "normal": 0.09,
              "no_cry_detected": 0.03
            },
            "show": true
          }
        }
      };

      res.json(mockResponse);
    } catch (error) {
      console.error("Mock AI API Error:", error);
      res.status(500).json({ error: "Mock API failed" });
    }
  });

  // Get cry reason description
  app.get("/api/cry-reasons/:className", async (req, res) => {
    try {
      const className = req.params.className;
      const description = await storage.getCryReasonDescription(className);

      if (!description) {
        return res
          .status(404)
          .json({ message: "Cry reason description not found" });
      }

      res.json(description);
    } catch (error) {
      console.error("Error fetching cry reason description:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch cry reason description" });
    }
  });

  // Initialize cry reasons if needed
  app.post("/api/init-cry-reasons", async (req, res) => {
    try {
      const { seedCryReasons } = await import("./seed-cry-reasons");
      await seedCryReasons();
      res.json({ message: "Cry reasons initialized successfully" });
    } catch (error) {
      console.error("Error initializing cry reasons:", error);
      res.status(500).json({ message: "Failed to initialize cry reasons" });
    }
  });

  // Initialize legal documents
  app.post("/api/init-legal-documents", async (req, res) => {
    try {
      await seedLegalDocuments();
      res.json({ message: "Legal documents initialized successfully" });
    } catch (error) {
      console.error("Error initializing legal documents:", error);
      res.status(500).json({ message: "Failed to initialize legal documents" });
    }
  });

  // Serve audio files
  app.get("/api/audio/:filename", isAuthenticated, async (req, res) => {
    const filename = req.params.filename;

    // First try to find the recording in database to get the audioUrl
    try {
      const userId = req.user.id;
      const recordings = await storage.getRecordings(userId);
      const recording = recordings.find((r) => r.filename === filename);

      if (
        recording &&
        recording.audioUrl &&
        recording.audioUrl.includes("supabase")
      ) {
        // If it's a Supabase URL, redirect to it
        return res.redirect(recording.audioUrl);
      }
    } catch (error) {
      console.error("Error checking recording audioUrl:", error);
    }

    // Fall back to local file serving
    const filepath = path.join(process.cwd(), "uploads", filename);

    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: "Audio file not found" });
    }
  });

  // Deactivate account
  app.delete("/api/auth/account", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Deactivate the user account instead of deleting
      await storage.deactivateUser(userId);

      // Logout the user
      req.logout((err) => {
        if (err) {
          console.error("Logout error during deactivation:", err);
        }
      });

      res.json({ message: "Account deactivated successfully" });
    } catch (error) {
      console.error("Account deactivation error:", error);
      res.status(500).json({ message: "Failed to deactivate account" });
    }
  });

  // Photo upload endpoint for baby profiles
  app.post(
    "/api/upload-photo",
    isAuthenticated,
    babyProfileUpload.single("photo"),
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const uploadType = req.body.type || "baby-profile"; // 'baby-profile' or 'user-profile', default to baby-profile

        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        console.log("Photo upload request:", {
          userId,
          uploadType,
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        });

        let photoUrl = `/uploads/baby-profiles/${req.file.filename}`;

        // Upload to Supabase if available
        if (supabase) {
          try {
            const bucketName =
              uploadType === "baby-profile"
                ? "baby-profile-images"
                : "user-profile-images";

            // Generate unique filename
            const fileExtension = path.extname(req.file.originalname || "");
            const fileName = `${uploadType}_${userId}_${Date.now()}${fileExtension}`;

            console.log(
              `\n=== SUPABASE ${uploadType.toUpperCase()} UPLOAD DEBUG ===`,
            );
            console.log(`Uploading to Supabase bucket: ${bucketName}`);
            console.log("Generated filename:", fileName);

            // Read file data
            const fileData = fs.readFileSync(req.file.path);
            console.log(
              "File read successfully, size:",
              fileData.length,
              "bytes",
            );

            // Check if bucket exists, create if it doesn't
            const { data: buckets, error: listError } =
              await supabase.storage.listBuckets();

            if (listError) {
              console.error("Error listing buckets:", listError);
              throw listError;
            }

            const bucketExists = buckets?.some(
              (bucket) => bucket.name === bucketName,
            );
            console.log(`Bucket ${bucketName} exists:`, bucketExists);

            if (!bucketExists) {
              console.log(`Creating ${bucketName} bucket...`);
              const { error: createError } =
                await supabase.storage.createBucket(bucketName, {
                  public: false,
                  allowedMimeTypes: [
                    "image/jpeg",
                    "image/png",
                    "image/gif",
                    "image/webp",
                    "image/jpg",
                  ],
                  fileSizeLimit: 5 * 1024 * 1024, // 5MB
                });

              if (createError) {
                console.error(
                  `Error creating ${bucketName} bucket:`,
                  createError,
                );
                throw createError;
              } else {
                console.log(`✅ Bucket ${bucketName} created successfully`);
              }
            }

            // Upload file to Supabase storage
            console.log("Uploading to Supabase storage...");
            const uploadResult = await supabase.storage
              .from(bucketName)
              .upload(fileName, fileData, {
                contentType: req.file.mimetype,
                upsert: true,
              });

            if (uploadResult.error) {
              console.error("Supabase upload error:", uploadResult.error);
              throw uploadResult.error;
            } else {
              console.log("✅ Successfully uploaded to Supabase!");
            }

            // Create signed URL that expires in 1 year
            console.log("Creating signed URL...");
            const { data: urlData, error: urlError } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(fileName, 31536000); // 1 year

            if (urlError) {
              console.error("Error creating signed URL:", urlError);
              throw urlError;
            } else {
              console.log("✅ Created signed URL successfully");
              photoUrl = urlData.signedUrl;
            }

            console.log(
              `=== SUPABASE ${uploadType.toUpperCase()} UPLOAD COMPLETE ===\n`,
            );
          } catch (supabaseError) {
            console.error("\n❌ SUPABASE STORAGE ERROR:", supabaseError);
            console.log("Falling back to local storage...\n");
            // Continue with local storage as fallback
          }
        } else {
          console.log(
            "❌ Supabase client not initialized - missing credentials",
          );
        }

        // Clean up local file
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("File cleanup error:", cleanupError);
        }

        res.json({ photoUrl });
      } catch (error) {
        console.error("Photo upload error:", error);
        res.status(500).json({ message: "Failed to upload photo" });
      }
    },
  );

  // Test Supabase connection
  app.get("/api/test-supabase", async (req, res) => {
    try {
      if (!supabase) {
        return res.json({
          status: "error",
          message: "Supabase not configured",
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseServiceKey,
        });
      }

      // Test connection by listing buckets
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        return res.json({
          status: "error",
          message: "Supabase connection failed",
          error: error.message,
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseServiceKey,
        });
      }

      res.json({
        status: "success",
        message: "Supabase connected successfully",
        buckets: buckets?.map((b) => b.name) || [],
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
      });
    } catch (error) {
      res.json({
        status: "error",
        message: "Supabase test failed",
        error: error.message,
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
      });
    }
  });

  // Get legal document by type and locale
  app.get("/api/legal-documents/:type/:locale", async (req, res) => {
    try {
      const { type, locale } = req.params;
      const document = await storage.getActiveLegalDocument(type, locale);

      if (!document) {
        return res.status(404).json({ message: "Legal document not found" });
      }

      res.json(document);
    } catch (error) {
      console.error("Error fetching legal document:", error);
      res.status(500).json({ message: "Failed to fetch legal document" });
    }
  });

  // Create new legal document
  app.post("/api/legal-documents", async (req, res) => {
    try {
      const { type, locale, title, content, is_active, version } = req.body;
      const newDocument = await storage.createLegalDocument({
        type,
        locale,
        title,
        content,
        is_active,
        version,
      });
      res.status(201).json(newDocument);
    } catch (error) {
      console.error("Error creating legal document:", error);
      res.status(500).json({ message: "Failed to create legal document" });
    }
  });

  // Update existing legal document
  app.put("/api/legal-documents/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { type, locale, title, content, is_active, version } = req.body;
      const updatedDocument = await storage.updateLegalDocument(id, {
        type,
        locale,
        title,
        content,
        is_active,
        version,
      });
      if (!updatedDocument) {
        return res.status(404).json({ message: "Legal document not found" });
      }
      res.json(updatedDocument);
    } catch (error) {
      console.error("Error updating legal document:", error);
      res.status(500).json({ message: "Failed to update legal document" });
    }
  });

  // Delete legal document
  app.delete("/api/legal-documents/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteLegalDocument(id);
      if (!deleted) {
        return res.status(404).json({ message: "Legal document not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting legal document:", error);
      res.status(500).json({ message: "Failed to delete legal document" });
    }
  });

  // Feedback routes
  app.post("/api/feedback", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { rating, feedback: feedbackMessage } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ message: "Rating must be between 1 and 5" });
      }

      const feedbackData = {
        rating: parseInt(rating),
        message: feedbackMessage || null,
      };

      const validatedData = insertFeedbackSchema.parse(feedbackData);
      const newFeedback = await storage.createFeedback(userId, validatedData);

      res.status(201).json(newFeedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  app.get("/api/feedback", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userFeedback = await storage.getUserFeedback(userId);
      res.json(userFeedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Serve profile images
  app.get("/api/images/:filename", (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(process.cwd(), "uploads", "profiles", filename);

    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: "Image file not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
