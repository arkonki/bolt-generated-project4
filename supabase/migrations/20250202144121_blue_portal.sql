-- Drop existing function first
DROP FUNCTION IF EXISTS get_user_role(uuid);

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

-- Create new policies without recursion
CREATE POLICY "users_read_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_policy"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "users_update_policy"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    OR (SELECT role::text FROM users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = id 
    OR (SELECT role::text FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Create function to safely get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM users WHERE id = user_id;
$$;
