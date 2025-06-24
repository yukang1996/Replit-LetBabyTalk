
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { db } from './db.js';
import { recordings, babyProfiles, cryReasonDescriptions } from '../shared/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { isAuthenticated } from './auth.js';
import { supabase } from './storage.js';

const router = express.Router();

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'recording-' + uniqueSuffix + '.wav');
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept WAV files primarily
    if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/wave' || 
        file.mimetype === 'audio/x-wav' || file.originalname?.endsWith('.wav')) {
      cb(null, true);
    } else {
      cb(new Error('Only WAV files are allowed'), false);
    }
  }
});

// Routes
router.get('/api/baby-profiles', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const profiles = await db
      .select()
      .from(babyProfiles)
      .where(eq(babyProfiles.userId, userId))
      .orderBy(desc(babyProfiles.createdAt));
    
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching baby profiles:', error);
    res.status(500).json({ error: 'Failed to fetch baby profiles' });
  }
});

router.post('/api/baby-profiles', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const { name, birthDate, gender } = req.body;
    
    if (!name || !birthDate) {
      return res.status(400).json({ error: 'Name and birth date are required' });
    }

    const [profile] = await db
      .insert(babyProfiles)
      .values({
        userId,
        name,
        birthDate: new Date(birthDate),
        gender: gender || null,
      })
      .returning();

    res.json(profile);
  } catch (error) {
    console.error('Error creating baby profile:', error);
    res.status(500).json({ error: 'Failed to create baby profile' });
  }
});

router.delete('/api/baby-profiles/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const profileId = parseInt(req.params.id);

    if (isNaN(profileId)) {
      return res.status(400).json({ error: 'Invalid profile ID' });
    }

    const result = await db
      .delete(babyProfiles)
      .where(and(
        eq(babyProfiles.id, profileId),
        eq(babyProfiles.userId, userId)
      ))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting baby profile:', error);
    res.status(500).json({ error: 'Failed to delete baby profile' });
  }
});

// Audio recording endpoints
router.post('/api/recordings', isAuthenticated, upload.single('audio'), async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const duration = parseInt(req.body.duration) || 0;
    const babyProfileId = req.body.babyProfileId ? parseInt(req.body.babyProfileId) : null;
    const timestamp = new Date().toISOString();
    const audioFormat = 'audio/wav';
    const pressing = req.body.pressing === 'true';

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Processing audio file:', req.file.filename);

    // Upload to Supabase Storage if available
    let audioUrl = null;
    if (supabase) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const fileName = `recordings/${userId}/${Date.now()}-${req.file.originalname}`;
        
        const { data, error } = await supabase.storage
          .from('audio-recordings')
          .upload(fileName, fileBuffer, {
            contentType: audioFormat,
            cacheControl: '3600'
          });

        if (error) {
          console.error('Supabase upload error:', error);
        } else {
          const { data: urlData } = supabase.storage
            .from('audio-recordings')
            .getPublicUrl(fileName);
          audioUrl = urlData.publicUrl;
          console.log('File uploaded to Supabase:', audioUrl);
        }
      } catch (uploadError) {
        console.error('Error uploading to Supabase:', uploadError);
      }
    }

    // Call external AI API
    let analysisResult;
    try {
      const formData = new FormData();
      formData.append('audio', fs.createReadStream(req.file.path), {
        filename: req.file.originalname || 'recording.wav',
        contentType: audioFormat
      });

      // Prepare metadata according to API specification
      const metadata = {
        user_id: userId,
        timestamp: timestamp,
        audio_format: audioFormat,
        pressing: pressing === 'true' || pressing === true
      };

      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch('https://api.letbabytalk.com/process_audio', {
        method: 'POST',
        headers: {
          ...formData.getHeaders()
        },
        body: formData,
        timeout: 30000 // 30 seconds timeout
      });

      if (!response.ok) {
        throw new Error(`AI API responded with status: ${response.status}`);
      }

      const aiResponse = await response.json();
      const result = aiResponse.data?.result;

      if (!result) {
        throw new Error('Invalid response format from AI API');
      }

      // Store the full AI response as per requirements
      analysisResult = {
        cryType: result.class, // Store the exact class name
        confidence: result.probs[result.class] || 0,
        recommendations: [], // Will be fetched from database
        rawResult: result // Store complete raw result including probs and show
      };

    } catch (aiError) {
      console.error("AI API Error:", aiError);
      // Fallback to basic analysis if AI API fails
      analysisResult = {
        cryType: 'unknown',
        confidence: 0,
        recommendations: [
          "AI analysis temporarily unavailable",
          "Try common comfort measures",
          "Monitor baby's behavior closely"
        ],
        error: aiError.message
      };
    }

    // Get recommendations from database based on cry type
    if (analysisResult.cryType && analysisResult.cryType !== 'unknown') {
      try {
        const cryReasons = await db
          .select()
          .from(cryReasonDescriptions)
          .where(eq(cryReasonDescriptions.cryType, analysisResult.cryType));
        
        if (cryReasons.length > 0) {
          analysisResult.recommendations = cryReasons.map(reason => reason.description);
        }
      } catch (dbError) {
        console.error('Error fetching cry reasons:', dbError);
      }
    }

    // Store recording in database
    const [recording] = await db
      .insert(recordings)
      .values({
        userId,
        babyProfileId,
        filename: req.file.filename,
        duration,
        audioUrl,
        analysisResult: analysisResult,
        createdAt: new Date()
      })
      .returning();

    // Clean up local file after processing
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError);
    }

    console.log('Recording processed successfully:', recording.id);
    res.json(recording);

  } catch (error) {
    console.error('Error processing recording:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file on error:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Failed to process recording' });
  }
});

router.get('/api/recordings', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const userRecordings = await db
      .select()
      .from(recordings)
      .where(eq(recordings.userId, userId))
      .orderBy(desc(recordings.createdAt));
    
    res.json(userRecordings);
  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

router.get('/api/recordings/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const recordingId = parseInt(req.params.id);

    if (isNaN(recordingId)) {
      return res.status(400).json({ error: 'Invalid recording ID' });
    }

    const [recording] = await db
      .select()
      .from(recordings)
      .where(and(
        eq(recordings.id, recordingId),
        eq(recordings.userId, userId)
      ));

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    res.json(recording);
  } catch (error) {
    console.error('Error fetching recording:', error);
    res.status(500).json({ error: 'Failed to fetch recording' });
  }
});

router.delete('/api/recordings/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const recordingId = parseInt(req.params.id);

    if (isNaN(recordingId)) {
      return res.status(400).json({ error: 'Invalid recording ID' });
    }

    const [recording] = await db
      .select()
      .from(recordings)
      .where(and(
        eq(recordings.id, recordingId),
        eq(recordings.userId, userId)
      ));

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    // Delete from database
    await db
      .delete(recordings)
      .where(and(
        eq(recordings.id, recordingId),
        eq(recordings.userId, userId)
      ));

    // Clean up local file if it exists
    if (recording.filename) {
      const filePath = path.join('uploads', recording.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting recording:', error);
    res.status(500).json({ error: 'Failed to delete recording' });
  }
});

export default router;
