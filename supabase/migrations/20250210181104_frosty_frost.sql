-- Get magic school IDs first
CREATE OR REPLACE FUNCTION get_magic_school_id(school_name text) 
RETURNS uuid AS $$
DECLARE
  school_id uuid;
BEGIN
  SELECT id INTO school_id FROM magic_schools WHERE name = school_name;
  RETURN school_id;
END;
$$ LANGUAGE plpgsql;

-- Update game_spells to use proper school_id references
UPDATE game_spells
SET school_id = get_magic_school_id('Animism')
WHERE name IN ('Beast Speech', 'Heal', 'Nature''s Path');

UPDATE game_spells
SET school_id = get_magic_school_id('Elementalism')
WHERE name IN ('Elemental Bolt', 'Shield of Elements', 'Control Elements');

UPDATE game_spells
SET school_id = get_magic_school_id('Mentalism')
WHERE name IN ('Mind Read', 'Suggestion', 'Mental Shield');
