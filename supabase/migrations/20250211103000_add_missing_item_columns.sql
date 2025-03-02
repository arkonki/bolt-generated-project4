-- Add missing columns to game_items table
ALTER TABLE game_items
ADD COLUMN IF NOT EXISTS armor TEXT,
ADD COLUMN IF NOT EXISTS armor_rating INTEGER,
ADD COLUMN IF NOT EXISTS garment TEXT,
ADD COLUMN IF NOT EXISTS tool TEXT,
ADD COLUMN IF NOT EXISTS vehicle TEXT,
ADD COLUMN IF NOT EXISTS item TEXT,
ADD COLUMN IF NOT EXISTS service TEXT,
ADD COLUMN IF NOT EXISTS comment TEXT;

-- Notify schema changes
NOTIFY pgrst, 'reload schema';
