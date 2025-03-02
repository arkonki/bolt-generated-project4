-- Add missing effect column to game_items table
ALTER TABLE game_items
ADD COLUMN IF NOT EXISTS effect TEXT;

-- Notify schema changes
NOTIFY pgrst, 'reload schema';
