/*
  # Add default admin user

  1. Changes
    - Add default admin user with email admin@dragonbane.com
    - Set role to 'admin'
    - Use auth.uid() for the ID to match Supabase auth
*/

-- Create admin user if not exists
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  -- Get or create auth user ID
  SELECT id INTO admin_uid
  FROM auth.users
  WHERE email = 'admin@dragonbane.com'
  LIMIT 1;

  -- Only proceed if we have a valid auth user ID
  IF admin_uid IS NOT NULL THEN
    -- Insert into users table if not exists
    INSERT INTO users (id, email, username, role)
    VALUES (
      admin_uid,
      'admin@dragonbane.com',
      'Admin',
      'admin'
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin'
    WHERE users.id = admin_uid;
  END IF;
END $$;
