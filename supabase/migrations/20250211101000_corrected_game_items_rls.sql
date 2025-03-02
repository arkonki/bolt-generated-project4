-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access to game_items" ON game_items;
DROP POLICY IF EXISTS "Allow insert access for admin users" ON game_items;
DROP POLICY IF EXISTS "Allow update access for admin users" ON game_items;
DROP POLICY IF EXISTS "Allow delete access for admin users" ON game_items;

-- Recreate policies with correct syntax
CREATE POLICY "Allow read access to game_items"
  ON game_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access for admin users"
  ON game_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Allow update access for admin users"
  ON game_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Allow delete access for admin users"
  ON game_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
