-- Safe migration: Add slug column to existing casinos table
-- This will work even if the column already exists

-- Step 1: Add slug column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'casinos' AND column_name = 'slug'
  ) THEN
    ALTER TABLE casinos ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Step 2: Create a function to generate slug from name
CREATE OR REPLACE FUNCTION generate_slug_from_name(name_text TEXT)
RETURNS TEXT AS $$
DECLARE
  slug_text TEXT;
BEGIN
  -- Convert to lowercase
  slug_text := LOWER(name_text);
  
  -- Replace spaces with hyphens
  slug_text := REPLACE(slug_text, ' ', '-');
  
  -- Remove special characters, keep only alphanumeric and hyphens
  slug_text := REGEXP_REPLACE(slug_text, '[^a-z0-9-]', '', 'g');
  
  -- Remove multiple consecutive hyphens
  slug_text := REGEXP_REPLACE(slug_text, '-+', '-', 'g');
  
  -- Remove leading and trailing hyphens
  slug_text := TRIM(BOTH '-' FROM slug_text);
  
  -- Limit length to 100 characters
  IF LENGTH(slug_text) > 100 THEN
    slug_text := LEFT(slug_text, 100);
    slug_text := RTRIM(slug_text, '-');
  END IF;
  
  -- Ensure slug is not empty
  IF slug_text = '' OR slug_text IS NULL THEN
    slug_text := 'casino';
  END IF;
  
  RETURN slug_text;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Generate slugs for existing casinos (only if NULL or empty)
UPDATE casinos
SET slug = generate_slug_from_name(name)
WHERE slug IS NULL OR slug = '';

-- Step 4: Handle duplicate slugs by appending a number
DO $$
DECLARE
  casino_record RECORD;
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  FOR casino_record IN 
    SELECT id, slug, name 
    FROM casinos 
    WHERE id IN (
      SELECT id FROM casinos 
      WHERE slug IS NOT NULL
      GROUP BY slug 
      HAVING COUNT(*) > 1
    )
    ORDER BY id
  LOOP
    base_slug := casino_record.slug;
    counter := 1;
    new_slug := base_slug || '-' || counter;
    
    -- Find a unique slug
    WHILE EXISTS (SELECT 1 FROM casinos WHERE slug = new_slug AND id != casino_record.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    -- Update with unique slug
    UPDATE casinos SET slug = new_slug WHERE id = casino_record.id;
  END LOOP;
END $$;

-- Step 5: Make slug NOT NULL (only if all records have slugs)
DO $$
BEGIN
  -- Check if all casinos have slugs
  IF NOT EXISTS (SELECT 1 FROM casinos WHERE slug IS NULL OR slug = '') THEN
    -- Make NOT NULL
    ALTER TABLE casinos ALTER COLUMN slug SET NOT NULL;
  END IF;
END $$;

-- Step 6: Add unique constraint (drop first if exists, then add)
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'casinos' 
    AND constraint_name = 'casinos_slug_unique'
  ) THEN
    ALTER TABLE casinos DROP CONSTRAINT casinos_slug_unique;
  END IF;
END $$;

-- Add unique constraint
ALTER TABLE casinos 
ADD CONSTRAINT casinos_slug_unique UNIQUE (slug);

-- Step 7: Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_casinos_slug ON casinos(slug);

-- Step 8: Clean up - drop the temporary function
DROP FUNCTION IF EXISTS generate_slug_from_name(TEXT);

-- Note: This migration is safe to run multiple times
-- It will skip steps if columns/constraints already exist
