-- Create magic school table
CREATE TABLE magic_schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  key_attribute text NOT NULL,
  base_skills text[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create spells table
CREATE TABLE spells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  school_id uuid REFERENCES magic_schools(id),
  rank integer NOT NULL, -- 0 for tricks, 1-3 for spells
  requirement text,
  casting_time text NOT NULL,
  range text NOT NULL,
  duration text NOT NULL,
  description text NOT NULL,
  willpower_cost integer,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_rank CHECK (rank >= 0 AND rank <= 3)
);

-- Create heroic abilities table
CREATE TABLE heroic_abilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  willpower_cost integer NOT NULL,
  profession_id uuid REFERENCES professions(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_spells_school ON spells(school_id);
CREATE INDEX idx_spells_rank ON spells(rank);
CREATE INDEX idx_heroic_abilities_profession ON heroic_abilities(profession_id);

-- Enable RLS
ALTER TABLE magic_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE heroic_abilities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read access to magic_schools"
  ON magic_schools
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to spells"
  ON spells
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to heroic_abilities"
  ON heroic_abilities
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert magic schools
INSERT INTO magic_schools (name, description, key_attribute, base_skills) VALUES
  ('Animism', 'The magic of life and nature, drawing power from the living world.', 'WIL', 
   ARRAY['Beast Lore', 'Bushcraft', 'Healing', 'Hunting & Fishing']),
  ('Elementalism', 'The magic of the elements, manipulating fire, water, earth, and air.', 'WIL',
   ARRAY['Awareness', 'Languages', 'Myths & Legends', 'Spot Hidden']),
  ('Mentalism', 'The magic of the mind, influencing thoughts and perceptions.', 'WIL',
   ARRAY['Acrobatics', 'Awareness', 'Languages', 'Myths & Legends']);

-- Insert spells
WITH school_ids AS (
  SELECT id, name FROM magic_schools
)
INSERT INTO spells (name, school_id, rank, requirement, casting_time, range, duration, description, willpower_cost)
SELECT 
  s.name,
  sch.id,
  s.rank,
  s.requirement,
  s.casting_time,
  s.range,
  s.duration,
  s.description,
  s.willpower_cost
FROM (
  VALUES
    -- General Magic (null school_id)
    ('Fetch', null, 0, 'None', 'Action', '10 meters', 'Instant', 'Make a loose object (no heavier than weight 1) float to you.', 0),
    ('Flick', null, 0, 'None', 'Action', '10 meters', 'Instant', 'Give an object or creature a magical flick. Inflicts 1 point of damage.', 0),
    ('Light', null, 0, 'None', 'Action', '10 meters', 'One shift', 'Create a bright light illuminating a 10-meter radius.', 0),
    
    -- Animism Spells
    ('Beast Speech', 'Animism', 1, 'None', 'Action', '10 meters', 'One scene', 'Communicate with a beast or monster.', 1),
    ('Heal', 'Animism', 1, 'None', 'Action', 'Touch', 'Instant', 'Heal 1D6 HP to a living creature.', 1),
    ('Nature''s Path', 'Animism', 1, 'None', 'Action', 'Self', 'One scene', 'Navigate through wilderness without leaving tracks.', 1),
    
    -- Elementalism Spells
    ('Elemental Bolt', 'Elementalism', 1, 'None', 'Action', '20 meters', 'Instant', 'Fire a bolt of elemental energy dealing 1D8 damage.', 1),
    ('Shield of Elements', 'Elementalism', 1, 'None', 'Action', 'Self', 'One scene', 'Gain +2 Armor Rating against elemental damage.', 1),
    ('Control Elements', 'Elementalism', 1, 'None', 'Action', '10 meters', 'One scene', 'Manipulate small amounts of an element.', 1),
    
    -- Mentalism Spells
    ('Mind Read', 'Mentalism', 1, 'None', 'Action', '10 meters', 'Instant', 'Read surface thoughts of one creature.', 1),
    ('Suggestion', 'Mentalism', 1, 'None', 'Action', '10 meters', 'One scene', 'Plant a subtle suggestion in a creature''s mind.', 1),
    ('Mental Shield', 'Mentalism', 1, 'None', 'Action', 'Self', 'One scene', 'Gain resistance to mental attacks and influence.', 1)
) AS s(name, school, rank, requirement, casting_time, range, duration, description, willpower_cost)
LEFT JOIN school_ids sch ON sch.name = s.school;

-- Insert heroic abilities
WITH profession_ids AS (
  SELECT id, name FROM professions
)
INSERT INTO heroic_abilities (name, description, willpower_cost, profession_id)
SELECT 
  h.name,
  h.description,
  h.willpower_cost,
  p.id
FROM (
  VALUES
    ('Veteran', 'Your combat experience allows you to perform devastating attacks.', 3,
     'Fighter'),
    ('Companion', 'You have a loyal animal companion that aids you in your adventures.', 3,
     'Hunter'),
    ('Backstabbing', 'You can perform devastating attacks when striking from hiding.', 3,
     'Thief'),
    ('Master Blacksmith', 'Expert in forging weapons, armor, and metal items.', 3,
     'Artisan'),
    ('Master Carpenter', 'Skilled in woodworking, construction, and furniture making.', 3,
     'Artisan'),
    ('Master Tanner', 'Specializes in leather working and creating leather goods.', 3,
     'Artisan')
) AS h(name, description, willpower_cost, profession)
JOIN profession_ids p ON p.name = h.profession;

-- Add magic school reference to professions
ALTER TABLE professions
ADD COLUMN magic_school_id uuid REFERENCES magic_schools(id);

-- Update mage profession with magic schools
UPDATE professions p
SET magic_school_id = ms.id
FROM magic_schools ms
WHERE p.name = 'Mage'
  AND ms.name = 'Animism';
