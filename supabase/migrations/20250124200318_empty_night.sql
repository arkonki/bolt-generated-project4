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

-- Create parties table if not exists
CREATE TABLE IF NOT EXISTS parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create party_members table if not exists
CREATE TABLE IF NOT EXISTS party_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now()
);

-- Update characters table schema
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

-- Create RLS policies for characters table
CREATE POLICY "Enable read access for character owners and party DMs"
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

CREATE POLICY "Enable insert for authenticated users"
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

-- Create RLS policies for parties table
CREATE POLICY "Enable read access for party members and DMs"
  ON parties
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT party_id FROM party_members
      WHERE character_id IN (
        SELECT id FROM characters WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Enable insert for authenticated users"
  ON parties
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Enable update for party creators"
  ON parties
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create RLS policies for party_members table
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

-- Create RLS policies for notes table
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
