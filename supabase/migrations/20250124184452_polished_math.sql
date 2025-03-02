/*
  # Create admin user

  1. Changes
    - Creates admin user in auth.users table
    - Creates corresponding entry in public.users table
    - Sets admin role

  2. Security
    - Ensures admin user exists
    - Maintains data consistency between auth and public tables
*/

-- Create admin user in auth.users if not exists
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  -- First check if user exists in auth.users
  SELECT id INTO admin_uid
  FROM auth.users
  WHERE email = 'arvi@maantoa.ee'
  LIMIT 1;

  -- If user doesn't exist in auth.users, create them
  IF admin_uid IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'arvi@maantoa.ee',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"Admin"}'::jsonb,
      now(),
      now(),
      encode(gen_random_bytes(32), 'hex')
    )
    RETURNING id INTO admin_uid;
  END IF;

  -- Now ensure user exists in public.users with admin role
  INSERT INTO public.users (id, email, username, role)
  VALUES (
    admin_uid,
    'arvi@maantoa.ee',
    'Admin',
    'admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
END $$;
