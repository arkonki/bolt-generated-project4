-- Add new columns to game_items table
ALTER TABLE game_items
ADD COLUMN IF NOT EXISTS armor_rating integer,
ADD COLUMN IF NOT EXISTS grip text,
ADD COLUMN IF NOT EXISTS strength_requirement integer,
ADD COLUMN IF NOT EXISTS range text,
ADD COLUMN IF NOT EXISTS damage text,
ADD COLUMN IF NOT EXISTS durability integer,
ADD COLUMN IF NOT EXISTS features text[];

-- Drop existing columns that are no longer needed
ALTER TABLE game_items
DROP COLUMN IF EXISTS effect;

-- Add new column for item type
ALTER TABLE game_items
ADD COLUMN IF NOT EXISTS item_type text;

-- Notify schema changes
NOTIFY pgrst, 'reload schema';
