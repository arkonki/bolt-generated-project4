-- Refresh the schema cache
ALTER TABLE characters REPLICA IDENTITY FULL;

-- Ensure the columns exist and have proper constraints
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS current_hp integer,
  ADD COLUMN IF NOT EXISTS current_wp integer;

-- Add constraints to ensure HP and WP don't exceed attribute values
ALTER TABLE characters
  DROP CONSTRAINT IF EXISTS valid_hp,
  DROP CONSTRAINT IF EXISTS valid_wp,
  ADD CONSTRAINT valid_hp CHECK (current_hp IS NULL OR (current_hp >= 0 AND current_hp <= (attributes->>'CON')::integer)),
  ADD CONSTRAINT valid_wp CHECK (current_wp IS NULL OR (current_wp >= 0 AND current_wp <= (attributes->>'WIL')::integer));

-- Set default values for existing characters
UPDATE characters
SET 
  current_hp = COALESCE(current_hp, (attributes->>'CON')::integer),
  current_wp = COALESCE(current_wp, (attributes->>'WIL')::integer);

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_characters_current_hp;
DROP INDEX IF EXISTS idx_characters_current_wp;
CREATE INDEX idx_characters_current_hp ON characters(current_hp);
CREATE INDEX idx_characters_current_wp ON characters(current_wp);

-- Notify the system to refresh the schema cache
NOTIFY pgrst, 'reload schema';
