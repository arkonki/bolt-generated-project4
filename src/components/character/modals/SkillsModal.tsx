import React from 'react';
import { X } from 'lucide-react';
import { Character } from '../../../types/character';
import { useDice } from '../../dice/DiceContext';

interface SkillsModalProps {
  character: Character;
  onClose: () => void;
}

export function SkillsModal({ character, onClose }: SkillsModalProps) {
  const { toggleDiceRoller } = useDice();

  const getBaseChance = (value: number): number => {
    if (value <= 5) return 3;
    if (value <= 8) return 4;
    if (value <= 12) return 5;
    if (value <= 15) return 6;
    return 7;
  };

  const getConditionForAttribute = (attr: string): keyof Character['conditions'] => {
    const conditionMap: Record<string, keyof Character['conditions']> = {
      'STR': 'exhausted',
      'CON': 'sickly',
      'AGL': 'dazed',
      'INT': 'angry',
      'WIL': 'scared',
      'CHA': 'disheartened'
    };
    return conditionMap[attr];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Skills</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[calc(90vh-10rem)]">
            {/* General Skills */}
            <div>
              <h3 className="font-bold mb-4">General Skills</h3>
              <div className="space-y-2">
                {[
                  { name: 'Acrobatics', attr: 'AGL' },
                  { name: 'Awareness', attr: 'INT' },
                  { name: 'Bartering', attr: 'CHA' },
                  { name: 'Beast Lore', attr: 'INT' },
                  { name: 'Bluffing', attr: 'CHA' },
                  { name: 'Bushcraft', attr: 'INT' },
                  { name: 'Crafting', attr: 'STR' },
                  { name: 'Evade', attr: 'AGL' },
                  { name: 'Healing', attr: 'INT' },
                  { name: 'Hunting & Fishing', attr: 'AGL' },
                  { name: 'Languages', attr: 'INT' },
                  { name: 'Myths & Legends', attr: 'INT' },
                  { name: 'Performance', attr: 'CHA' },
                  { name: 'Persuasion', attr: 'CHA' },
                  { name: 'Riding', attr: 'AGL' },
                  { name: 'Seamanship', attr: 'INT' },
                  { name: 'Sleight of Hand', attr: 'AGL' },
                  { name: 'Sneaking', attr: 'AGL' },
                  { name: 'Spot Hidden', attr: 'INT' },
                  { name: 'Swimming', attr: 'AGL' }
                ].map(skill => {
                  const isTrained = character.trainedSkills.includes(skill.name);
                  const baseChance = getBaseChance(character.attributes[skill.attr as keyof typeof character.attributes]);
                  const skillValue = isTrained ? baseChance * 2 : baseChance;
                  const isAffected = character.conditions[getConditionForAttribute(skill.attr)];

                  return (
                    <div
                      key={skill.name}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                        isAffected ? 'bg-red-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        toggleDiceRoller();
                        onClose();
                      }}
                    >
                      <div>
                        <span className={`${isTrained ? 'font-bold' : ''} ${isAffected ? 'text-red-600' : ''}`}>
                          {skill.name}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">({skill.attr})</span>
                      </div>
                      <span className={`font-medium ${isAffected ? 'text-red-600' : ''}`}>
                        {skillValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weapon Skills */}
            <div>
              <h3 className="font-bold mb-4">Weapon Skills</h3>
              <div className="space-y-2">
                {[
                  { name: 'Axes', attr: 'STR' },
                  { name: 'Bows', attr: 'AGL' },
                  { name: 'Brawling', attr: 'STR' },
                  { name: 'Crossbows', attr: 'AGL' },
                  { name: 'Hammers', attr: 'STR' },
                  { name: 'Knives', attr: 'AGL' },
                  { name: 'Slings', attr: 'AGL' },
                  { name: 'Spears', attr: 'STR' },
                  { name: 'Staves', attr: 'AGL' },
                  { name: 'Swords', attr: 'STR' }
                ].map(skill => {
                  const isTrained = character.trainedSkills.includes(skill.name);
                  const baseChance = getBaseChance(character.attributes[skill.attr as keyof typeof character.attributes]);
                  const skillValue = isTrained ? baseChance * 2 : baseChance;
                  const isAffected = character.conditions[getConditionForAttribute(skill.attr)];

                  return (
                    <div
                      key={skill.name}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                        isAffected ? 'bg-red-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        toggleDiceRoller();
                        onClose();
                      }}
                    >
                      <div>
                        <span className={`${isTrained ? 'font-bold' : ''} ${isAffected ? 'text-red-600' : ''}`}>
                          {skill.name}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">({skill.attr})</span>
                      </div>
                      <span className={`font-medium ${isAffected ? 'text-red-600' : ''}`}>
                        {skillValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
