-- Migration: Casino Experience Hub Enhancement
-- Adds support for different entry types, promo codes, editorial ratings, and external links

-- Add new columns to casinos table
ALTER TABLE casinos 
  ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'casino' CHECK (entry_type IN ('casino', 'sister-site', 'blog', 'proxy')),
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS promo_code_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS editorial_rating NUMERIC(3, 2) CHECK (editorial_rating >= 0 AND editorial_rating <= 5),
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sister_site_of UUID REFERENCES casinos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_casinos_entry_type ON casinos(entry_type);
CREATE INDEX IF NOT EXISTS idx_casinos_verified ON casinos(verified);
CREATE INDEX IF NOT EXISTS idx_casinos_is_featured ON casinos(is_featured);
CREATE INDEX IF NOT EXISTS idx_casinos_promo_code_expires ON casinos(promo_code_expires_at) WHERE promo_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_casinos_sister_site_of ON casinos(sister_site_of) WHERE sister_site_of IS NOT NULL;

-- Update existing casinos to have entry_type = 'casino' if null
UPDATE casinos SET entry_type = 'casino' WHERE entry_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN casinos.entry_type IS 'Type of entry: casino, sister-site, blog, or proxy';
COMMENT ON COLUMN casinos.promo_code IS 'Exclusive promo code for this entry';
COMMENT ON COLUMN casinos.promo_code_expires_at IS 'Expiration date for the promo code';
COMMENT ON COLUMN casinos.editorial_rating IS 'Editorial rating (0-5) separate from user reviews';
COMMENT ON COLUMN casinos.external_url IS 'External URL for blogs and proxy sites';
COMMENT ON COLUMN casinos.verified IS 'Whether this entry has been verified by editors';
COMMENT ON COLUMN casinos.sister_site_of IS 'Reference to parent casino if this is a sister site';
COMMENT ON COLUMN casinos.is_featured IS 'Whether this entry should be featured prominently';
