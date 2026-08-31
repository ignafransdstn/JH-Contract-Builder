-- Migration: Change isActive (boolean) to status (enum)
-- Date: 2026-02-03
-- Description: Update Users table to use status enum instead of isActive boolean

-- Step 1: Add new status column
ALTER TABLE "Users" 
ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- Step 2: Migrate existing data (isActive true -> 'active', false -> 'deactivate')
UPDATE "Users" 
SET status = CASE 
    WHEN "isActive" = true THEN 'active'
    WHEN "isActive" = false THEN 'deactivate'
    ELSE 'active'
END;

-- Step 3: Make status NOT NULL
ALTER TABLE "Users" 
ALTER COLUMN status SET NOT NULL;

-- Step 4: Drop old isActive column
ALTER TABLE "Users" 
DROP COLUMN "isActive";

-- Step 5: Add CHECK constraint for status values
ALTER TABLE "Users"
ADD CONSTRAINT status_check CHECK (status IN ('active', 'deactivate'));

-- Verification query
-- SELECT id, name, email, status FROM "Users";
