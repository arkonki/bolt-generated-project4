-- Add constraints for characters table
ALTER TABLE characters
  ADD CONSTRAINT valid_age CHECK (age IN ('Young', 'Adult', 'Old')),
  ADD CONSTRAINT valid_profession CHECK (profession IN (
    'Artisan', 'Bard', 'Fighter', 'Hunter', 'Knight', 'Mage',
    'Mariner', 'Merchant', 'Scholar', 'Thief'
  )),
  ADD CONSTRAINT valid_kin CHECK (kin IN (
    'Human', 'Halfling', 'Dwarf', 'Elf', 'Mallard', 'Wolfkin'
  ));

-- Add JSON field constraints
ALTER TABLE characters
  ADD CONSTRAINT valid_attributes CHECK (
    attributes ? 'STR' AND attributes ? 'CON' AND 
    attributes ? 'AGL' AND attributes ? 'INT' AND 
    attributes ? 'WIL' AND attributes ? 'CHA'
  ),
  ADD CONSTRAINT valid_equipment CHECK (
    equipment ? 'inventory' AND 
    equipment ? 'equipped' AND 
    equipment ? 'money'
  ),
  ADD CONSTRAINT valid_conditions CHECK (
    conditions ? 'exhausted' AND conditions ? 'sickly' AND
    conditions ? 'dazed' AND conditions ? 'angry' AND
    conditions ? 'scared' AND conditions ? 'disheartened'
  );

-- Set default values and not null constraints
ALTER TABLE characters
  ALTER COLUMN attributes SET NOT NULL,
  ALTER COLUMN trained_skills SET DEFAULT ARRAY[]::text[],
  ALTER COLUMN other_skills SET DEFAULT ARRAY[]::text[];

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_profession ON characters(profession);
CREATE INDEX IF NOT EXISTS idx_characters_kin ON characters(kin);
CREATE INDEX IF NOT EXISTS idx_characters_magic_school ON characters(magic_school);
CREATE INDEX IF NOT EXISTS idx_characters_created_at ON characters(created_at);

-- Add unique constraint to party members
ALTER TABLE party_members
  ADD CONSTRAINT unique_party_member UNIQUE (party_id, character_id);

-- Create indexes for party members
CREATE INDEX IF NOT EXISTS idx_party_members_party_id ON party_members(party_id);
CREATE INDEX IF NOT EXISTS idx_party_members_character_id ON party_members(character_id);
CREATE INDEX IF NOT EXISTS idx_party_members_joined_at ON party_members(joined_at);

-- Add not null constraints to notes
ALTER TABLE notes
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN content SET NOT NULL;

-- Create indexes for notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_character_id ON notes(character_id);
CREATE INDEX IF NOT EXISTS idx_notes_party_id ON notes(party_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);

-- Add not null constraints to parties
ALTER TABLE parties
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN created_by SET NOT NULL;

-- Create indexes for parties
CREATE INDEX IF NOT EXISTS idx_parties_created_by ON parties(created_by);
CREATE INDEX IF NOT EXISTS idx_parties_created_at ON parties(created_at);

-- Add constraints to users
ALTER TABLE users
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN username SET NOT NULL,
  ALTER COLUMN role SET NOT NULL,
  ADD CONSTRAINT valid_role CHECK (role IN ('player', 'dm', 'admin'));

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Add cascade delete for related records
ALTER TABLE characters
  DROP CONSTRAINT IF EXISTS characters_user_id_fkey,
  ADD CONSTRAINT characters_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;

ALTER TABLE party_members
  DROP CONSTRAINT IF EXISTS party_members_party_id_fkey,
  ADD CONSTRAINT party_members_party_id_fkey 
    FOREIGN KEY (party_id) 
    REFERENCES parties(id) 
    ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS party_members_character_id_fkey,
  ADD CONSTRAINT party_members_character_id_fkey 
    FOREIGN KEY (character_id) 
    REFERENCES characters(id) 
    ON DELETE CASCADE;

ALTER TABLE notes
  DROP CONSTRAINT IF EXISTS notes_user_id_fkey,
  ADD CONSTRAINT notes_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS notes_character_id_fkey,
  ADD CONSTRAINT notes_character_id_fkey 
    FOREIGN KEY (character_id) 
    REFERENCES characters(id) 
    ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS notes_party_id_fkey,
  ADD CONSTRAINT notes_party_id_fkey 
    FOREIGN KEY (party_id) 
    REFERENCES parties(id) 
    ON DELETE CASCADE;
