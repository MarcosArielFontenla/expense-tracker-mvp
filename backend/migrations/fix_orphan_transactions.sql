-- Migration: Fix transactions without accounts
-- Run this in your PostgreSQL database (Neon)

-- 1. First, let's see which users have transactions but no accounts
-- SELECT DISTINCT t."userId" FROM transactions t 
-- LEFT JOIN accounts a ON a."userId" = t."userId" 
-- WHERE a.id IS NULL;

-- 2. Create "General" account for users who don't have any account
INSERT INTO accounts (id, "userId", name, type, balance, currency, color, icon, "isDefault", "isArchived", "createdAt", "updatedAt")
SELECT 
    uuid_generate_v4(),
    u.id,
    'General',
    'bank',
    0,
    COALESCE(u.currency, 'USD'),
    '#3b82f6',
    '🏦',
    true,
    false,
    NOW(),
    NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM accounts a WHERE a."userId" = u.id
);

-- 3. Assign all transactions without accountId to user's default account
UPDATE transactions t
SET "accountId" = (
    SELECT a.id FROM accounts a 
    WHERE a."userId" = t."userId" AND a."isDefault" = true
    LIMIT 1
)
WHERE t."accountId" IS NULL;

-- 4. Recalculate balance for ALL accounts based on their transactions
UPDATE accounts a
SET balance = COALESCE((
    SELECT SUM(
        CASE WHEN t.type = 'income' THEN CAST(t.amount AS DECIMAL) 
             ELSE -CAST(t.amount AS DECIMAL) 
        END
    )
    FROM transactions t
    WHERE t."accountId" = a.id
), 0);

-- 5. Verify the fix
SELECT a.name, a.type, a.balance, 
       (SELECT COUNT(*) FROM transactions t WHERE t."accountId" = a.id) as transaction_count
FROM accounts a
ORDER BY a."createdAt";
