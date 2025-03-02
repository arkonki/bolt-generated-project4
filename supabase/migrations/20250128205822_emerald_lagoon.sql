/*
  # Fix auth schema and user creation

  1. Fix auth.users table schema
  2. Update email_change handling
  3. Create admin user with proper schema
*/

-- Fix auth schema issues first
ALTER TABLE auth.users
  ALTER COLUMN email_change DROP NOT NULL,
  ALTER COLUMN email_change SET DEFAULT NULL,
  ALTER COLUMN email_change_token_current DROP NOT NULL,
  ALTER COLUMN email_change_token_current SET DEFAULT NULL,
  ALTER COLUMN email_change_token_new DROP NOT NULL,
  ALTER COLUMN email_change_token_new SET DEFAULT NULL,
  ALTER COLUMN email_change_confirm_status DROP NOT NULL,
  ALTER COLUMN email_change_confirm_status SET DEFAULT 0;

-- Clean up any invalid data
UPDATE auth.users 
SET 
  email_change = NULL,
  email_change_token_current = NULL,
  email_change_token_new = NULL,
  email_change_confirm_status = 0
WHERE email_change = '';

-- Create admin user
DO $$
DECLARE
  admin_uid uuid;
  hashed_password text;
BEGIN
  -- Generate secure password hash
  hashed_password := crypt('Admin1234', gen_salt('bf', 10));

  -- Create or update auth user
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
    confirmation_token,
    email_change,
    email_change_token_current,
    email_change_token_new,
    email_change_confirm_status
  )
  VALUES (
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
    encode(gen_random_bytes(32), 'hex'),
    NULL,
    NULL,
    NULL,
    0
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = now(),
    email_change = NULL,
    email_change_token_current = NULL,
    email_change_token_new = NULL,
    email_change_confirm_status = 0
  RETURNING id INTO admin_uid;

  -- Ensure user exists in public schema
  INSERT INTO public.users (
    id,
    email,
    username,
    role
  )
  VALUES (
    admin_uid,
    'arvi@maantoa.ee',
    'Admin',
    'admin'
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    id = EXCLUDED.id,
    role = 'admin';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating admin user: %', SQLERRM;
END;
$$;

-- Refresh schema cache
ALTER TABLE auth.users REPLICA IDENTITY FULL;
NOTIFY pgrst, 'reload schema';
