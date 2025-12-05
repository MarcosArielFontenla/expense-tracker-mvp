-- Migration: Create accounts table and update transactions
-- Run this migration on your PostgreSQL database

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'debit_card', 'savings')),
    balance DECIMAL(18,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'ARS',
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(10) DEFAULT '💰',
    "isDefault" BOOLEAN DEFAULT false,
    "isArchived" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts("userId");

-- Add accountId column to transactions (nullable initially for migration)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "accountId" UUID REFERENCES accounts(id);

-- Create default account for each existing user
INSERT INTO accounts (id, "userId", name, type, balance, currency, color, icon, "isDefault")
SELECT 
    uuid_generate_v4(),
    id,
    'General',
    'bank',
    0,
    COALESCE(currency, 'USD'),
    '#3b82f6',
    '🏦',
    true
FROM users
WHERE id NOT IN (SELECT DISTINCT "userId" FROM accounts);

-- Update existing transactions to use the default account
UPDATE transactions t
SET "accountId" = (
    SELECT a.id FROM accounts a 
    WHERE a."userId" = t."userId" AND a."isDefault" = true
    LIMIT 1
)
WHERE t."accountId" IS NULL;

-- Update account balances based on existing transactions
UPDATE accounts a
SET balance = COALESCE((
    SELECT SUM(
        CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END
    )
    FROM transactions t
    WHERE t."accountId" = a.id
), 0);

-- After migration is complete and verified, you can make accountId NOT NULL:
-- ALTER TABLE transactions ALTER COLUMN "accountId" SET NOT NULL;
