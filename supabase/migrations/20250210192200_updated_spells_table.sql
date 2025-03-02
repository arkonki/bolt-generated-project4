-- Drop existing spells table if it exists
DROP TABLE IF EXISTS game_spells CASCADE;

-- Create spells table with correct schema
CREATE TABLE game_spells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  school_id uuid REFERENCES magic_schools(id),
  rank integer NOT NULL CHECK (rank >= 0 AND rank <= 10),
  requirement text,
  casting_time text NOT NULL,
  range text NOT NULL,
  duration text NOT NULL,
  description text NOT NULL,
  willpower_cost integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE game_spells ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read access to game_spells"
  ON game_spells FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX idx_game_spells_school ON game_spells(school_id);
CREATE INDEX idx_game_spells_rank ON game_spells(rank);
