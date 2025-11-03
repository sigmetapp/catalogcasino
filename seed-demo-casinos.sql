-- Seed 5 demo casino cards in English
-- This file can be executed in Supabase SQL editor or via psql
-- It will first create the schema if it doesn't exist, then insert demo data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create casinos table if it doesn't exist
CREATE TABLE IF NOT EXISTS casinos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  bonus TEXT NOT NULL,
  license TEXT NOT NULL,
  description TEXT,
  country TEXT,
  payment_methods TEXT[],
  rating_avg NUMERIC(3, 2) DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table if it doesn't exist (needed for RLS policies)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE casinos ENABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS for casinos table to allow initial data insertion
-- This is safe because we're using IF NOT EXISTS to avoid duplicates
ALTER TABLE casinos DISABLE ROW LEVEL SECURITY;

-- Insert demo casinos (only if they don't exist)
INSERT INTO casinos (name, logo_url, bonus, license, description, country, payment_methods, rating_avg, rating_count)
SELECT 
  'Royal Vegas Casino',
  'https://via.placeholder.com/150?text=Royal+Vegas',
  'Welcome Bonus: $500 + 100 Free Spins',
  'Malta Gaming Authority',
  'Royal Vegas Casino offers a premium gaming experience with over 500 slot games, live dealer tables, and a comprehensive loyalty program. Established in 2000, it has become one of the most trusted online casinos in the industry.',
  'Malta',
  ARRAY['Visa', 'Mastercard', 'PayPal', 'Skrill', 'Neteller', 'Bitcoin'],
  4.5,
  234
WHERE NOT EXISTS (SELECT 1 FROM casinos WHERE name = 'Royal Vegas Casino');

INSERT INTO casinos (name, logo_url, bonus, license, description, country, payment_methods, rating_avg, rating_count)
SELECT 
  'Betway Casino',
  'https://via.placeholder.com/150?text=Betway',
  '100% Match Bonus up to $1,000',
  'UK Gambling Commission',
  'Betway Casino is a leading online casino platform known for its extensive game library, fast payouts, and excellent customer support. The casino features games from top providers and offers a mobile-optimized experience.',
  'United Kingdom',
  ARRAY['Visa', 'Mastercard', 'PayPal', 'Bank Transfer', 'Ethereum'],
  4.7,
  189
WHERE NOT EXISTS (SELECT 1 FROM casinos WHERE name = 'Betway Casino');

INSERT INTO casinos (name, logo_url, bonus, license, description, country, payment_methods, rating_avg, rating_count)
SELECT 
  'LeoVegas Casino',
  'https://via.placeholder.com/150?text=LeoVegas',
  'Up to $1,200 + 120 Free Spins',
  'Malta Gaming Authority',
  'LeoVegas is the "King of Mobile Casino" with an award-winning mobile platform. It offers a wide selection of slots, table games, and live casino options. The casino is known for its quick withdrawals and 24/7 customer service.',
  'Sweden',
  ARRAY['Visa', 'Mastercard', 'PayPal', 'Trustly', 'Zimpler'],
  4.6,
  312
WHERE NOT EXISTS (SELECT 1 FROM casinos WHERE name = 'LeoVegas Casino');

INSERT INTO casinos (name, logo_url, bonus, license, description, country, payment_methods, rating_avg, rating_count)
SELECT 
  '888 Casino',
  'https://via.placeholder.com/150?text=888+Casino',
  'New Player Package: $400 + 88 Free Spins',
  'UK Gambling Commission',
  '888 Casino is one of the oldest and most respected online casinos, operating since 1997. It offers a diverse range of games including exclusive titles, live dealer games, and a comprehensive sportsbook. The platform is available in multiple languages.',
  'United Kingdom',
  ARRAY['Visa', 'Mastercard', 'PayPal', 'Skrill', 'Neteller', 'Apple Pay'],
  4.4,
  278
WHERE NOT EXISTS (SELECT 1 FROM casinos WHERE name = '888 Casino');

INSERT INTO casinos (name, logo_url, bonus, license, description, country, payment_methods, rating_avg, rating_count)
SELECT 
  'Casumo Casino',
  'https://via.placeholder.com/150?text=Casumo',
  'Welcome Bonus: $1,200 + 200 Free Spins',
  'Malta Gaming Authority',
  'Casumo is an innovative casino platform that gamifies the online casino experience. Players earn rewards and level up while playing. The casino features a unique design, fast payments, and a vast selection of games from top providers.',
  'Malta',
  ARRAY['Visa', 'Mastercard', 'PayPal', 'Skrill', 'Trustly', 'Bitcoin'],
  4.8,
  156
WHERE NOT EXISTS (SELECT 1 FROM casinos WHERE name = 'Casumo Casino');

-- Re-enable RLS for casinos table
ALTER TABLE casinos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  -- Policy for viewing casinos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'casinos' 
    AND policyname = 'Anyone can view casinos'
  ) THEN
    CREATE POLICY "Anyone can view casinos"
      ON casinos FOR SELECT
      USING (true);
  END IF;

  -- Policy for inserting casinos (only admins)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'casinos' 
    AND policyname = 'Only admins can insert casinos'
  ) THEN
    CREATE POLICY "Only admins can insert casinos"
      ON casinos FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid() AND users.is_admin = TRUE
        )
      );
  END IF;

  -- Policy for updating casinos (only admins)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'casinos' 
    AND policyname = 'Only admins can update casinos'
  ) THEN
    CREATE POLICY "Only admins can update casinos"
      ON casinos FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid() AND users.is_admin = TRUE
        )
      );
  END IF;

  -- Policy for deleting casinos (only admins)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'casinos' 
    AND policyname = 'Only admins can delete casinos'
  ) THEN
    CREATE POLICY "Only admins can delete casinos"
      ON casinos FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid() AND users.is_admin = TRUE
        )
      );
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_casinos_rating_avg ON casinos(rating_avg);

-- Verify the insertions
SELECT 
  name, 
  license, 
  country, 
  rating_avg, 
  rating_count 
FROM casinos 
WHERE name IN (
  'Royal Vegas Casino',
  'Betway Casino',
  'LeoVegas Casino',
  '888 Casino',
  'Casumo Casino'
)
ORDER BY rating_avg DESC;
