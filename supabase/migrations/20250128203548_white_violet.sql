/*
  # Add admin user

  1. Creates admin user in auth schema
  2. Ensures user exists in public schema with admin role
  3. Sets up proper password and email
*/

DO $$
DECLARE
  admin_uid uuid;
  hashed_password text;
BEGIN
  -- Generate secure password hash using bcrypt
  hashed_password := crypt('Admin1234', gen_salt('bf', 10));

  -- Create admin user in auth schema if not exists
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
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'arvi@maantoa.ee',
    hashed_password,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"Admin"}'::jsonb,
    now(),
    now(),
    encode(gen_random_bytes(32), 'hex')
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'arvi@maantoa.ee'
  )
  RETURNING id INTO admin_uid;

  -- If user already exists, get their ID and update password
  IF admin_uid IS NULL THEN
    SELECT id INTO admin_uid
    FROM auth.users
    WHERE email = 'arvi@maantoa.ee';

    -- Update password for existing user
    UPDATE auth.users
    SET 
      encrypted_password = hashed_password,
      updated_at = now()
    WHERE id = admin_uid;
  END IF;

  -- Ensure user exists in public schema with admin role
  INSERT INTO public.users (
    id,
    email,
    username,
    role,
    created_at,
    updated_at
  )
  VALUES (
    admin_uid,
    'arvi@maantoa.ee',
    'Admin',
    'admin',
    now(),
    now()
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    role = 'admin',
    updated_at = now()
  WHERE users.email = 'arvi@maantoa.ee';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating admin user: %', SQLERRM;
    -- Rollback will happen automatically
END;
$$;
