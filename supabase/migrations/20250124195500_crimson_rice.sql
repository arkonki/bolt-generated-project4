-- Drop existing character policies
DROP POLICY IF EXISTS "Enable read access for character owners" ON characters;
DROP POLICY IF EXISTS "Enable insert for character owners" ON characters;
DROP POLICY IF EXISTS "Enable update for character owners" ON characters;

-- Update characters table to match the expected structure
ALTER TABLE characters 
  ADD COLUMN IF NOT EXISTS magic_school text,
  ADD COLUMN IF NOT EXISTS trained_skills jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS other_skills jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS spells jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS starting_equipment jsonb DEFAULT '{}'::jsonb;

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
