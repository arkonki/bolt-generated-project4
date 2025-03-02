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

-- Update characters table schema to use text arrays for skills
ALTER TABLE characters 
  DROP COLUMN IF EXISTS trained_skills,
  DROP COLUMN IF EXISTS other_skills,
  ADD COLUMN IF NOT EXISTS trained_skills text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS other_skills text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS magic_school text,
  ADD COLUMN IF NOT EXISTS equipment jsonb DEFAULT '{
    "inventory": [],
    "equipped": {
      "weapons": []
    },
    "money": {
      "gold": 0,
      "silver": 0,
      "copper": 0
    }
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS conditions jsonb DEFAULT '{
    "exhausted": false,
    "sickly": false,
    "dazed": false,
    "angry": false,
    "scared": false,
    "disheartened": false
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS spells jsonb DEFAULT null,
  ADD COLUMN IF NOT EXISTS experience jsonb DEFAULT '{
    "marked_skills": []
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS starting_equipment jsonb DEFAULT null;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "users_read_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_policy"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "users_update_policy"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ))
  WITH CHECK (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Create RLS policies for characters table
CREATE POLICY "characters_read_policy"
  ON characters
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR id IN (
      SELECT party_members.character_id 
      FROM party_members 
      JOIN parties ON parties.id = party_members.party_id 
      WHERE parties.created_by = auth.uid()
    )
  );

CREATE POLICY "characters_insert_policy"
  ON characters
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "characters_update_policy"
  ON characters
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "characters_delete_policy"
  ON characters
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create RLS policies for parties table
CREATE POLICY "parties_read_policy"
  ON parties
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "parties_insert_policy"
  ON parties
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "parties_update_policy"
  ON parties
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create RLS policies for party_members table
CREATE POLICY "party_members_read_policy"
  ON party_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "party_members_insert_policy"
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

-- Create RLS policies for notes table
CREATE POLICY "notes_read_policy"
  ON notes
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR party_id IN (
      SELECT id FROM parties WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "notes_insert_policy"
  ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notes_update_policy"
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
BEGIN
  INSERT INTO public.users (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'user_' || substr(md5(NEW.email || clock_timestamp()::text), 1, 8)
    ),
    CASE 
      WHEN NEW.email = 'admin@example.com' THEN 'admin'
      ELSE 'player'
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    role = CASE 
      WHEN EXCLUDED.email = 'admin@example.com' THEN 'admin'
      ELSE users.role
    END;
  
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

-- Ensure the mock admin user exists
DO $$
BEGIN
  INSERT INTO public.users (id, email, username, role)
  VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@example.com',
    'SystemAdmin',
    'admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    username = 'SystemAdmin',
    role = 'admin';
END;
$$;
