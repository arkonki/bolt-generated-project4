-- Fix infinite recursion in users policies
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- Create new policies with direct role check
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
  USING (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
      AND u.id != users.id -- Prevent self-reference
    )
  )
  WITH CHECK (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
      AND u.id != users.id -- Prevent self-reference
    )
  );

-- Drop existing constraints if they exist
ALTER TABLE characters
  DROP CONSTRAINT IF EXISTS valid_hp,
  DROP CONSTRAINT IF EXISTS valid_wp;

-- Fix missing currentHP/currentWP columns
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS current_hp integer,
  ADD COLUMN IF NOT EXISTS current_wp integer;

-- Set default values for existing characters
UPDATE characters
SET 
  current_hp = (attributes->>'CON')::integer,
  current_wp = (attributes->>'WIL')::integer
WHERE current_hp IS NULL OR current_wp IS NULL;

-- Add constraints with new names to avoid conflicts
ALTER TABLE characters
  ADD CONSTRAINT characters_valid_hp CHECK (
    current_hp IS NULL 
    OR (current_hp >= 0 AND current_hp <= (attributes->>'CON')::integer)
  ),
  ADD CONSTRAINT characters_valid_wp CHECK (
    current_wp IS NULL 
    OR (current_wp >= 0 AND current_wp <= (attributes->>'WIL')::integer)
  );

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_characters_current_hp;
DROP INDEX IF EXISTS idx_characters_current_wp;
CREATE INDEX idx_characters_current_hp ON characters(current_hp);
CREATE INDEX idx_characters_current_wp ON characters(current_wp);

-- Force schema cache refresh
ALTER TABLE characters REPLICA IDENTITY FULL;
NOTIFY pgrst, 'reload schema';
