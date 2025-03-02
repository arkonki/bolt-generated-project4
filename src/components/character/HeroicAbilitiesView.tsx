import React from 'react';
import { Character } from '../../types/character';
import { useHeroicAbilities } from '../../hooks/useMagic';
import { Swords, AlertCircle, Info, Star } from 'lucide-react';

interface HeroicAbilitiesViewProps {
  character: Character;
  onUpdate: (character: Character) => void;
}

export function HeroicAbilitiesView({ character, onUpdate }: HeroicAbilitiesViewProps) {
  const { abilities, loading, error } = useHeroicAbilities(character.profession);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading heroic abilities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (character.profession === 'Mage') {
    return (
      <div className="p-6">
        <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Magic Instead of Heroic Abilities</h4>
            <p className="text-sm text-blue-700">
              As a mage, you use magic instead of heroic abilities. Check the Spells tab to manage your magical capabilities.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Swords className="w-6 h-6 text-blue-600" />
            Heroic Abilities
          </h2>
          <p className="text-gray-600">
            {character.profession} • Level {character.experience?.markedSkills?.length || 0}
          </p>
        </div>
      </div>

      {/* Heroic Abilities Info */}
      <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-800">About Heroic Abilities</h4>
          <p className="text-sm text-blue-700">
            Heroic abilities are powerful techniques that can turn the tide of battle or overcome
            challenging situations. Each use costs Willpower Points (WP).
          </p>
        </div>
      </div>

      {/* Abilities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {abilities.map((ability) => (
          <div key={ability.id} className="p-6 border rounded-lg bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{ability.name}</h3>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-gray-600">
                  {ability.willpowerCost} WP
                </span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{ability.description}</p>
            <div className="text-sm text-gray-500">
              Available at level {Math.ceil(ability.willpowerCost / 2)}
            </div>
          </div>
        ))}
      </div>

      {abilities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No heroic abilities available for your profession yet.</p>
        </div>
      )}
    </div>
  );
}
