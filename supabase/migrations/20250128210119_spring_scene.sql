/*
  # Enhanced Authentication System

  1. User Management
    - Extended user profile fields
    - Two-factor authentication support
    - Account status tracking
    - Login attempt tracking
    
  2. Session Management
    - Secure session tracking
    - Device info storage
    - Token management
    
  3. Password Reset
    - Secure token generation
    - Expiration handling
*/

-- Create extension for cryptographic functions if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add new columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS last_login timestamptz,
  ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned')),
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_factor_secret text,
  ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_failed_login timestamptz,
  ADD COLUMN IF NOT EXISTS password_changed_at timestamptz DEFAULT now();

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  device_info jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  last_used_at timestamptz DEFAULT now(),
  is_valid boolean DEFAULT true
);

-- Create password resets table
CREATE TABLE IF NOT EXISTS public.password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  ip_address inet
);

-- Create login attempts tracking table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address inet,
  user_agent text,
  attempted_at timestamptz DEFAULT now(),
  success boolean DEFAULT false
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON public.password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address);

-- Create function to handle failed login attempts
CREATE OR REPLACE FUNCTION handle_failed_login()
RETURNS trigger AS $$
BEGIN
  UPDATE public.users
  SET 
    failed_login_attempts = failed_login_attempts + 1,
    last_failed_login = now(),
    account_status = CASE 
      WHEN failed_login_attempts >= 5 THEN 'suspended'
      ELSE account_status
    END
  WHERE email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for failed login attempts
DROP TRIGGER IF EXISTS on_failed_login ON public.login_attempts;
CREATE TRIGGER on_failed_login
  AFTER INSERT ON public.login_attempts
  FOR EACH ROW
  WHEN (NEW.success = false)
  EXECUTE FUNCTION handle_failed_login();

-- Create function to reset failed login attempts on successful login
CREATE OR REPLACE FUNCTION reset_failed_login_attempts()
RETURNS trigger AS $$
BEGIN
  UPDATE public.users
  SET 
    failed_login_attempts = 0,
    last_failed_login = NULL,
    last_login = now(),
    account_status = CASE 
      WHEN account_status = 'suspended' THEN 'active'
      ELSE account_status
    END
  WHERE email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for successful login
DROP TRIGGER IF EXISTS on_successful_login ON public.login_attempts;
CREATE TRIGGER on_successful_login
  AFTER INSERT ON public.login_attempts
  FOR EACH ROW
  WHEN (NEW.success = true)
  EXECUTE FUNCTION reset_failed_login_attempts();

-- Add RLS policies
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can view their own sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Password resets policies
CREATE POLICY "Users can view their own password resets"
  ON public.password_resets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Login attempts policies (admin only)
CREATE POLICY "Only admins can view login attempts"
  ON public.login_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to create a password reset token
CREATE OR REPLACE FUNCTION create_password_reset_token(user_email text, ip inet)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  reset_id uuid;
BEGIN
  -- Get user ID
  SELECT id INTO user_id FROM public.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Insert new reset token
  INSERT INTO public.password_resets (
    user_id,
    token,
    expires_at,
    ip_address
  )
  VALUES (
    user_id,
    encode(gen_random_bytes(32), 'hex'),
    now() + interval '1 hour',
    ip
  )
  RETURNING id INTO reset_id;

  RETURN reset_id;
END;
$$;

-- Function to validate password reset token
CREATE OR REPLACE FUNCTION validate_reset_token(reset_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.password_resets
    WHERE token = reset_token
    AND expires_at > now()
    AND used_at IS NULL
  );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
