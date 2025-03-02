-- Disable RLS for all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE parties DISABLE ROW LEVEL SECURITY;
ALTER TABLE party_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE compendium DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;
