-- Add new columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text CHECK (char_length(bio) <= 500),
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  permission_level integer NOT NULL CHECK (permission_level BETWEEN 1 AND 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_role_name UNIQUE (name),
  CONSTRAINT valid_permission_level CHECK (permission_level > 0 AND permission_level <= 100)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, role_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(is_email_verified);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_permission_level ON roles(permission_level);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO roles (name, description, permission_level)
VALUES 
  ('player', 'Standard player account', 10),
  ('dm', 'Dungeon Master with enhanced permissions', 50),
  ('admin', 'Full system administrator', 100)
ON CONFLICT (name) DO NOTHING;

-- Create admin user if not exists
DO $$
DECLARE
  admin_user_id uuid;
  admin_role_id uuid;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';

  -- Get or create admin user ID from auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'arvi@maantoa.ee'
  LIMIT 1;

  -- If admin_user_id is null, we need to create the auth user
  IF admin_user_id IS NULL THEN
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
    ) RETURNING id INTO admin_user_id;
  END IF;

  -- Now create or update the public user
  INSERT INTO public.users (
    id,
    email,
    username,
    first_name,
    last_name,
    is_active,
    is_email_verified,
    role
  )
  VALUES (
    admin_user_id,
    'arvi@maantoa.ee',
    'Admin',
    'Admin',
    'User',
    true,
    true,
    'admin'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    is_email_verified = true;

  -- Assign admin role
  INSERT INTO user_roles (user_id, role_id, assigned_at)
  VALUES (admin_user_id, admin_role_id, now())
  ON CONFLICT DO NOTHING;
END;
$$;

-- Create RLS policies
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Roles policies
CREATE POLICY "Roles visible to all authenticated users"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify roles"
  ON roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- User roles policies
CREATE POLICY "User roles visible to all authenticated users"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify user roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
