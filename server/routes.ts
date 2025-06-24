import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';
import { db } from './db.js';
import { recordings, babyProfiles, cryReasonDescriptions } from '../shared/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { isAuthenticated } from './auth.js';
import { supabase } from './storage.js';
```