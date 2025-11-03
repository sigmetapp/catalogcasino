-- Make seosasha@gmail.com an administrator
-- This script updates the is_admin field for the user with the specified email
-- Run this in Supabase SQL Editor

-- Step 1: Update the user's is_admin field
UPDATE public.users
SET is_admin = TRUE
WHERE email = 'seosasha@gmail.com';

-- Step 2: If the user profile doesn't exist yet, create it
-- (This handles the case where the user hasn't logged in yet)
INSERT INTO public.users (id, email, name, is_admin)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) as name,
  TRUE as is_admin
FROM auth.users
WHERE email = 'seosasha@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.users.id
  )
ON CONFLICT (id) DO UPDATE SET is_admin = TRUE;

-- Step 3: Verify the update
SELECT 
  u.id,
  u.email,
  u.name,
  u.is_admin,
  u.created_at
FROM public.users u
WHERE u.email = 'seosasha@gmail.com';
