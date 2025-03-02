-- Remove mock character if it exists
DELETE FROM characters 
WHERE name = 'Thorgrim Stonefist' 
  AND user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Add an index on character names for better performance
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);
