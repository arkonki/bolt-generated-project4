/*
  # Fix RLS Policies and Admin User Creation

  1. Security Updates
    - Drop existing policies
    - Create new RLS policies for users table
    - Update policies for party members, characters, and notes
  
  2. User Management
    - Update user registration handling
    - Fix admin user creation to avoid conflicts
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read data" ON users;
DROP POLICY IF EXISTS "Users can update data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new RLS policies for users table
CREATE POLICY "Enable read access for authenticated users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for users based on id"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ))
  WITH CHECK (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Update party_members policy
DROP POLICY IF EXISTS "Party members can be managed by party creator" ON party_members;

CREATE POLICY "Enable read access for party members"
  ON party_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for party creators"
  ON party_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM parties
      WHERE parties.id = party_id
      AND parties.created_by = auth.uid()
    )
  );

-- Fix the characters query
DROP POLICY IF EXISTS "Users can CRUD own characters" ON characters;

CREATE POLICY "Enable read access for character owners"
  ON characters
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM party_members
    WHERE party_members.character_id = characters.id
    AND party_members.party_id IN (
      SELECT id FROM parties WHERE created_by = auth.uid()
    )
  ));

CREATE POLICY "Enable insert for character owners"
  ON characters
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update for character owners"
  ON characters
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Fix the notes query
DROP POLICY IF EXISTS "Players and DMs can CRUD own notes" ON notes;

CREATE POLICY "Enable read access for note owners and party DMs"
  ON notes
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      party_id IN (
        SELECT id FROM parties WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Enable insert for note owners"
  ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update for note owners and party DMs"
  ON notes
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      party_id IN (
        SELECT id FROM parties WHERE created_by = auth.uid()
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (
      party_id IN (
        SELECT id FROM parties WHERE created_by = auth.uid()
      )
    )
  );

-- Create function to handle new user registration with proper error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'admin@example.com' THEN 'SystemAdmin'
      ELSE COALESCE(
        NEW.raw_user_meta_data->>'username',
        'user_' || substr(md5(NEW.email), 1, 8)
      )
    END,
    CASE 
      WHEN NEW.email = 'admin@example.com' THEN 'admin'
      ELSE 'player'
    END
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    id = EXCLUDED.id,
    role = CASE 
      WHEN EXCLUDED.email = 'admin@example.com' THEN 'admin'
      ELSE users.role
    END
  WHERE users.email = EXCLUDED.email;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and continue
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure the mock admin user exists with a unique username
DO $$
BEGIN
  INSERT INTO public.users (id, email, username, role)
  VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@example.com',
    'SystemAdmin',
    'admin'
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    id = EXCLUDED.id,
    username = 'SystemAdmin',
    role = 'admin'
  WHERE users.email = 'admin@example.com';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error ensuring admin user exists: %', SQLERRM;
END;
$$;
