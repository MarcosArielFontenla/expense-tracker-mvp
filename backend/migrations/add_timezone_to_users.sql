-- Migration: Add timezone field to users table
-- Created: 2025-12-04

-- Add timezone column with default value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires' NOT NULL;

-- Update any existing users to have default timezone
UPDATE users SET timezone = 'America/Argentina/Buenos_Aires' WHERE timezone IS NULL OR timezone = '';

-- Verify the migration
SELECT id, email, currency, timezone FROM users LIMIT 5;
