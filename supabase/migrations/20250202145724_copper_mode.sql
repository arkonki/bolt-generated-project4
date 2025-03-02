-- Drop existing policies
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "enable_read_for_authenticated" ON users;
DROP POLICY IF EXISTS "enable_insert_for_authenticated" ON users;
DROP POLICY IF EXISTS "enable_update_for_self_and_admins" ON users;

-- Create new simplified policies
CREATE POLICY "allow_read_all"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert_all"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_update_self_and_admins"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    OR (
      SELECT role = 'admin'
      FROM users u
      WHERE u.id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    auth.uid() = id 
    OR (
      SELECT role = 'admin'
      FROM users u
      WHERE u.id = auth.uid()
      LIMIT 1
    )
  );

-- Create function to safely get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text 
  FROM users 
  WHERE id = user_id 
  LIMIT 1;
$$;
