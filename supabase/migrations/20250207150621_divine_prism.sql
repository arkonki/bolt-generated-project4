-- Create game data tables

-- Items table
CREATE TABLE game_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  cost text NOT NULL,
  supply text NOT NULL,
  weight numeric NOT NULL,
  effect text,
  armor_rating integer,
  grip text,
  strength_requirement integer,
  range text,
  damage text,
  durability integer,
  features text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Spells table
CREATE TABLE game_spells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  school text,
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

-- Heroic abilities table
CREATE TABLE game_heroic_abilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  profession text NOT NULL,
  description text NOT NULL,
  willpower_cost integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Character items junction table
CREATE TABLE character_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  item_id uuid REFERENCES game_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  equipped boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

-- Character spells junction table
CREATE TABLE character_spells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  spell_id uuid REFERENCES game_spells(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Character heroic abilities junction table
CREATE TABLE character_heroic_abilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  ability_id uuid REFERENCES game_heroic_abilities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Party inventory table
CREATE TABLE party_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid REFERENCES parties(id) ON DELETE CASCADE,
  item_id uuid REFERENCES game_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

-- Party inventory log table
CREATE TABLE party_inventory_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid REFERENCES parties(id) ON DELETE CASCADE,
  item_id uuid REFERENCES game_items(id) ON DELETE CASCADE,
  from_type text NOT NULL CHECK (from_type IN ('party', 'character')),
  from_id uuid NOT NULL,
  to_type text NOT NULL CHECK (to_type IN ('party', 'character')),
  to_id uuid NOT NULL,
  quantity integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE game_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_heroic_abilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_heroic_abilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_inventory_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Game items policies
CREATE POLICY "Allow read access to game_items"
  ON game_items FOR SELECT
  TO authenticated
  USING (true);

-- Game spells policies
CREATE POLICY "Allow read access to game_spells"
  ON game_spells FOR SELECT
  TO authenticated
  USING (true);

-- Game heroic abilities policies
CREATE POLICY "Allow read access to game_heroic_abilities"
  ON game_heroic_abilities FOR SELECT
  TO authenticated
  USING (true);

-- Character items policies
CREATE POLICY "Allow read access to character_items"
  ON character_items FOR SELECT
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
    OR character_id IN (
      SELECT character_id FROM party_members
      WHERE party_id IN (
        SELECT id FROM parties WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Allow insert/update to character_items"
  ON character_items FOR ALL
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- Character spells policies
CREATE POLICY "Allow read access to character_spells"
  ON character_spells FOR SELECT
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
    OR character_id IN (
      SELECT character_id FROM party_members
      WHERE party_id IN (
        SELECT id FROM parties WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Allow insert/update to character_spells"
  ON character_spells FOR ALL
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- Character heroic abilities policies
CREATE POLICY "Allow read access to character_heroic_abilities"
  ON character_heroic_abilities FOR SELECT
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
    OR character_id IN (
      SELECT character_id FROM party_members
      WHERE party_id IN (
        SELECT id FROM parties WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Allow insert/update to character_heroic_abilities"
  ON character_heroic_abilities FOR ALL
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- Party inventory policies
CREATE POLICY "Allow read access to party_inventory"
  ON party_inventory FOR SELECT
  TO authenticated
  USING (
    party_id IN (
      SELECT id FROM parties WHERE created_by = auth.uid()
    )
    OR party_id IN (
      SELECT party_id FROM party_members
      WHERE character_id IN (
        SELECT id FROM characters WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Allow insert/update to party_inventory"
  ON party_inventory FOR ALL
  TO authenticated
  USING (
    party_id IN (
      SELECT id FROM parties WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    party_id IN (
      SELECT id FROM parties WHERE created_by = auth.uid()
    )
  );

-- Party inventory log policies
CREATE POLICY "Allow read access to party_inventory_log"
  ON party_inventory_log FOR SELECT
  TO authenticated
  USING (
    party_id IN (
      SELECT id FROM parties WHERE created_by = auth.uid()
    )
    OR party_id IN (
      SELECT party_id FROM party_members
      WHERE character_id IN (
        SELECT id FROM characters WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Allow insert to party_inventory_log"
  ON party_inventory_log FOR INSERT
  TO authenticated
  WITH CHECK (
    party_id IN (
      SELECT id FROM parties WHERE created_by = auth.uid()
    )
    OR (
      from_type = 'character' AND from_id IN (
        SELECT id FROM characters WHERE user_id = auth.uid()
      )
    )
    OR (
      to_type = 'character' AND to_id IN (
        SELECT id FROM characters WHERE user_id = auth.uid()
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_character_items_character ON character_items(character_id);
CREATE INDEX idx_character_items_item ON character_items(item_id);
CREATE INDEX idx_character_spells_character ON character_spells(character_id);
CREATE INDEX idx_character_spells_spell ON character_spells(spell_id);
CREATE INDEX idx_character_abilities_character ON character_heroic_abilities(character_id);
CREATE INDEX idx_character_abilities_ability ON character_heroic_abilities(ability_id);
CREATE INDEX idx_party_inventory_party ON party_inventory(party_id);
CREATE INDEX idx_party_inventory_item ON party_inventory(item_id);
CREATE INDEX idx_party_inventory_log_party ON party_inventory_log(party_id);
CREATE INDEX idx_party_inventory_log_item ON party_inventory_log(item_id);
CREATE INDEX idx_party_inventory_log_from ON party_inventory_log(from_type, from_id);
CREATE INDEX idx_party_inventory_log_to ON party_inventory_log(to_type, to_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_game_items_updated_at
  BEFORE UPDATE ON game_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_spells_updated_at
  BEFORE UPDATE ON game_spells
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_heroic_abilities_updated_at
  BEFORE UPDATE ON game_heroic_abilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
