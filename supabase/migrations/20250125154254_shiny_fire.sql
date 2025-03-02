-- Create tables for static data
CREATE TABLE equipment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES equipment_categories(id),
  name text NOT NULL,
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
  created_at timestamptz DEFAULT now()
);

CREATE TABLE kin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  ability_name text NOT NULL,
  ability_description text NOT NULL,
  ability_willpower_points integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE professions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  key_attribute text NOT NULL,
  skills text[] NOT NULL,
  heroic_ability text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_equipment_category ON equipment(category_id);
CREATE INDEX idx_equipment_name ON equipment(name);
CREATE INDEX idx_kin_name ON kin(name);
CREATE INDEX idx_professions_name ON professions(name);

-- Enable RLS
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE kin ENABLE ROW LEVEL SECURITY;
ALTER TABLE professions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for read access
CREATE POLICY "Allow read access to equipment_categories"
  ON equipment_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to equipment"
  ON equipment
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to kin"
  ON kin
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to professions"
  ON professions
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert equipment categories
INSERT INTO equipment_categories (name) VALUES
  ('armor'),
  ('helmets'),
  ('melee_weapons'),
  ('ranged_weapons'),
  ('clothes'),
  ('musical_instruments'),
  ('trade_goods'),
  ('studies_and_magic'),
  ('light_sources'),
  ('tools'),
  ('containers'),
  ('medicine'),
  ('hunting_and_fishing'),
  ('means_of_travel'),
  ('animals');

-- Insert equipment data
WITH category_ids AS (
  SELECT id, name FROM equipment_categories
)
INSERT INTO equipment (category_id, name, cost, supply, weight, effect, armor_rating)
SELECT 
  c.id,
  e.name,
  e.cost,
  e.supply,
  e.weight::numeric,
  e.effect,
  e.armor_rating::integer
FROM (
  VALUES
    ('armor', 'Leather', '2 gold', 'Common', 1, 'None', 1),
    ('armor', 'Studded Leather', '10 gold', 'Uncommon', 2, 'Bane on SNEAKING rolls.', 2),
    ('armor', 'Chainmail', '50 gold', 'Uncommon', 3, 'Bane on EVADE and SNEAKING rolls.', 4),
    ('armor', 'Plate Armor', '500 gold', 'Rare', 4, 'Bane on ACROBATICS, EVADE, and SNEAKING rolls.', 6)
) AS e(category, name, cost, supply, weight, effect, armor_rating)
JOIN category_ids c ON c.name = e.category;

-- Insert kin data
INSERT INTO kin (name, description, ability_name, ability_description, ability_willpower_points)
VALUES
  ('Human', 'Humans are the last-born. The other kin have songs and legends about times before the dawn of humanity. Today, humans are widespread, with many as peasants and others as warriors or adventurers.', 'Adaptive', 'When rolling for a skill, you can choose another skill. The GM has the final word but should be lenient.', 3),
  ('Halfling', 'Halflings are short humanoids, often living in hilly farmlands in earthen dwellings. Modest and amiable, they sometimes seek adventures despite their vulnerability.', 'Hard to Catch', 'Activate this ability when dodging an attack to get a boon to the Evade roll.', 3),
  ('Dwarf', 'Dwarves are ancient and proud, connected with the bedrock. They are skilled blacksmiths and fierce warriors, respected for their crafting skills.', 'Unforgiving', 'Activate this ability when attacking someone who harmed you before to gain a boon to the roll.', 3),
  ('Elf', 'Elves are ancient beings who revere the stars. They are introspective and guided by metaphysical concerns, including powerful warriors known for their skill in battle.', 'Inner Peace', 'During meditation, heal additional HP and WP, and recover from an additional condition. Unresponsive during meditation.', null),
  ('Mallard', 'Mallards are feathered humanoids known for their temper and trade acumen. They are common in marketplaces and sometimes live as brigands or mercenaries.', 'Ill-Tempered', 'Activate this ability for a boon to the roll, but you become Angry. Cannot be used for INT-based rolls.', 3),
  ('Wolfkin', 'Wolfkin are wild, highly intelligent, and known for their deep connection to nature. They are fierce hunters and skilled pathfinders.', 'Hunting Instincts', 'Designate a creature as prey. Follow its scent and gain a boon to attacks against it by spending WP.', 3);

-- Insert profession data
INSERT INTO professions (name, description, key_attribute, skills, heroic_ability)
VALUES
  ('Fighter', 'Fighters live by the sword and specialize in weapon proficiency. While some are haunted by violence, others are driven by pride.', 'STR', ARRAY['Axes', 'Bows', 'Brawling', 'Crossbows', 'Evade', 'Hammers', 'Spears', 'Swords'], 'Veteran'),
  ('Mage', 'Mages control ancient forces through various schools, including Animism, Elementalism, and Mentalism.', 'WIL', ARRAY['Animism', 'Beast Lore', 'Bushcraft', 'Evade', 'Healing', 'Hunting & Fishing', 'Sneaking', 'Staves'], 'As a mage, you don''t get a starting heroic ability. Instead, you get your magic.'),
  ('Hunter', 'Hunters live for the hunt and respect their prey. They find peace in the wild, gathering strength from nature.', 'AGL', ARRAY['Acrobatics', 'Awareness', 'Bows', 'Bushcraft', 'Hunting & Fishing', 'Knives', 'Slings', 'Sneaking'], 'Companion'),
  ('Thief', 'Thieves specialize in acquiring others'' property. They operate by their own code and are often members of guilds.', 'AGL', ARRAY['Acrobatics', 'Awareness', 'Bluffing', 'Evade', 'Knives', 'Sleight of Hand', 'Sneaking', 'Spot Hidden'], 'Backstabbing');
