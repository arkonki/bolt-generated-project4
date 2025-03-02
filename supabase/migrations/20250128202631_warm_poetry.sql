-- Fix auth schema issues
ALTER TABLE auth.users
  ALTER COLUMN email_change DROP NOT NULL,
  ALTER COLUMN email_change SET DEFAULT NULL;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS users_email_change_idx ON auth.users(email_change)
WHERE email_change IS NOT NULL;

-- Update existing records
UPDATE auth.users 
SET email_change = NULL 
WHERE email_change = '';

-- Refresh auth schema
ALTER TABLE auth.users REPLICA IDENTITY FULL;
NOTIFY pgrst, 'reload schema';
