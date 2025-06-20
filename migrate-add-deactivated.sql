
-- Add deactivated column to users table
ALTER TABLE users ADD COLUMN deactivated BOOLEAN DEFAULT FALSE;
