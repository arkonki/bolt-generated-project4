-- Alter the game_spells table to include new fields

ALTER TABLE game_spells
ADD COLUMN IF NOT EXISTS prerequisite TEXT;

-- Notify schema changes
NOTIFY pgrst, 'reload schema';
