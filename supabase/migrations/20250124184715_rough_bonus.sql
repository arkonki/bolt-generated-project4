/*
  # Create Admin User Migration

  1. Changes
    - Creates admin user safely
    - Handles existing users
    - Sets admin role

  2. Security
    - Maintains proper role assignments
    - Ensures data consistency
*/

-- Create admin user safely
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();

  -- Insert into public.users if not exists
  INSERT INTO public.users (
    id,
    email,
    username,
    role
  )
  VALUES (
    new_user_id,
    'arvi@maantoa.ee',
    'Admin',
    'admin'
  )
  ON CONFLICT (email) DO UPDATE
  SET role = 'admin'
  RETURNING id INTO new_user_id;

  -- Ensure RLS policies exist
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;

  CREATE POLICY "Users can read own data"
    ON users
    FOR SELECT
    USING (auth.uid() = id);

  CREATE POLICY "Users can update own data"
    ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

END $$;
