-- Migration: Add currency field to users table
-- Created: 2025-12-02

-- Add currency column with default value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD' NOT NULL;

-- Update any existing users to have USD as currency
UPDATE users SET currency = 'USD' WHERE currency IS NULL OR currency = '';

-- Verify the migration
SELECT id, email, currency FROM users LIMIT 5;
