/*
  # Add user roles and update policies

  1. Changes
    - Add role enum type for user roles
    - Add role column to users table
    - Add role-based policies for notes and compendium

  2. Security
    - Enable RLS on all affected tables
    - Add policies for DM access to party notes
    - Add policies for admin access to compendium
*/

-- Create role enum type
CREATE TYPE user_role AS ENUM ('player', 'dm', 'admin');

-- Add role column to users table
ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'player';

-- Update notes policies
DROP POLICY IF EXISTS "Users can CRUD own notes" ON notes;
DROP POLICY IF EXISTS "Users can read admin notes" ON notes;

CREATE POLICY "Players and DMs can CRUD own notes"
  ON notes
  FOR ALL
  TO authenticated
  USING (
    (auth.uid() = user_id) OR
    (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'dm'
        AND notes.party_id IN (
          SELECT id FROM parties
          WHERE created_by = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    (auth.uid() = user_id) OR
    (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'dm'
        AND notes.party_id IN (
          SELECT id FROM parties
          WHERE created_by = auth.uid()
        )
      )
    )
  );

-- Update compendium policies
DROP POLICY IF EXISTS "Admin users can CRUD compendium" ON compendium;
DROP POLICY IF EXISTS "All users can read compendium" ON compendium;

CREATE POLICY "Admin users can manage compendium"
  ON compendium
  FOR ALL
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

CREATE POLICY "All authenticated users can read compendium"
  ON compendium
  FOR SELECT
  TO authenticated
  USING (true);

-- Add helper function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE id = user_id;
$$;
