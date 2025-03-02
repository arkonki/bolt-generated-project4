-- Create a mock character
INSERT INTO characters (
  id,
  user_id,
  name,
  kin,
  profession,
  magic_school,
  age,
  attributes,
  trained_skills,
  other_skills,
  equipment,
  appearance,
  conditions,
  spells,
  experience,
  starting_equipment
) VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000',
  'Thorgrim Stonefist',
  'Dwarf',
  'Fighter',
  null,
  'Adult',
  '{
    "STR": 16,
    "CON": 14,
    "AGL": 12,
    "INT": 10,
    "WIL": 12,
    "CHA": 8
  }',
  ARRAY[
    'Axes',
    'Brawling',
    'Hammers',
    'Evade',
    'Spears',
    'Swords'
  ],
  ARRAY[
    'Awareness',
    'Spot Hidden',
    'Beast Lore',
    'Crafting'
  ],
  '{
    "inventory": [],
    "equipped": {
      "weapons": []
    },
    "money": {
      "gold": 0,
      "silver": 5,
      "copper": 0
    }
  }',
  'A stout, muscular dwarf with a thick braided beard and battle-worn armor. Carries himself with the confidence of a seasoned warrior.',
  '{
    "exhausted": false,
    "sickly": false,
    "dazed": false,
    "angry": false,
    "scared": false,
    "disheartened": false
  }',
  null,
  '{
    "marked_skills": []
  }',
  '{
    "option": 1,
    "items": [
      "Broadsword",
      "Small Shield",
      "Chainmail",
      "Torch",
      "Flint & Tinder",
      "D6 Food Rations",
      "D6 Silver"
    ]
  }'
);
