import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Character } from '../types/character';
import { CharacterView } from '../components/character/CharacterView';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';

export function CharacterPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCharacter() {
      try {
        if (!id || !user) return;

        const { data, error: fetchError } = await supabase
          .from('characters')
          .select(`
            id,
            user_id,
            name,
            kin,
            profession,
            magic_school,
            age,
            attributes,
            trained_skills,
            other_skills,
            equipment,
            appearance,
            conditions,
            spells,
            experience,
            starting_equipment,
            current_hp,
            current_wp
          `)
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Character not found');

        // Ensure all required properties exist with default values
        const safeCharacter: Character = {
          id: data.id,
          user_id: data.user_id,
          name: data.name,
          kin: data.kin,
          profession: data.profession,
          magicSchool: data.magic_school,
          age: data.age,
          attributes: data.attributes || {
            STR: 10,
            CON: 10,
            AGL: 10,
            INT: 10,
            WIL: 10,
            CHA: 10
          },
          trainedSkills: data.trained_skills || [],
          otherSkills: data.other_skills || [],
          equipment: data.equipment || {
            inventory: [],
            equipped: {
              weapons: []
            },
            money: {
              gold: 0,
              silver: 0,
              copper: 0
            }
          },
          appearance: data.appearance,
          conditions: data.conditions || {
            exhausted: false,
            sickly: false,
            dazed: false,
            angry: false,
            scared: false,
            disheartened: false
          },
          spells: data.spells,
          experience: data.experience || {
            markedSkills: []
          },
          startingEquipment: data.starting_equipment,
          current_hp: data.current_hp ?? data.attributes.CON,
          current_wp: data.current_wp ?? data.attributes.WIL
        };

        setCharacter(safeCharacter);
      } catch (err) {
        console.error('Error loading character:', err);
        setError(err instanceof Error ? err.message : 'Failed to load character');
      } finally {
        setLoading(false);
      }
    }

    loadCharacter();
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="p-8">
        <ErrorMessage message={error || 'Character not found'} />
      </div>
    );
  }

  return <CharacterView character={character} />;
}
