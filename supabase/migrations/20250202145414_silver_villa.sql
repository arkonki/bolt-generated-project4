-- Create function to handle skill advancement
CREATE OR REPLACE FUNCTION advance_skill(
  character_id uuid,
  skill_name text,
  current_value integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_value integer;
BEGIN
  -- Ensure value doesn't exceed 18
  new_value := LEAST(current_value + 1, 18);
  
  -- Clear marked skills after advancement
  UPDATE characters
  SET experience = jsonb_set(
    experience,
    '{marked_skills}',
    '[]'::jsonb
  )
  WHERE id = character_id;
  
  RETURN new_value;
END;
$$;

-- Create function to mark skill
CREATE OR REPLACE FUNCTION mark_skill(
  character_id uuid,
  skill_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE characters
  SET experience = jsonb_set(
    COALESCE(experience, '{}'::jsonb),
    '{marked_skills}',
    COALESCE(
      experience->'marked_skills',
      '[]'::jsonb
    ) || to_jsonb(skill_name)
  )
  WHERE id = character_id;
END;
$$;

-- Create function to check if roll is success
CREATE OR REPLACE FUNCTION is_roll_success(
  roll_value integer,
  skill_value integer,
  has_boon boolean DEFAULT false,
  has_bane boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- With boon, take lower of two rolls
  IF has_boon THEN
    RETURN roll_value <= skill_value;
  -- With bane, take higher of two rolls
  ELSIF has_bane THEN
    RETURN roll_value <= skill_value;
  -- Normal roll
  ELSE
    RETURN roll_value <= skill_value;
  END IF;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_experience ON characters USING gin (experience);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION advance_skill TO authenticated;
GRANT EXECUTE ON FUNCTION mark_skill TO authenticated;
GRANT EXECUTE ON FUNCTION is_roll_success TO authenticated;
