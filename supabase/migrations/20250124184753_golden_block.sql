/*
  # Fix Authentication Setup

  1. Changes
    - Ensures proper auth schema setup
    - Creates admin user safely
    - Sets up proper RLS policies
    - Adds necessary indexes

  2. Security
    - Maintains RLS policies
    - Ensures data consistency
    - Adds proper constraints
*/

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);

-- Update users table constraints
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_email_key,
ADD CONSTRAINT users_email_key UNIQUE (email);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create admin user safely
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();

  -- Insert into public.users if not exists
  INSERT INTO public.users (
    id,
    email,
    username,
    role
  )
  VALUES (
    new_user_id,
    'arvi@maantoa.ee',
    'Admin',
    'admin'
  )
  ON CONFLICT (email) DO UPDATE
  SET role = 'admin'
  RETURNING id INTO new_user_id;

END $$;
