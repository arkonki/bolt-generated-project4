-- Drop existing spells table if it exists
DROP TABLE IF EXISTS game_spells CASCADE;

-- Create spells table with correct schema
CREATE TABLE game_spells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  school_id uuid REFERENCES magic_schools(id),
  rank integer NOT NULL CHECK (rank >= 0 AND rank <= 3),
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

-- Insert default spells
INSERT INTO game_spells (name, school_id, rank, requirement, casting_time, range, duration, description, willpower_cost)
VALUES 
  -- General Magic (null school_id)
  ('Fetch', null, 0, null, 'Action', '10 meters', 'Instant', 'Make a loose object float to you.', 0),
  ('Flick', null, 0, null, 'Action', '10 meters', 'Instant', 'Give an object or creature a magical flick.', 0),
  ('Light', null, 0, null, 'Action', '10 meters', 'One shift', 'Create a bright light.', 0),
  
  -- Rank 1 General Spells
  ('Arcane Bolt', null, 1, null, 'Action', '20 meters', 'Instant', 'Fire a bolt of pure magic.', 1),
  ('Shield', null, 1, null, 'Action', 'Self', 'One scene', 'Create a magical barrier.', 1),
  ('Detect Magic', null, 1, null, 'Action', '10 meters', 'One scene', 'Sense magical auras.', 1);
