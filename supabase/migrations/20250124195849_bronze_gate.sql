/*
  # Fix Character Schema and Policies

  1. Schema Updates
    - Add missing columns to characters table
    - Fix column names to match TypeScript types
    - Add proper constraints and defaults

  2. Security
    - Update RLS policies for characters table
    - Add necessary indexes
*/

-- Update characters table schema
ALTER TABLE characters 
  ADD COLUMN IF NOT EXISTS magic_school text,
  ADD COLUMN IF NOT EXISTS trained_skills jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS other_skills jsonb DEFAULT '[]'::jsonb,
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

-- Add constraints
ALTER TABLE characters
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN kin SET NOT NULL,
  ALTER COLUMN profession SET NOT NULL,
  ALTER COLUMN age SET NOT NULL,
  ALTER COLUMN attributes SET NOT NULL;

-- Drop existing character policies
DROP POLICY IF EXISTS "Enable read access for character owners" ON characters;
DROP POLICY IF EXISTS "Enable insert for character owners" ON characters;
DROP POLICY IF EXISTS "Enable update for character owners" ON characters;
DROP POLICY IF EXISTS "Enable read access for character owners and party DMs" ON characters;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON characters;
DROP POLICY IF EXISTS "Enable delete for character owners" ON characters;

-- Create new character policies
CREATE POLICY "Enable read access for character owners and party DMs"
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

CREATE POLICY "Enable delete for character owners"
  ON characters
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_profession ON characters(profession);
CREATE INDEX IF NOT EXISTS idx_characters_kin ON characters(kin);
CREATE INDEX IF NOT EXISTS idx_characters_age ON characters(age);
