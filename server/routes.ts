import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBabyProfileSchema, insertRecordingSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Guest user route
  app.post('/api/auth/guest', async (req, res) => {
    try {
      const guestUser = await storage.createGuestUser();
      res.status(201).json(guestUser);
    } catch (error) {
      console.error("Error creating guest user:", error);
      res.status(500).json({ message: "Failed to create guest user" });
    }
  });

  // Update user language
  app.patch('/api/auth/user/language', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const profiles = await storage.getBabyProfiles(userId);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching baby profiles:", error);
      res.status(500).json({ message: "Failed to fetch baby profiles" });
    }
  });

  app.post('/api/baby-profiles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const profileId = parseInt(req.params.id);
      const validatedData = insertBabyProfileSchema.partial().parse(req.body);
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const recordings = await storage.getRecordings(userId);
      res.json(recordings);
    } catch (error) {
      console.error("Error fetching recordings:", error);
      res.status(500).json({ message: "Failed to fetch recordings" });
    }
  });

  app.post('/api/recordings', isAuthenticated, upload.single('audio'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
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
