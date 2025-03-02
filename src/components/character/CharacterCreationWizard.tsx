import React from 'react';
import { useCharacterCreation } from '../../stores/characterCreation';
import { KinSelection } from './steps/KinSelection';
import { ProfessionSelection } from './steps/ProfessionSelection';
import { NameAgeSelection } from './steps/NameAgeSelection';
import { AttributesSelection } from './steps/AttributesSelection';
import { MagicSelection } from './steps/MagicSelection';
import { TrainedSkillsSelection } from './steps/TrainedSkillsSelection';
import { GearSelection } from './steps/GearSelection';
import { AppearanceSelection } from './steps/AppearanceSelection';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Save, AlertCircle } from 'lucide-react';

const steps = [
  { title: 'Kin', component: KinSelection },
  { title: 'Profession', component: ProfessionSelection },
  { title: 'Name & Age', component: NameAgeSelection },
  { title: 'Attributes', component: AttributesSelection },
  { title: 'Magic', component: MagicSelection },
  { title: 'Trained Skills', component: TrainedSkillsSelection },
  { title: 'Gear', component: GearSelection },
  { title: 'Appearance', component: AppearanceSelection },
];

export function CharacterCreationWizard() {
  const { user } = useAuth();
  const { step, setStep, character, resetCharacter } = useCharacterCreation();
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const CurrentStep = steps[step].component;

  const canProceed = () => {
    switch (step) {
      case 0: // Kin
        return !!character.kin;
      case 1: // Profession
        return !!character.profession && (character.profession !== 'Mage' || !!character.magicSchool);
      case 2: // Name & Age
        return !!character.name && !!character.age;
      case 3: // Attributes
        return character.attributes && Object.values(character.attributes).every(value => value > 0);
      case 4: // Magic
        if (character.profession === 'Mage') {
          return character.spells && character.spells.general.length >= 3;
        }
        return true;
      case 5: // Trained Skills
        return character.trainedSkills && character.trainedSkills.length >= 6;
      case 6: // Gear
        return character.startingEquipment && character.startingEquipment.items.length > 0;
      case 7: // Appearance
        return !!character.appearance;
      default:
        return false;
    }
  };

  const handleSave = async () => {
    if (!user) {
      setError('You must be logged in to create a character');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Prepare character data with correct array types for skills
      const characterData = {
        user_id: user.id,
        name: character.name,
        kin: character.kin,
        profession: character.profession,
        magic_school: character.magicSchool,
        age: character.age,
        attributes: character.attributes,
        trained_skills: character.trainedSkills || [], // Will be stored as text[]
        other_skills: character.otherSkills || [], // Will be stored as text[]
        equipment: {
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
        appearance: character.appearance,
        conditions: {
          exhausted: false,
          sickly: false,
          dazed: false,
          angry: false,
          scared: false,
          disheartened: false
        },
        spells: character.spells || null,
        starting_equipment: character.startingEquipment || null,
        experience: {
          marked_skills: []
        }
      };

      // Save character to database
      const { error: saveError } = await supabase
        .from('characters')
        .insert([characterData]);

      if (saveError) throw saveError;

      // Reset character creation state
      resetCharacter();
      
      // Redirect to characters list
      window.location.href = '/';
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save character');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create Character</h2>
          <span className="text-gray-500">
            Step {step + 1} of {steps.length}
          </span>
        </div>
        <div className="flex gap-2">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className={`flex-1 h-2 rounded ${
                i <= step ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <CurrentStep />

      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {step === steps.length - 1 ? (
          <button
            onClick={handleSave}
            disabled={!canProceed() || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Create Character'}
          </button>
        ) : (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
