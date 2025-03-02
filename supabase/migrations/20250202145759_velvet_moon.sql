-- Create heroic abilities table if not exists
CREATE TABLE IF NOT EXISTS heroic_abilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  willpower_cost integer NOT NULL,
  profession text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE heroic_abilities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "allow_read_heroic_abilities"
  ON heroic_abilities
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default heroic abilities
INSERT INTO heroic_abilities (name, description, willpower_cost, profession) VALUES
  ('Veteran', 'Your combat experience allows you to perform devastating attacks.', 3, 'Fighter'),
  ('Companion', 'You have a loyal animal companion that aids you in your adventures.', 3, 'Hunter'),
  ('Backstabbing', 'You can perform devastating attacks when striking from hiding.', 3, 'Thief'),
  ('Master Blacksmith', 'Expert in forging weapons, armor, and metal items.', 3, 'Artisan'),
  ('Master Carpenter', 'Skilled in woodworking, construction, and furniture making.', 3, 'Artisan'),
  ('Master Tanner', 'Specializes in leather working and creating leather goods.', 3, 'Artisan')
ON CONFLICT (name) DO NOTHING;

-- Drop index if exists and create new one
DROP INDEX IF EXISTS idx_heroic_abilities_profession;
CREATE INDEX IF NOT EXISTS idx_heroic_abilities_profession_new ON heroic_abilities(profession);
