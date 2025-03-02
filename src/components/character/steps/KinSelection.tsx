import React from 'react';
import { useCharacterCreation } from '../../../stores/characterCreation';
import { kins } from '../../../data';
import { Ability } from '../../../types/character';

export function KinSelection() {
  const { character, updateCharacter } = useCharacterCreation();

  const renderAbility = (ability: Ability | Ability[]) => {
    if (Array.isArray(ability)) {
      return (
        <div className="space-y-4">
          {ability.map((a, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-lg">{a.name}</h4>
              {a.willpower_points && (
                <p className="text-sm text-gray-600 mb-2">
                  Willpower Points: {a.willpower_points}
                </p>
              )}
              <p className="text-gray-700">{a.description}</p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-lg">{ability.name}</h4>
        {ability.willpower_points && (
          <p className="text-sm text-gray-600 mb-2">
            Willpower Points: {ability.willpower_points}
          </p>
        )}
        <p className="text-gray-700">{ability.description}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="prose">
        <h3 className="text-xl font-bold mb-4">Choose Your Kin</h3>
        <p className="text-gray-600">
          Your kin determines your innate abilities and characteristics. Choose wisely, as this
          decision will influence your character's strengths and playstyle.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kins.map((kin) => (
          <div
            key={kin.name}
            className={`border rounded-lg p-6 cursor-pointer transition-all ${
              character.kin === kin.name
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => updateCharacter({ kin: kin.name })}
          >
            <h3 className="text-xl font-bold mb-2">{kin.name}</h3>
            <p className="text-gray-600 mb-4">{kin.description}</p>
            <div className="space-y-4">
              <h4 className="font-semibold">Racial Ability</h4>
              {renderAbility(kin.ability)}
            </div>
          </div>
        ))}
      </div>

      {character.kin && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">
            You have selected <strong>{character.kin}</strong> as your kin.
          </p>
        </div>
      )}
    </div>
  );
}
