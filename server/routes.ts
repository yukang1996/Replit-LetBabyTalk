import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword } from "./auth";
import passport from "passport";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { insertBabyProfileSchema, insertRecordingSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Temporary in-memory storage for OTPs (use Redis or database in production)
const otpStorage = new Map<string, { code: string; expiresAt: number; type: 'forgot-password' | 'signup' }>();

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone number is required",
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string(),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone number is required",
});

const forgotPasswordSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).refine((data) => data.email || data.phone, {
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
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Register new user
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, phone, password, firstName, lastName } = registerSchema.parse(req.body);
      
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

      res.status(201).json({ message: "User created successfully", userId: newUser.id });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login user
  app.post('/api/auth/login', (req, res, next) => {
    try {
      loginSchema.parse(req.body);
      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ message: "Authentication error" });
        }
        if (!user) {
          return res.status(401).json({ message: info.message || "Invalid credentials" });
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
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Forgot password - generate and store OTP
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email, phone } = forgotPasswordSchema.parse(req.body);
      console.log('Forgot password request for:', email || phone);
      
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
          message: "If the contact info exists, a reset code has been sent" 
        });
      }

      // Generate OTP and store it
      const otp = generateOTP();
      const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
      otpStorage.set(identifier, { code: otp, expiresAt, type: 'forgot-password' });

      // In a real app, you would send an email/SMS here
      console.log(`Generated OTP for ${identifier}: ${otp} (expires at ${new Date(expiresAt)})`);
      
      res.status(200).json({ 
        success: true, 
        message: "If the contact info exists, a reset code has been sent",
        // Remove this in production - only for testing
        debug: { otp }
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(400).json({ 
        success: false, 
        message: "Invalid request data" 
      });
    }
  });

  // Verify OTP endpoint
  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, phone, code, type } = req.body;
      
      if ((!email && !phone) || !code || !type) {
        return res.status(400).json({ message: "Email or phone, code, and type are required" });
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
        return res.status(400).json({ message: "Verification code has expired" });
      }

      if (storedOTP.type !== type) {
        return res.status(400).json({ message: "Invalid verification type" });
      }

      // Don't delete OTP yet for forgot-password (needed for reset)
      if (type === 'signup') {
        otpStorage.delete(identifier);
      }

      res.json({ 
        success: true, 
        message: "Verification successful" 
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Reset password (requires prior OTP verification)
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, password } = resetPasswordSchema.parse(req.body);
      
      // Check if there's a valid OTP for this email
      const storedOTP = otpStorage.get(email);
      if (!storedOTP || storedOTP.type !== 'forgot-password') {
        return res.status(400).json({ message: "Invalid reset request. Please request a new code." });
      }

      if (Date.now() > storedOTP.expiresAt) {
        otpStorage.delete(email);
        return res.status(400).json({ message: "Reset code has expired. Please request a new one." });
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
  app.post('/api/auth/guest', async (req, res) => {
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

  // Recording vote endpoint
  app.post('/api/recordings/:id/vote', isAuthenticated, async (req: any, res) => {
    try {
      const recordingId = parseInt(req.params.id);
      const { vote } = req.body;
      const userId = req.user.id;

      if (!['good', 'bad'].includes(vote)) {
        return res.status(400).json({ message: "Vote must be 'good' or 'bad'" });
      }

      const updatedRecording = await storage.updateRecordingVote(recordingId, userId, vote);
      if (!updatedRecording) {
        return res.status(404).json({ message: "Recording not found" });
      }

      res.json(updatedRecording);
    } catch (error) {
      console.error("Vote update error:", error);
      res.status(500).json({ message: "Failed to update vote" });
    }
  });

  // Update user language
  app.patch('/api/auth/user/language', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { language } = req.body;
      const user = await storage.updateUserLanguage(userId, language);
      res.json(user);
    } catch (error) {
      console.error("Error updating user language:", error);
      res.status(500).json({ message: "Failed to update language" });
    }
  });

  // Update user onboarding status
  app.patch('/api/auth/user/onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { completed } = req.body;
      const user = await storage.updateUserOnboarding(userId, completed);
      res.json(user);
    } catch (error) {
      console.error("Error updating onboarding status:", error);
      res.status(500).json({ message: "Failed to update onboarding status" });
    }
  });

  // Baby profile routes
  app.get('/api/baby-profiles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profiles = await storage.getBabyProfiles(userId);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching baby profiles:", error);
      res.status(500).json({ message: "Failed to fetch baby profiles" });
    }
  });

  app.post('/api/baby-profiles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // Convert dateOfBirth string to Date object before validation
      const requestData = {
        ...req.body,
        dateOfBirth: new Date(req.body.dateOfBirth)
      };
      const validatedData = insertBabyProfileSchema.parse(requestData);
      const profile = await storage.createBabyProfile(userId, validatedData);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating baby profile:", error);
      res.status(400).json({ message: "Failed to create baby profile" });
    }
  });

  app.put('/api/baby-profiles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profileId = parseInt(req.params.id);
      
      // Convert dateOfBirth string to Date object before validation
      const requestData = {
        ...req.body,
        ...(req.body.dateOfBirth && { dateOfBirth: new Date(req.body.dateOfBirth) })
      };
      
      const validatedData = insertBabyProfileSchema.partial().parse(requestData);
      const profile = await storage.updateBabyProfile(profileId, userId, validatedData);
      
      if (!profile) {
        return res.status(404).json({ message: "Baby profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error updating baby profile:", error);
      res.status(400).json({ message: "Failed to update baby profile" });
    }
  });

  app.delete('/api/baby-profiles/:id', isAuthenticated, async (req: any, res) => {
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
  });

  // Recording routes
  app.get('/api/recordings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const recordings = await storage.getRecordings(userId);
      res.json(recordings);
    } catch (error) {
      console.error("Error fetching recordings:", error);
      res.status(500).json({ message: "Failed to fetch recordings" });
    }
  });

  app.post('/api/recordings', isAuthenticated, upload.single('audio'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      // Mock AI analysis - replace with actual AI service
      const mockAnalysis = {
        cryType: ['hunger', 'tired', 'discomfort', 'pain'][Math.floor(Math.random() * 4)],
        confidence: Math.random() * 0.4 + 0.6, // 60-100%
        recommendations: [
          "Try feeding if it's been more than 2 hours",
          "Check diaper and comfort level",
          "Consider burping or changing position"
        ]
      };

      const recordingData = {
        filename: req.file.filename,
        duration: req.body.duration ? parseInt(req.body.duration) : null,
        babyProfileId: req.body.babyProfileId ? parseInt(req.body.babyProfileId) : null,
        analysisResult: mockAnalysis,
      };

      const validatedData = insertRecordingSchema.parse(recordingData);
      const recording = await storage.createRecording(userId, validatedData);
      
      res.status(201).json(recording);
    } catch (error) {
      console.error("Error creating recording:", error);
      res.status(400).json({ message: "Failed to create recording" });
    }
  });

  app.get('/api/recordings/:id', isAuthenticated, async (req: any, res) => {
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

  // Serve audio files
  app.get('/api/audio/:filename', isAuthenticated, (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(process.cwd(), 'uploads', filename);
    
    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: "Audio file not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
