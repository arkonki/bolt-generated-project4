-- Add current HP and WP columns to characters table
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS current_hp integer,
  ADD COLUMN IF NOT EXISTS current_wp integer;

-- Add constraints to ensure HP and WP don't exceed attribute values
ALTER TABLE characters
  ADD CONSTRAINT valid_hp CHECK (current_hp IS NULL OR (current_hp >= 0 AND current_hp <= (attributes->>'CON')::integer)),
  ADD CONSTRAINT valid_wp CHECK (current_wp IS NULL OR (current_wp >= 0 AND current_wp <= (attributes->>'WIL')::integer));

-- Set default values for existing characters
UPDATE characters
SET 
  current_hp = COALESCE(current_hp, (attributes->>'CON')::integer),
  current_wp = COALESCE(current_wp, (attributes->>'WIL')::integer);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_current_hp ON characters(current_hp);
CREATE INDEX IF NOT EXISTS idx_characters_current_wp ON characters(current_wp);
