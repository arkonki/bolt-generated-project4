-- Drop ALL existing policies first
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

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

-- Create party_members policies
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

-- Create character policies
CREATE POLICY "Enable read access for character owners"
  ON characters
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR id IN (
      SELECT character_id FROM party_members
      WHERE party_id IN (
        SELECT id FROM parties WHERE created_by = auth.uid()
      )
    )
  );

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

-- Create note policies
CREATE POLICY "Enable read access for note owners and party DMs"
  ON notes
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR party_id IN (
      SELECT id FROM parties WHERE created_by = auth.uid()
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
    OR party_id IN (
      SELECT id FROM parties WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR party_id IN (
      SELECT id FROM parties WHERE created_by = auth.uid()
    )
  );

-- Add necessary indexes for performance
CREATE INDEX IF NOT EXISTS idx_party_members_character_id ON party_members(character_id);
CREATE INDEX IF NOT EXISTS idx_party_members_party_id ON party_members(party_id);
CREATE INDEX IF NOT EXISTS idx_parties_created_by ON parties(created_by);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_party_id ON notes(party_id);

-- Create function to handle new user registration with proper error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_username text;
BEGIN
  -- Generate a unique username
  new_username := CASE 
    WHEN NEW.email = 'admin@example.com' THEN 'SystemAdmin'
    ELSE 'user_' || substr(md5(NEW.email || clock_timestamp()::text), 1, 8)
  END;

  -- Insert or update user
  INSERT INTO public.users (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    new_username,
    CASE 
      WHEN NEW.email = 'admin@example.com' THEN 'admin'
      ELSE 'player'
    END
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    id = EXCLUDED.id,
    username = CASE
      WHEN users.email = 'admin@example.com' AND users.username = 'SystemAdmin' 
      THEN 'SystemAdmin'
      ELSE users.username
    END,
    role = CASE 
      WHEN EXCLUDED.email = 'admin@example.com' THEN 'admin'
      ELSE users.role
    END
  WHERE users.email = EXCLUDED.email;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

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
    username = CASE
      WHEN users.username = 'SystemAdmin' THEN 'SystemAdmin'
      ELSE users.username
    END,
    role = 'admin'
  WHERE users.email = 'admin@example.com';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error ensuring admin user exists: %', SQLERRM;
END;
$$;
