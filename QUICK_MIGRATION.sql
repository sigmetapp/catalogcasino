-- Quick migration: Add slug column to casinos table
-- Copy and paste this into Supabase SQL Editor and run it

-- Step 1: Add slug column
ALTER TABLE casinos ADD COLUMN IF NOT EXISTS slug TEXT;

-- Step 2: Generate slugs for existing casinos (simple version)
UPDATE casinos
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Step 3: Make sure all slugs are unique (handle duplicates)
UPDATE casinos c1
SET slug = c1.slug || '-' || (
  SELECT COUNT(*) 
  FROM casinos c2 
  WHERE c2.slug = c1.slug AND c2.id < c1.id
)
WHERE EXISTS (
  SELECT 1 FROM casinos c2 
  WHERE c2.id != c1.id AND c2.slug = c1.slug
);

-- Step 4: Make slug NOT NULL and add constraints
ALTER TABLE casinos ALTER COLUMN slug SET NOT NULL;

-- Drop constraint if exists, then add it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'casinos' AND constraint_name = 'casinos_slug_unique'
  ) THEN
    ALTER TABLE casinos DROP CONSTRAINT casinos_slug_unique;
  END IF;
END $$;

ALTER TABLE casinos ADD CONSTRAINT casinos_slug_unique UNIQUE (slug);
CREATE INDEX IF NOT EXISTS idx_casinos_slug ON casinos(slug);
