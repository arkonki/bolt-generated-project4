import React, { useState, useEffect } from 'react';
import { useCharacterCreation } from '../../../stores/characterCreation';
import { CheckCircle2, AlertCircle, Info, Filter } from 'lucide-react';

interface Skill {
  name: string;
  attribute: string;
  description: string;
}

// Complete skill list
const allSkills: Skill[] = [
  // General Skills
  { name: "Acrobatics", attribute: "AGL", description: "Physical agility and balance" },
  { name: "Awareness", attribute: "INT", description: "Notice details and stay alert" },
  { name: "Bartering", attribute: "CHA", description: "Negotiate prices and trades" },
  { name: "Beast Lore", attribute: "INT", description: "Knowledge of creatures" },
  { name: "Bluffing", attribute: "CHA", description: "Deceive and misdirect" },
  { name: "Bushcraft", attribute: "INT", description: "Survive in the wilderness" },
  { name: "Crafting", attribute: "STR", description: "Create and repair items" },
  { name: "Evade", attribute: "AGL", description: "Dodge and avoid danger" },
  { name: "Healing", attribute: "INT", description: "Treat wounds and illnesses" },
  { name: "Hunting & Fishing", attribute: "AGL", description: "Catch prey and fish" },
  { name: "Languages", attribute: "INT", description: "Knowledge of different tongues" },
  { name: "Myths & Legends", attribute: "INT", description: "Knowledge of lore" },
  { name: "Performance", attribute: "CHA", description: "Entertain and impress" },
  { name: "Persuasion", attribute: "CHA", description: "Convince and influence" },
  { name: "Riding", attribute: "AGL", description: "Control mounts" },
  { name: "Seamanship", attribute: "INT", description: "Navigate and handle ships" },
  { name: "Sleight of Hand", attribute: "AGL", description: "Manual dexterity tricks" },
  { name: "Sneaking", attribute: "AGL", description: "Move silently and hide" },
  { name: "Spot Hidden", attribute: "INT", description: "Find hidden things" },
  { name: "Swimming", attribute: "AGL", description: "Move through water" },
  
  // Weapon Skills
  { name: "Axes", attribute: "STR", description: "Use axes in combat" },
  { name: "Bows", attribute: "AGL", description: "Use bows in combat" },
  { name: "Brawling", attribute: "STR", description: "Unarmed combat" },
  { name: "Crossbows", attribute: "AGL", description: "Use crossbows in combat" },
  { name: "Hammers", attribute: "STR", description: "Use hammers in combat" },
  { name: "Knives", attribute: "AGL", description: "Use knives in combat" },
  { name: "Slings", attribute: "AGL", description: "Use slings in combat" },
  { name: "Spears", attribute: "STR", description: "Use spears in combat" },
  { name: "Staves", attribute: "AGL", description: "Use staves in combat" },
  { name: "Swords", attribute: "STR", description: "Use swords in combat" },
  
  // Magic Skills
  { name: "Animism", attribute: "WIL", description: "Nature and life magic" },
  { name: "Elementalism", attribute: "WIL", description: "Elemental magic" },
  { name: "Mentalism", attribute: "WIL", description: "Mind and psychic magic" }
];

const professionSkills = {
  Artisan: ["Axes", "Brawling", "Crafting", "Hammers", "Knives", "Sleight of Hand", "Spot Hidden", "Swords"],
  Bard: ["Acrobatics", "Bluffing", "Evade", "Knives", "Languages", "Myths & Legends", "Performance", "Persuasion"],
  Fighter: ["Axes", "Bows", "Brawling", "Crossbows", "Evade", "Hammers", "Spears", "Swords"],
  Hunter: ["Acrobatics", "Awareness", "Bows", "Bushcraft", "Hunting & Fishing", "Knives", "Slings", "Sneaking"],
  Knight: ["Beast Lore", "Hammers", "Myths & Legends", "Performance", "Persuasion", "Riding", "Spears", "Swords"],
  Mage: {
    Animist: ["Animism", "Beast Lore", "Bushcraft", "Evade", "Healing", "Hunting & Fishing", "Sneaking", "Staves"],
    Elementalist: ["Elementalism", "Awareness", "Evade", "Healing", "Languages", "Myths & Legends", "Spot Hidden", "Staves"],
    Mentalist: ["Mentalism", "Acrobatics", "Awareness", "Brawling", "Evade", "Healing", "Languages", "Myths & Legends"]
  },
  Mariner: ["Acrobatics", "Awareness", "Hunting & Fishing", "Knives", "Languages", "Seamanship", "Swimming", "Swords"],
  Merchant: ["Awareness", "Bartering", "Bluffing", "Evade", "Knives", "Persuasion", "Sleight of Hand", "Spot Hidden"],
  Scholar: ["Awareness", "Beast Lore", "Bushcraft", "Evade", "Healing", "Languages", "Myths & Legends", "Spot Hidden"],
  Thief: ["Acrobatics", "Awareness", "Bluffing", "Evade", "Knives", "Sleight of Hand", "Sneaking", "Spot Hidden"]
};

const getAgeSkillBonus = (age: string) => {
  switch (age) {
    case 'Young': return 2;
    case 'Adult': return 4;
    case 'Old': return 6;
    default: return 0;
  }
};

export function TrainedSkillsSelection() {
  const { character, updateCharacter } = useCharacterCreation();
  const [selectedProfessionSkills, setSelectedProfessionSkills] = useState<string[]>([]);
  const [selectedAdditionalSkills, setSelectedAdditionalSkills] = useState<string[]>([]);
  const [step, setStep] = useState<'profession' | 'additional'>('profession');
  const [skillFilter, setSkillFilter] = useState<'all' | 'combat' | 'general'>('all');

  // Get available profession skills
  const getAvailableProfessionSkills = () => {
    if (!character.profession) return [];
    
    if (character.profession === 'Mage') {
      const mageSchool = character.magicSchool;
      if (!mageSchool) return [];
      return (professionSkills.Mage as Record<string, string[]>)[mageSchool];
    }
    
    return professionSkills[character.profession as keyof typeof professionSkills] as string[];
  };

  // Get remaining available skills
  const getRemainingSkills = () => {
    const availableSkills = allSkills.filter(skill => 
      !selectedProfessionSkills.includes(skill.name) &&
      !selectedAdditionalSkills.includes(skill.name)
    );

    if (skillFilter === 'combat') {
      return availableSkills.filter(skill => 
        ['Axes', 'Bows', 'Brawling', 'Crossbows', 'Hammers', 'Knives', 'Slings', 'Spears', 'Staves', 'Swords'].includes(skill.name)
      );
    } else if (skillFilter === 'general') {
      return availableSkills.filter(skill => 
        !['Axes', 'Bows', 'Brawling', 'Crossbows', 'Hammers', 'Knives', 'Slings', 'Spears', 'Staves', 'Swords'].includes(skill.name)
      );
    }

    return availableSkills;
  };

  const handleSkillSelection = (skillName: string, type: 'profession' | 'additional') => {
    if (type === 'profession') {
      if (selectedProfessionSkills.includes(skillName)) {
        setSelectedProfessionSkills(prev => prev.filter(name => name !== skillName));
      } else if (selectedProfessionSkills.length < 6) {
        setSelectedProfessionSkills(prev => [...prev, skillName]);
      }
    } else {
      if (selectedAdditionalSkills.includes(skillName)) {
        setSelectedAdditionalSkills(prev => prev.filter(name => name !== skillName));
      } else if (selectedAdditionalSkills.length < getAgeSkillBonus(character.age || '')) {
        setSelectedAdditionalSkills(prev => [...prev, skillName]);
      }
    }
  };

  const handleContinue = () => {
    if (step === 'profession' && selectedProfessionSkills.length === 6) {
      setStep('additional');
    } else if (step === 'additional') {
      updateCharacter({
        trainedSkills: [...selectedProfessionSkills, ...selectedAdditionalSkills]
      });
    }
  };

  const renderSkillCard = (skill: Skill, isSelected: boolean, type: 'profession' | 'additional') => (
    <div
      key={skill.name}
      onClick={() => handleSkillSelection(skill.name, type)}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className={`w-5 h-5 ${
          isSelected ? 'text-blue-500' : 'text-gray-400'
        }`} />
        <div>
          <h5 className="font-medium">{skill.name}</h5>
          <span className="text-xs text-gray-500">{skill.attribute}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600">{skill.description}</p>
    </div>
  );

  if (!character.profession || !character.age) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">
          Please select a profession and age before choosing skills.
        </p>
      </div>
    );
  }

  if (character.profession === 'Mage' && !character.magicSchool) {
    return (
      <div className="p-6">
        <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">Magic School Required</h4>
            <p className="text-sm text-amber-700">
              Please select a magic school in the Profession step before choosing skills.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const availableProfessionSkills = getAvailableProfessionSkills();
  const professionSkillsData = allSkills.filter(skill => 
    availableProfessionSkills.includes(skill.name)
  );

  return (
    <div className="space-y-6">
      <div className="prose">
        <h3 className="text-xl font-bold mb-4">Select Skills</h3>
        <p className="text-gray-600">
          {step === 'profession' 
            ? "Choose 6 skills from your profession's available skills."
            : `Choose ${getAgeSkillBonus(character.age)} additional skills based on your age.`
          }
        </p>
      </div>

      {/* Selection Progress */}
      <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-800">Selection Progress</h4>
          <p className="text-sm text-blue-700">
            {step === 'profession'
              ? `Professional Skills: ${selectedProfessionSkills.length}/6`
              : `Additional Skills: ${selectedAdditionalSkills.length}/${getAgeSkillBonus(character.age)}`
            }
          </p>
        </div>
      </div>

      {/* Skill Filter (only for additional skills) */}
      {step === 'additional' && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value as 'all' | 'combat' | 'general')}
            className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Skills</option>
            <option value="combat">Combat Skills</option>
            <option value="general">General Skills</option>
          </select>
        </div>
      )}

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {step === 'profession'
          ? professionSkillsData.map(skill => 
              renderSkillCard(
                skill,
                selectedProfessionSkills.includes(skill.name),
                'profession'
              )
            )
          : getRemainingSkills().map(skill =>
              renderSkillCard(
                skill,
                selectedAdditionalSkills.includes(skill.name),
                'additional'
              )
            )
        }
      </div>

      {/* Selection Warning */}
      {((step === 'profession' && selectedProfessionSkills.length < 6) ||
        (step === 'additional' && selectedAdditionalSkills.length < getAgeSkillBonus(character.age))) && (
        <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">Incomplete Selection</h4>
            <p className="text-sm text-amber-700">
              {step === 'profession'
                ? "Please select 6 professional skills to continue."
                : `Please select ${getAgeSkillBonus(character.age)} additional skills based on your age.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Continue/Save Button */}
      <button
        onClick={handleContinue}
        disabled={
          (step === 'profession' && selectedProfessionSkills.length < 6) ||
          (step === 'additional' && selectedAdditionalSkills.length < getAgeSkillBonus(character.age))
        }
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CheckCircle2 className="w-5 h-5" />
        {step === 'profession' ? 'Continue to Additional Skills' : 'Save Skill Selections'}
      </button>
    </div>
  );
}
