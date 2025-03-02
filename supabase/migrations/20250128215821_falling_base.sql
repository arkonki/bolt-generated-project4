-- Create compendium templates table
CREATE TABLE IF NOT EXISTS public.compendium_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compendium_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users"
  ON public.compendium_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert/update for admin users"
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

-- Add indexes
CREATE INDEX idx_compendium_templates_category ON public.compendium_templates(category);
CREATE INDEX idx_compendium_templates_created_by ON public.compendium_templates(created_by);

-- Add trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_compendium_templates_updated_at
  BEFORE UPDATE ON public.compendium_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
