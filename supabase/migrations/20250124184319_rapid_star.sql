/*
  # Set up admin user role

  1. Changes
    - Set up admin role in public.users table
    - Ensures admin privileges for specific email

  2. Security
    - Only updates role for existing user
    - Maintains RLS policies
*/

-- Set admin role for user if they exist
DO $$
BEGIN
  -- Update role in public.users table
  UPDATE users
  SET role = 'admin'
  WHERE email = 'arvi@maantoa.ee';

  -- If user doesn't exist in public.users but exists in auth.users,
  -- create the public user profile
  INSERT INTO public.users (id, email, username, role)
  SELECT 
    au.id,
    'arvi@maantoa.ee',
    'Admin',
    'admin'
  FROM auth.users au
  WHERE au.email = 'arvi@maantoa.ee'
  AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'arvi@maantoa.ee'
  );
END $$;
