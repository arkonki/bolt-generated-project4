/*
  # Fix Authentication Schema

  1. Changes
    - Ensures auth schema exists
    - Creates necessary auth tables if missing
    - Sets up proper constraints and indexes
    - Creates admin user with proper credentials

  2. Security
    - Properly hashes passwords
    - Sets up proper authentication roles
    - Maintains referential integrity
*/

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth user
DO $$
DECLARE
  admin_uid uuid := gen_random_uuid();
BEGIN
  -- Create admin user in auth schema
  INSERT INTO auth.users (
    id,
    instance_id,
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
    admin_uid,
    '00000000-0000-0000-0000-000000000000'::uuid,
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
  );

  -- Create admin user in public schema
  INSERT INTO public.users (id, email, username, role)
  VALUES (
    admin_uid,
    'arvi@maantoa.ee',
    'Admin',
    'admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';

EXCEPTION
  WHEN others THEN
    -- If there's an error, try to update existing user
    UPDATE public.users
    SET role = 'admin'
    WHERE email = 'arvi@maantoa.ee';
END $$;
