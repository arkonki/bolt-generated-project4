-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.compendium_templates;
DROP POLICY IF EXISTS "Enable insert/update for admin users" ON public.compendium_templates;

-- Create more permissive RLS policies
CREATE POLICY "Allow read access for all authenticated users"
  ON public.compendium_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all operations for admin users"
  ON public.compendium_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_compendium_templates_category ON public.compendium_templates(category);
CREATE INDEX IF NOT EXISTS idx_compendium_templates_created_by ON public.compendium_templates(created_by);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
