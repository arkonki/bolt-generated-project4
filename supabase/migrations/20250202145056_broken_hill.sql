-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- Create new policies that avoid recursion
CREATE POLICY "enable_read_for_authenticated"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_insert_for_authenticated"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create a materialized view to cache admin status
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_users AS
SELECT id
FROM users
WHERE role = 'admin';

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_id_idx ON admin_users(id);

-- Create policy using the materialized view
CREATE POLICY "enable_update_for_self_and_admins"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- Create function to refresh admin cache
CREATE OR REPLACE FUNCTION refresh_admin_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_users;
  RETURN NULL;
END;
$$;

-- Create trigger to refresh admin cache
DROP TRIGGER IF EXISTS refresh_admin_users_trigger ON users;
CREATE TRIGGER refresh_admin_users_trigger
  AFTER INSERT OR UPDATE OF role OR DELETE
  ON users
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_admin_users();

-- Ensure character columns exist with correct constraints
DO $$
BEGIN
  -- Drop existing constraints if they exist
  ALTER TABLE characters
    DROP CONSTRAINT IF EXISTS characters_valid_hp,
    DROP CONSTRAINT IF EXISTS characters_valid_wp;

  -- Add columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'characters' 
    AND column_name = 'current_hp'
  ) THEN
    ALTER TABLE characters ADD COLUMN current_hp integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'characters' 
    AND column_name = 'current_wp'
  ) THEN
    ALTER TABLE characters ADD COLUMN current_wp integer;
  END IF;

  -- Set default values for existing characters
  UPDATE characters
  SET 
    current_hp = (attributes->>'CON')::integer,
    current_wp = (attributes->>'WIL')::integer
  WHERE current_hp IS NULL OR current_wp IS NULL;

  -- Add new constraints
  ALTER TABLE characters
    ADD CONSTRAINT characters_valid_hp CHECK (
      current_hp IS NULL 
      OR (current_hp >= 0 AND current_hp <= (attributes->>'CON')::integer)
    ),
    ADD CONSTRAINT characters_valid_wp CHECK (
      current_wp IS NULL 
      OR (current_wp >= 0 AND current_wp <= (attributes->>'WIL')::integer)
    );

  -- Create indexes
  DROP INDEX IF EXISTS idx_characters_current_hp;
  DROP INDEX IF EXISTS idx_characters_current_wp;
  CREATE INDEX idx_characters_current_hp ON characters(current_hp);
  CREATE INDEX idx_characters_current_wp ON characters(current_wp);

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in migration: %', SQLERRM;
END;
$$;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY admin_users;

-- Force schema cache refresh
ALTER TABLE characters REPLICA IDENTITY FULL;
NOTIFY pgrst, 'reload schema';
