/*
  # Update User Password

  1. Changes
    - Updates the password for arvi@maantoa.ee user to 'admin123'
    - Ensures the user has admin role
  
  2. Security
    - Password is properly hashed using pgcrypto
*/

-- Update password for arvi@maantoa.ee
UPDATE auth.users
SET encrypted_password = crypt('admin123', gen_salt('bf'))
WHERE email = 'arvi@maantoa.ee';

-- Ensure user has admin role in public schema
UPDATE public.users
SET role = 'admin'
WHERE email = 'arvi@maantoa.ee';
