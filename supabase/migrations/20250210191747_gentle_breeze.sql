-- Update spell rank limit to 10

-- First drop the existing constraint
ALTER TABLE game_spells 
  DROP CONSTRAINT IF EXISTS game_spells_rank_check;

-- Add new constraint for ranks 0-10
ALTER TABLE game_spells
  ADD CONSTRAINT game_spells_rank_check 
  CHECK (rank >= 0 AND rank <= 10);

-- Update the rank column description
COMMENT ON COLUMN game_spells.rank IS 'Spell rank (0 for tricks, 1-10 for spells)';

-- Create index for better performance on rank queries
DROP INDEX IF EXISTS idx_game_spells_rank;
CREATE INDEX idx_game_spells_rank ON game_spells(rank);

-- Notify schema changes
NOTIFY pgrst, 'reload schema';
