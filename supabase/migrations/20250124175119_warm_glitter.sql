/*
  # Initial Dragonbane Database Schema

  1. New Tables
    - users
      - id (uuid, primary key)
      - email (text)
      - username (text)
      - created_at (timestamp)
      
    - characters
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - name (text)
      - kin (text)
      - profession (text)
      - age (text)
      - attributes (jsonb)
      - trained_skills (jsonb)
      - other_skills (jsonb)
      - equipment (jsonb)
      - appearance (text)
      - created_at (timestamp)
      
    - parties
      - id (uuid, primary key)
      - name (text)
      - created_by (uuid, foreign key)
      - created_at (timestamp)
      
    - party_members
      - id (uuid, primary key)
      - party_id (uuid, foreign key)
      - character_id (uuid, foreign key)
      - joined_at (timestamp)
      
    - notes
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - character_id (uuid, foreign key, nullable)
      - party_id (uuid, foreign key, nullable)
      - title (text)
      - content (text)
      - is_admin (boolean)
      - created_at (timestamp)
      
    - compendium
      - id (uuid, primary key)
      - title (text)
      - content (text)
      - category (text)
      - created_by (uuid, foreign key)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Characters table
CREATE TABLE characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  kin text NOT NULL,
  profession text NOT NULL,
  age text NOT NULL,
  attributes jsonb NOT NULL,
  trained_skills jsonb NOT NULL,
  other_skills jsonb NOT NULL,
  equipment jsonb NOT NULL,
  appearance text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own characters"
  ON characters
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Parties table
CREATE TABLE parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own parties"
  ON parties
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Party members table
CREATE TABLE party_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now()
);

ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Party members can be managed by party creator"
  ON party_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parties
      WHERE parties.id = party_members.party_id
      AND parties.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM parties
      WHERE parties.id = party_members.party_id
      AND parties.created_by = auth.uid()
    )
  );

-- Notes table
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  party_id uuid REFERENCES parties(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT note_context_check CHECK (
    (character_id IS NOT NULL AND party_id IS NULL) OR
    (character_id IS NULL AND party_id IS NOT NULL) OR
    (character_id IS NULL AND party_id IS NULL)
  )
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own notes"
  ON notes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read admin notes"
  ON notes
  FOR SELECT
  TO authenticated
  USING (is_admin = true);

-- Compendium table
CREATE TABLE compendium (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE compendium ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can CRUD compendium"
  ON compendium
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.email IN ('admin@example.com') -- Replace with actual admin emails
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.email IN ('admin@example.com') -- Replace with actual admin emails
    )
  );

CREATE POLICY "All users can read compendium"
  ON compendium
  FOR SELECT
  TO authenticated
  USING (true);
