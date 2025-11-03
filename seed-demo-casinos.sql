-- Complete setup: Create schema + Insert 5 demo casino cards in English
-- Execute this file in Supabase SQL Editor
-- This will create all necessary tables and insert demo data

-- ============================================================================
-- STEP 1: CREATE SCHEMA
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create casinos table
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

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  casino_id UUID NOT NULL REFERENCES casinos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_casino_id ON reviews(casino_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_casinos_rating_avg ON casinos(rating_avg);

-- ============================================================================
-- STEP 2: SETUP RLS (Row Level Security)
-- ============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE casinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view casinos" ON casinos;
DROP POLICY IF EXISTS "Only admins can insert casinos" ON casinos;
DROP POLICY IF EXISTS "Only admins can update casinos" ON casinos;
DROP POLICY IF EXISTS "Only admins can delete casinos" ON casinos;
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can delete any review" ON reviews;

-- RLS Policies for users
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for casinos
CREATE POLICY "Anyone can view casinos"
  ON casinos FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert casinos"
  ON casinos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can update casinos"
  ON casinos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can delete casinos"
  ON casinos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = TRUE
    )
  );

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any review"
  ON reviews FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = TRUE
    )
  );

-- ============================================================================
-- STEP 3: CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update casino rating when review is added
CREATE OR REPLACE FUNCTION public.update_casino_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE casinos
  SET
    rating_avg = (
      SELECT COALESCE(AVG(rating)::NUMERIC(3, 2), 0)
      FROM reviews
      WHERE casino_id = NEW.casino_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE casino_id = NEW.casino_id
    ),
    updated_at = NOW()
  WHERE id = NEW.casino_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update casino rating on review insert
DROP TRIGGER IF EXISTS on_review_inserted ON reviews;
CREATE TRIGGER on_review_inserted
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_casino_rating();

-- Function to update casino rating when review is deleted
CREATE OR REPLACE FUNCTION public.update_casino_rating_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE casinos
  SET
    rating_avg = COALESCE((
      SELECT AVG(rating)::NUMERIC(3, 2)
      FROM reviews
      WHERE casino_id = OLD.casino_id
    ), 0),
    rating_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE casino_id = OLD.casino_id
    ),
    updated_at = NOW()
  WHERE id = OLD.casino_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update casino rating on review delete
DROP TRIGGER IF EXISTS on_review_deleted ON reviews;
CREATE TRIGGER on_review_deleted
  AFTER DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_casino_rating_on_delete();

-- ============================================================================
-- STEP 4: INSERT DEMO CASINOS (temporarily disable RLS for insert)
-- ============================================================================

-- Temporarily disable RLS for casinos to allow initial data insertion
ALTER TABLE casinos DISABLE ROW LEVEL SECURITY;

-- Insert demo casinos (only if they don't already exist)
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

-- ============================================================================
-- STEP 5: VERIFY INSERTIONS
-- ============================================================================

-- Show the inserted casinos
SELECT 
  name, 
  license, 
  country, 
  rating_avg, 
  rating_count,
  created_at
FROM casinos 
WHERE name IN (
  'Royal Vegas Casino',
  'Betway Casino',
  'LeoVegas Casino',
  '888 Casino',
  'Casumo Casino'
)
ORDER BY rating_avg DESC;
