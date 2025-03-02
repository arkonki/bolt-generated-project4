import { create } from 'zustand';
import { Character } from '../types/character';

interface CharacterCreationStore {
  step: number;
  character: Partial<Character>;
  setStep: (step: number) => void;
  updateCharacter: (updates: Partial<Character>) => void;
  resetCharacter: () => void;
}

export const useCharacterCreation = create<CharacterCreationStore>((set) => ({
  step: 0,
  character: {},
  setStep: (step) => set({ step }),
  updateCharacter: (updates) =>
    set((state) => ({
      character: { ...state.character, ...updates },
    })),
  resetCharacter: () => set({ character: {}, step: 0 }),
}));
