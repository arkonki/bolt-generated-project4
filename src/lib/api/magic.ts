import { supabase } from '../supabase';
import { MagicSchool, Spell, HeroicAbility } from '../../types/magic';

// Magic Schools API
export async function getMagicSchools(): Promise<MagicSchool[]> {
  const { data, error } = await supabase
    .from('magic_schools')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getMagicSchoolById(id: string): Promise<MagicSchool | null> {
  const { data, error } = await supabase
    .from('magic_schools')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Spells API
export async function getSpells(options?: {
  schoolId?: string;
  rank?: number;
}): Promise<Spell[]> {
  let query = supabase.from('spells').select('*');

  if (options?.schoolId) {
    query = query.eq('school_id', options.schoolId);
  }
  if (typeof options?.rank === 'number') {
    query = query.eq('rank', options.rank);
  }

  const { data, error } = await query.order('rank').order('name');

  if (error) throw error;
  return data || [];
}

export async function getSpellById(id: string): Promise<Spell | null> {
  const { data, error } = await supabase
    .from('spells')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getGeneralMagic(): Promise<Spell[]> {
  const { data, error } = await supabase
    .from('spells')
    .select('*')
    .is('school_id', null)
    .order('name');

  if (error) throw error;
  return data || [];
}

// Heroic Abilities API
export async function getHeroicAbilities(profession?: string): Promise<HeroicAbility[]> {
  let query = supabase.from('heroic_abilities').select('*');

  if (profession) {
    query = query.eq('profession', profession);
  }

  const { data, error } = await query.order('name');

  if (error) throw error;
  return data || [];
}

export async function getHeroicAbilityById(id: string): Promise<HeroicAbility | null> {
  const { data, error } = await supabase
    .from('heroic_abilities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Get all spells for a specific character based on their profession and magic school
export async function getCharacterSpells(characterId: string): Promise<{
  generalSpells: Spell[];
  schoolSpells: Spell[];
}> {
  // First get the character's profession and magic school
  const { data: character, error: characterError } = await supabase
    .from('characters')
    .select(`
      profession,
      magic_school
    `)
    .eq('id', characterId)
    .single();

  if (characterError) throw characterError;

  // Get general magic spells
  const generalSpells = await getGeneralMagic();

  // If character is not a mage or has no magic school, return only general spells
  if (!character.magic_school) {
    return {
      generalSpells,
      schoolSpells: []
    };
  }

  // Get school-specific spells
  const { data: schoolSpells, error: spellsError } = await supabase
    .from('spells')
    .select('*')
    .eq('school_id', character.magic_school)
    .order('rank')
    .order('name');

  if (spellsError) throw spellsError;

  return {
    generalSpells,
    schoolSpells: schoolSpells || []
  };
}
