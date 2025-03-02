-- Drop existing constraints and columns to ensure clean state
ALTER TABLE characters
  DROP CONSTRAINT IF EXISTS valid_hp,
  DROP CONSTRAINT IF EXISTS valid_wp;

ALTER TABLE characters
  DROP COLUMN IF EXISTS current_hp,
  DROP COLUMN IF EXISTS current_wp;

-- Add columns with proper constraints
ALTER TABLE characters
  ADD COLUMN current_hp integer,
  ADD COLUMN current_wp integer;

-- Set default values based on attributes
UPDATE characters
SET 
  current_hp = (attributes->>'CON')::integer,
  current_wp = (attributes->>'WIL')::integer
WHERE current_hp IS NULL OR current_wp IS NULL;

-- Add constraints after data is populated
ALTER TABLE characters
  ADD CONSTRAINT valid_hp CHECK (
    current_hp IS NULL 
    OR (current_hp >= 0 AND current_hp <= (attributes->>'CON')::integer)
  ),
  ADD CONSTRAINT valid_wp CHECK (
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
