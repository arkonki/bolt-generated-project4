// Magic School Types
export interface MagicSchool {
  id: string;
  name: string;
  description: string;
  keyAttribute: string;
  baseSkills: string[];
  createdAt: string;
}

// Spell Types
export interface Spell {
  id: string;
  name: string;
  schoolId: string | null;
  rank: number;
  requirement: string | null;
  castingTime: string;
  range: string;
  duration: string;
  description: string;
  willpowerCost: number;
  createdAt: string;
}

// Heroic Ability Types
export interface HeroicAbility {
  id: string;
  name: string;
  description: string;
  willpowerCost: number;
  profession: string; // Changed from professionId to profession
  createdAt: string;
}

// Enums for magic-related data
export enum SpellRank {
  Trick = 0,
  Rank1 = 1,
  Rank2 = 2,
  Rank3 = 3
}

export enum MagicSchoolName {
  Animism = 'Animism',
  Elementalism = 'Elementalism',
  Mentalism = 'Mentalism'
}

export enum SpellDuration {
  Instant = 'Instant',
  OneScene = 'One scene',
  OneShift = 'One shift',
  Concentration = 'Concentration'
}
