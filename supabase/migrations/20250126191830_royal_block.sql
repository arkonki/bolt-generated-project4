-- Create function to get user role safely
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role
    FROM users
    WHERE id = user_id
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return default role
    RAISE NOTICE 'Error in get_user_role: %', SQLERRM;
    RETURN 'player'::user_role;
END;
$$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_id_role ON users(id, role);

-- Ensure RLS policies are correct
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read data" ON users;
CREATE POLICY "Users can read data"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Add connection test function
CREATE OR REPLACE FUNCTION test_connection()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;
