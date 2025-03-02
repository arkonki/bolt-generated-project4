import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DBSpell {
  id: string;
  name: string;
  school_id: string | null;
  rank: number;
  requirement: string | null;
  casting_time: string;
  range: string;
  duration: string;
  description: string;
  willpower_cost: number;
}

export function useSpells(characterId: string) {
  const [generalSpells, setGeneralSpells] = useState<DBSpell[]>([]);
  const [schoolSpells, setSchoolSpells] = useState<DBSpell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpells() {
      try {
        setLoading(true);
        setError(null);

        // First get the character's magic school
        const { data: characterData, error: characterError } = await supabase
          .from('characters')
          .select('magic_school')
          .eq('id', characterId)
          .single();

        if (characterError) throw characterError;

        // Get general magic spells
        const { data: generalData, error: generalError } = await supabase
          .from('game_spells')
          .select(`
            *,
            magic_schools (
              name
            )
          `)
          .is('school_id', null)
          .order('rank')
          .order('name');

        if (generalError) throw generalError;
        setGeneralSpells(generalData || []);

        // If character has a magic school, get school-specific spells
        if (characterData?.magic_school) {
          const { data: schoolData, error: schoolError } = await supabase
            .from('game_spells')
            .select(`
              *,
              magic_schools (
                name
              )
            `)
            .eq('school_id', characterData.magic_school)
            .order('rank')
            .order('name');

          if (schoolError) throw schoolError;
          setSchoolSpells(schoolData || []);
        }
      } catch (err) {
        console.error('Error loading spells:', err);
        setError(err instanceof Error ? err.message : 'Failed to load spells');
      } finally {
        setLoading(false);
      }
    }

    loadSpells();
  }, [characterId]);

  return {
    generalSpells,
    schoolSpells,
    loading,
    error
  };
}
