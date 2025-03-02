import { useState, useEffect } from 'react';
import { 
  getMagicSchools, 
  getSpells, 
  getHeroicAbilities,
  getCharacterSpells 
} from '../lib/api/magic';
import { MagicSchool, Spell, HeroicAbility } from '../types/magic';

export function useMagicSchools() {
  const [schools, setSchools] = useState<MagicSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSchools() {
      try {
        const data = await getMagicSchools();
        setSchools(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load magic schools');
      } finally {
        setLoading(false);
      }
    }

    loadSchools();
  }, []);

  return { schools, loading, error };
}

export function useSpells(schoolId?: string, rank?: number) {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpells() {
      try {
        const data = await getSpells({ schoolId, rank });
        setSpells(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load spells');
      } finally {
        setLoading(false);
      }
    }

    loadSpells();
  }, [schoolId, rank]);

  return { spells, loading, error };
}

export function useCharacterSpells(characterId: string) {
  const [spells, setSpells] = useState<{
    generalSpells: Spell[];
    schoolSpells: Spell[];
  }>({ generalSpells: [], schoolSpells: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpells() {
      try {
        const data = await getCharacterSpells(characterId);
        setSpells(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load character spells');
      } finally {
        setLoading(false);
      }
    }

    loadSpells();
  }, [characterId]);

  return { ...spells, loading, error };
}

export function useHeroicAbilities(professionId?: string) {
  const [abilities, setAbilities] = useState<HeroicAbility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAbilities() {
      try {
        const data = await getHeroicAbilities(professionId);
        setAbilities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load heroic abilities');
      } finally {
        setLoading(false);
      }
    }

    loadAbilities();
  }, [professionId]);

  return { abilities, loading, error };
}
