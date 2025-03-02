-- Drop existing function first
DROP FUNCTION IF EXISTS get_user_role(uuid);

-- Create a materialized view to cache admin status if it doesn't exist
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_users AS
SELECT id
FROM users
WHERE role = 'admin';

-- Create unique index if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_id_idx ON admin_users(id);

-- Drop existing policies
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "enable_read_for_authenticated" ON users;
DROP POLICY IF EXISTS "enable_insert_for_authenticated" ON users;
DROP POLICY IF EXISTS "enable_update_for_self_and_admins" ON users;

-- Create new policies using the materialized view
CREATE POLICY "enable_read_for_all_authenticated"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_insert_for_all_authenticated"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

-- Create function to refresh admin cache if it doesn't exist
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

-- Create trigger to refresh admin cache if it doesn't exist
DROP TRIGGER IF EXISTS refresh_admin_users_trigger ON users;
CREATE TRIGGER refresh_admin_users_trigger
  AFTER INSERT OR UPDATE OF role OR DELETE
  ON users
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_admin_users();

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY admin_users;

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';
