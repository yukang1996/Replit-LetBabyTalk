
-- Migration: Add audioUrl column to recordings table
ALTER TABLE recordings ADD COLUMN audio_url TEXT;
