-- Revoke existing policies
DROP POLICY IF EXISTS "Allow read access to game_spells" ON game_spells;
DROP POLICY IF EXISTS "Allow insert access for authenticated users" ON game_spells;
DROP POLICY IF EXISTS "Allow update access for authenticated users" ON game_spells;
DROP POLICY IF EXISTS "Allow delete access for authenticated users" ON game_spells;

-- Recreate policies with admin check
CREATE POLICY "Allow read access to game_spells"
  ON game_spells
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access for admin users"
  ON game_spells
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
  ON game_spells
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
  ON game_spells
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
