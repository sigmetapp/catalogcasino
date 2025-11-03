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
  slug TEXT NOT NULL UNIQUE,
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

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_casinos_slug ON casinos(slug);

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

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE casinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

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
