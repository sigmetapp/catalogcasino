-- Migration: Rename 'proxy' entry type to 'review-site'
-- Updates existing proxy entries to review-site and updates the constraint

-- Step 1: Update existing entries
UPDATE casinos 
SET entry_type = 'review-site' 
WHERE entry_type = 'proxy';

-- Step 2: Drop the old constraint
ALTER TABLE casinos 
DROP CONSTRAINT IF EXISTS casinos_entry_type_check;

-- Step 3: Add new constraint with updated values
ALTER TABLE casinos 
ADD CONSTRAINT casinos_entry_type_check 
CHECK (entry_type IN ('casino', 'sister-site', 'blog', 'review-site'));

-- Step 4: Update comment
COMMENT ON COLUMN casinos.entry_type IS 'Type of entry: casino, sister-site, blog, or review-site';
