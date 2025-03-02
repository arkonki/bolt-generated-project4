-- Initial data migration

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
  ('animals')
ON CONFLICT (name) DO NOTHING;

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
JOIN category_ids c ON c.name = e.category
ON CONFLICT DO NOTHING;

-- Insert kin data
INSERT INTO kin (name, description, ability_name, ability_description, ability_willpower_points)
VALUES
  ('Human', 'Humans are the last-born. The other kin have songs and legends about times before the dawn of humanity.', 'Adaptive', 'When rolling for a skill, you can choose another skill.', 3),
  ('Halfling', 'Halflings are short humanoids, often living in hilly farmlands in earthen dwellings.', 'Hard to Catch', 'Activate this ability when dodging an attack to get a boon to the Evade roll.', 3),
  ('Dwarf', 'Dwarves are ancient and proud, connected with the bedrock.', 'Unforgiving', 'Activate this ability when attacking someone who harmed you before to gain a boon to the roll.', 3),
  ('Elf', 'Elves are ancient beings who revere the stars.', 'Inner Peace', 'During meditation, heal additional HP and WP, and recover from an additional condition.', null),
  ('Mallard', 'Mallards are feathered humanoids known for their temper and trade acumen.', 'Ill-Tempered', 'Activate this ability for a boon to the roll, but you become Angry.', 3),
  ('Wolfkin', 'Wolfkin are wild, highly intelligent, and known for their deep connection to nature.', 'Hunting Instincts', 'Designate a creature as prey. Follow its scent and gain a boon to attacks.', 3)
ON CONFLICT (name) DO NOTHING;

-- Insert magic schools
INSERT INTO magic_schools (name, description, key_attribute, base_skills)
VALUES
  ('Animism', 'The magic of life and nature.', 'WIL', ARRAY['Beast Lore', 'Bushcraft', 'Healing', 'Hunting & Fishing']),
  ('Elementalism', 'The magic of the elements.', 'WIL', ARRAY['Awareness', 'Languages', 'Myths & Legends', 'Spot Hidden']),
  ('Mentalism', 'The magic of the mind.', 'WIL', ARRAY['Acrobatics', 'Awareness', 'Languages', 'Myths & Legends'])
ON CONFLICT (name) DO NOTHING;

-- Insert professions
INSERT INTO professions (name, description, key_attribute, skills, heroic_ability)
VALUES
  ('Fighter', 'Fighters live by the sword and specialize in weapon proficiency.', 'STR', 
   ARRAY['Axes', 'Bows', 'Brawling', 'Crossbows', 'Evade', 'Hammers', 'Spears', 'Swords'], 'Veteran'),
  ('Mage', 'Mages control ancient forces through various schools.', 'WIL',
   ARRAY['Animism', 'Beast Lore', 'Bushcraft', 'Evade', 'Healing', 'Hunting & Fishing', 'Sneaking', 'Staves'],
   'As a mage, you don''t get a starting heroic ability. Instead, you get your magic.'),
  ('Hunter', 'Hunters live for the hunt and respect their prey.', 'AGL',
   ARRAY['Acrobatics', 'Awareness', 'Bows', 'Bushcraft', 'Hunting & Fishing', 'Knives', 'Slings', 'Sneaking'],
   'Companion'),
  ('Thief', 'Thieves specialize in acquiring others'' property.', 'AGL',
   ARRAY['Acrobatics', 'Awareness', 'Bluffing', 'Evade', 'Knives', 'Sleight of Hand', 'Sneaking', 'Spot Hidden'],
   'Backstabbing')
ON CONFLICT (name) DO NOTHING;

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
    ('Fetch', null, 0, 'None', 'Action', '10 meters', 'Instant', 'Make a loose object float to you.', 0),
    ('Flick', null, 0, 'None', 'Action', '10 meters', 'Instant', 'Give an object or creature a magical flick.', 0),
    ('Light', null, 0, 'None', 'Action', '10 meters', 'One shift', 'Create a bright light.', 0),
    ('Beast Speech', 'Animism', 1, 'None', 'Action', '10 meters', 'One scene', 'Communicate with a beast.', 1),
    ('Heal', 'Animism', 1, 'None', 'Action', 'Touch', 'Instant', 'Heal 1D6 HP to a living creature.', 1),
    ('Elemental Bolt', 'Elementalism', 1, 'None', 'Action', '20 meters', 'Instant', 'Fire a bolt of energy.', 1),
    ('Mind Read', 'Mentalism', 1, 'None', 'Action', '10 meters', 'Instant', 'Read surface thoughts.', 1)
) AS s(name, school, rank, requirement, casting_time, range, duration, description, willpower_cost)
LEFT JOIN school_ids sch ON sch.name = s.school
ON CONFLICT DO NOTHING;

-- Insert heroic abilities
INSERT INTO heroic_abilities (name, description, willpower_cost, profession)
VALUES
  ('Veteran', 'Your combat experience allows you to perform devastating attacks.', 3, 'Fighter'),
  ('Companion', 'You have a loyal animal companion that aids you in your adventures.', 3, 'Hunter'),
  ('Backstabbing', 'You can perform devastating attacks when striking from hiding.', 3, 'Thief')
ON CONFLICT (name) DO NOTHING;
