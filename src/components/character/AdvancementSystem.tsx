import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Character } from '../../types/character';
import { GraduationCap, AlertCircle, Check, Star, Info, ArrowRight } from 'lucide-react';
import { SkillAdvancementModal } from './modals/SkillAdvancementModal';

interface AdvancementSystemProps {
  character: Character;
  onUpdate: (character: Character) => void;
}

export function AdvancementSystem({ character, onUpdate }: AdvancementSystemProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSkillModal, setShowSkillModal] = useState(false);

  const markedSkills = character.experience?.markedSkills || [];
  const trainedSkills = character.trainedSkills || [];
  const level = markedSkills.length;

  // Calculate available advancements
  const getAvailableAdvancements = () => {
    const advancements = [];
    
    // Every 4 levels can increase an attribute by 1
    if (level >= 4 && level % 4 === 0) {
      advancements.push('attribute');
    }

    // Every 3 levels can learn a new skill
    if (level >= 3 && level % 3 === 0) {
      advancements.push('skill');
    }

    // Every 5 levels can learn a new heroic ability or spell
    if (level >= 5 && level % 5 === 0) {
      advancements.push(character.profession === 'Mage' ? 'spell' : 'heroic');
    }

    return advancements;
  };

  const handleAdvancement = async (type: string) => {
    try {
      switch (type) {
        case 'attribute':
          // Attribute advancement will be handled in a separate modal
          break;
        case 'skill':
          setShowSkillModal(true);
          break;
        case 'spell':
        case 'heroic':
          // Spell/Heroic ability advancement will be handled in a separate modal
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance character');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            Character Advancement
          </h2>
          <p className="text-gray-600">
            Level {level} {character.kin} {character.profession}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-800">Success</h4>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Available Advancements */}
      {getAvailableAdvancements().length > 0 && (
        <div className="p-6 bg-white rounded-lg border">
          <div className="flex items-start gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Available Advancements</h4>
              <p className="text-sm text-blue-700">
                You have reached a level milestone! Choose your advancement:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getAvailableAdvancements().map((type) => (
              <button
                key={type}
                onClick={() => handleAdvancement(type)}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <h5 className="font-medium capitalize">{type}</h5>
                  <p className="text-sm text-gray-600">
                    {type === 'attribute' && 'Increase an attribute by 1'}
                    {type === 'skill' && 'Learn a new skill'}
                    {type === 'spell' && 'Learn a new spell'}
                    {type === 'heroic' && 'Learn a new heroic ability'}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Skill Advancement Modal */}
      {showSkillModal && (
        <SkillAdvancementModal
          character={character}
          onClose={() => setShowSkillModal(false)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
