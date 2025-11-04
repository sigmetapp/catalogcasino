-- Migration: Add SEO fields (title and meta_description) to casinos table
-- Adds support for custom page titles and meta descriptions for SEO

-- Add new columns to casinos table
ALTER TABLE casinos 
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_casinos_title ON casinos(title) WHERE title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_casinos_meta_description ON casinos(meta_description) WHERE meta_description IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN casinos.title IS 'Custom page title for SEO (overrides default)';
COMMENT ON COLUMN casinos.meta_description IS 'Custom meta description for SEO';
