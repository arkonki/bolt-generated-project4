-- Drop existing game_items table
DROP TABLE IF EXISTS game_items CASCADE;

-- Create game_items table with all possible columns
CREATE TABLE game_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'ARMOR & HELMETS', 'MELEE WEAPONS', 'RANGED WEAPONS', 'CLOTHES',
    'MUSICAL INSTRUMENTS', 'TRADE GOODS', 'STUDIES & MAGIC', 'LIGHT SOURCES',
    'TOOLS', 'CONTAINERS', 'MEDICINE', 'SERVICES', 'HUNTING & FISHING',
    'MEANS OF TRAVEL', 'ANIMALS'
  )),
  cost TEXT,
  supply TEXT,
  weight NUMERIC,
  effect TEXT,
  armor_rating INTEGER,
  grip TEXT,
  str INTEGER,
  range TEXT,
  damage TEXT,
  durability INTEGER,
  features TEXT[],
  animal TEXT,
  comment TEXT,
  garment TEXT,
  tool TEXT,
  vehicle TEXT,
  item TEXT,
  service TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE game_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read access to game_items"
  ON game_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access for admin users"
  ON game_items FOR INSERT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Allow update access for admin users"
  ON game_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Allow delete access for admin users"
  ON game_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_game_items_name ON game_items(name);
CREATE INDEX IF NOT EXISTS idx_game_items_category ON game_items(category);
