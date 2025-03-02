import React, { useState } from 'react';
import { useCharacterCreation } from '../../../stores/characterCreation';
import { professions } from '../../../data';
import { 
  Hammer, 
  Music, 
  Sword, 
  Crosshair, 
  Shield, 
  Wand2, 
  Anchor, 
  Coins, 
  BookOpen, 
  Key,
  AlertCircle
} from 'lucide-react';

const professionIcons = {
  Artisan: Hammer,
  Bard: Music,
  Fighter: Sword,
  Hunter: Crosshair,
  Knight: Shield,
  Mage: Wand2,
  Mariner: Anchor,
  Merchant: Coins,
  Scholar: BookOpen,
  Thief: Key,
} as const;

const heroicAbilityDescriptions: Record<string, { description: string, willpower: number }> = {
  Musician: {
    description: "Your music can inspire allies, granting them bonuses to their actions.",
    willpower: 3
  },
  Veteran: {
    description: "Your combat experience allows you to perform devastating attacks.",
    willpower: 3
  },
  Companion: {
    description: "You have a loyal animal companion that aids you in your adventures.",
    willpower: 3
  },
  Guardian: {
    description: "You can protect allies from harm by intercepting attacks meant for them.",
    willpower: 3
  },
  "Sea Legs": {
    description: "You excel at maintaining balance and fighting on unstable surfaces.",
    willpower: 3
  },
  "Treasure Hunter": {
    description: "Your keen eye helps you spot valuable items and hidden treasures.",
    willpower: 3
  },
  Intuition: {
    description: "Your scholarly knowledge grants you insights into various situations.",
    willpower: 3
  },
  Backstabbing: {
    description: "You can perform devastating attacks when striking from hiding.",
    willpower: 3
  }
};

export function ProfessionSelection() {
  const { character, updateCharacter } = useCharacterCreation();
  const [selectedSchool, setSelectedSchool] = useState<string>(character.magicSchool || '');
  const [selectedHeroicAbility, setSelectedHeroicAbility] = useState<string>('');

  const handleProfessionSelect = (professionName: string) => {
    // Clear magic school if changing from or to a non-mage profession
    if (professionName !== 'Mage' || character.profession !== 'Mage') {
      updateCharacter({ 
        profession: professionName,
        magicSchool: undefined // Clear magic school when changing professions
      });
      setSelectedSchool('');
    } else {
      updateCharacter({ profession: professionName });
    }
    
    if (professionName !== 'Artisan') {
      setSelectedHeroicAbility('');
    }
  };

  const handleSchoolSelect = (school: string) => {
    setSelectedSchool(school);
    updateCharacter({ 
      magicSchool: school as 'Animist' | 'Elementalist' | 'Mentalist'
    });
  };

  const renderMageSchools = () => {
    const mage = professions.find(p => p.name === 'Mage');
    if (!mage || !character.profession || character.profession !== 'Mage') return null;

    const schools = Object.keys(mage.skills as Record<string, string[]>);

    return (
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <p className="text-amber-700 font-medium">
            Please select a magical school to continue. Each school provides different skills and approaches to magic.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {schools.map((school) => (
            <div
              key={school}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedSchool === school
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => handleSchoolSelect(school)}
            >
              <h5 className="font-semibold text-lg mb-2">{school}</h5>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                {(mage.skills as Record<string, string[]>)[school].map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderArtisanHeroicAbilities = () => {
    const artisan = professions.find(p => p.name === 'Artisan');
    if (!artisan || !character.profession || character.profession !== 'Artisan') return null;

    const abilities = artisan.heroic_ability as string[];

    return (
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <p className="text-amber-700 font-medium">
            Please select your specialization. This determines your heroic ability and crafting focus.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {abilities.map((ability) => (
            <div
              key={ability}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedHeroicAbility === ability
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
              onClick={() => setSelectedHeroicAbility(ability)}
            >
              <h5 className="font-semibold text-lg mb-2">{ability}</h5>
              <p className="text-sm text-gray-600">
                {ability === 'Master Blacksmith' && 'Expert in forging weapons, armor, and metal items.'}
                {ability === 'Master Carpenter' && 'Skilled in woodworking, construction, and furniture making.'}
                {ability === 'Master Tanner' && 'Specializes in leather working and creating leather goods.'}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHeroicAbility = (profession: typeof professions[0]) => {
    if (profession.name === 'Mage') {
      return "As a mage, you don't get a starting heroic ability. Instead, you get your magic.";
    }
    
    if (Array.isArray(profession.heroic_ability)) {
      return "Choose your specialization below";
    }
    
    const ability = profession.heroic_ability as string;
    const abilityInfo = heroicAbilityDescriptions[ability];
    
    if (!abilityInfo) return ability;
    
    return (
      <div className="space-y-1">
        <p className="font-medium text-gray-800">{ability}</p>
        <p className="text-gray-600">{abilityInfo.description}</p>
        <p className="text-sm text-blue-600">Willpower Cost: {abilityInfo.willpower} WP</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="prose">
        <h3 className="text-xl font-bold mb-4">Choose Your Profession</h3>
        <p className="text-gray-600">
          Your profession determines your character's skills, abilities, and role in the party.
          Choose a path that matches your preferred playstyle.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professions.map((profession) => {
          const Icon = professionIcons[profession.name as keyof typeof professionIcons];
          return (
            <div
              key={profession.name}
              className={`border rounded-lg p-6 cursor-pointer transition-all ${
                character.profession === profession.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleProfessionSelect(profession.name)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  character.profession === profession.name
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{profession.name}</h3>
                  <p className="text-sm text-gray-600">Key Attribute: {profession.key_attribute}</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">{profession.description}</p>
              
              <div>
                <h4 className="font-medium mb-2">Starting Skills</h4>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  {Array.isArray(profession.skills) ? (
                    profession.skills.map((skill) => (
                      <li key={skill}>{skill}</li>
                    ))
                  ) : (
                    <li>Choose a school to view skills</li>
                  )}
                </ul>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Heroic Ability</h4>
                <div className="text-sm">
                  {renderHeroicAbility(profession)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {character.profession === 'Mage' && renderMageSchools()}
      {character.profession === 'Artisan' && renderArtisanHeroicAbilities()}

      {character.profession && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">
            You have selected <strong>{character.profession}</strong> as your profession.
            {character.profession === 'Mage' && selectedSchool && (
              <> with the <strong>{selectedSchool}</strong> school</>
            )}
            {character.profession === 'Artisan' && selectedHeroicAbility && (
              <> specializing as a <strong>{selectedHeroicAbility}</strong></>
            )}
          </p>
          {character.profession === 'Mage' && !selectedSchool && (
            <p className="text-amber-600 mt-2">Please select a magical school to continue.</p>
          )}
          {character.profession === 'Artisan' && !selectedHeroicAbility && (
            <p className="text-amber-600 mt-2">Please select your specialization to continue.</p>
          )}
        </div>
      )}
    </div>
  );
}
