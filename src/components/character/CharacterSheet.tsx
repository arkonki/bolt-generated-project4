import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Character } from '../../types/character';
import { supabase } from '../../lib/supabase';
import { calculateMovement } from '../../lib/movement';
import {
  Shield, 
  Heart, 
  Swords, 
  Brain, 
  Zap, 
  Users,
  Moon,
  Sun,
  Clock,
  Skull,
  Package,
  Book,
  GraduationCap,
  Star,
  X
} from 'lucide-react';
import { useDice } from '../dice/DiceContext';
import { SkillsModal } from './modals/SkillsModal';
import { SpellcastingView } from './SpellcastingView';
import { InventoryModal } from './InventoryModal';
import { EquipmentSection } from './EquipmentSection';
import { findEquipment } from '../../lib/equipment'; // Adjust the path as needed

interface CharacterSheetProps {
  character: Character;
  onUpdate: (character: Character) => void;
}

interface DeathSaveState {
  successes: boolean[];
  failures: boolean[];
}

export function CharacterSheet({ character, onUpdate }: CharacterSheetProps) {
  const navigate = useNavigate();
  const { toggleDiceRoller } = useDice();
  const [showSpellcastingModal, setShowSpellcastingModal] = useState(false);
  const [showRestDialog, setShowRestDialog] = useState<'round' | 'stretch' | 'shift' | null>(null);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showEquipModal, setShowEquipModal] = useState(false);
  const [healingRoll, setHealingRoll] = useState<number | null>(null);
  const [healerPresent, setHealerPresent] = useState(false);
  const [deathSaves, setDeathSaves] = useState<DeathSaveState>({
    successes: [false, false, false],
    failures: [false, false, false]
  });

  const getBaseChance = (value: number): number => {
    if (value <= 5) return 3;
    if (value <= 8) return 4;
    if (value <= 12) return 5;
    if (value <= 15) return 6;
    return 7;
  };

  const handleConditionToggle = async (condition: keyof typeof character.conditions) => {
    try {
      const newConditions = {
        ...character.conditions,
        [condition]: !character.conditions[condition]
      };

      const { error } = await supabase
        .from('characters')
        .update({ conditions: newConditions })
        .eq('id', character.id);

      if (error) throw error;

      onUpdate({
        ...character,
        conditions: newConditions
      });
    } catch (err) {
      console.error('Error updating condition:', err);
    }
  };

  const handleRest = async (type: 'round' | 'stretch' | 'shift') => {
    try {
      let updates: Partial<Character> = {};
      
      switch (type) {
        case 'round':
          // Roll D6 for WP recovery
          const wpRecovery = Math.floor(Math.random() * 6) + 1;
          const newWP = Math.min(character.attributes.WIL, (character.currentWP || character.attributes.WIL) + wpRecovery);
          updates = { currentWP: newWP };
          break;

        case 'stretch':
          // Roll for HP recovery (1D6 or 2D6 if healer present)
          const diceCount = healerPresent ? 2 : 1;
          const hpRecovery = Array(diceCount)
            .fill(0)
            .reduce((sum) => sum + Math.floor(Math.random() * 6) + 1, 0);
          const newHP = Math.min(character.attributes.CON, (character.currentHP || character.attributes.CON) + hpRecovery);
          setHealingRoll(hpRecovery);
          updates = { currentHP: newHP };
          break;

        case 'shift':
          // Recover all HP, WP and conditions
          updates = {
            currentHP: character.attributes.CON,
            currentWP: character.attributes.WIL,
            conditions: {
              exhausted: false,
              sickly: false,
              dazed: false,
              angry: false,
              scared: false,
              disheartened: false
            }
          };
          break;
      }

      const { error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', character.id);

      if (error) throw error;

      onUpdate({
        ...character,
        ...updates
      });

      setShowRestDialog(null);
      setHealingRoll(null);
      setHealerPresent(false);
    } catch (err) {
      console.error('Error during rest:', err);
    }
  };

  const renderAttribute = (
    name: string, 
    value: number, 
    icon: React.ReactNode, 
    condition: keyof typeof character.conditions
  ) => (
    <div className="relative">
      <div className="p-4 bg-gray-800 rounded-lg text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">{name}</span>
          <span className="text-xl">{value}</span>
        </div>
        <div className="text-sm">
          {(name === 'STR' || name === 'AGL') && value > 12 && (
            <div className="text-blue-400">
              Damage Bonus: {value <= 15 ? '+D4' : '+D6'}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={() => handleConditionToggle(condition)}
        className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-sm font-medium ${
          character.conditions[condition]
            ? 'bg-red-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {condition}
      </button>
    </div>
  );

  const renderRestDialog = () => {
    if (!showRestDialog) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-lg font-semibold mb-4">
            {showRestDialog === 'round' && 'Round Rest'}
            {showRestDialog === 'stretch' && 'Stretch Rest'}
            {showRestDialog === 'shift' && 'Shift Rest'}
          </h3>

          {showRestDialog === 'stretch' && (
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={healerPresent}
                  onChange={(e) => setHealerPresent(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Healer present with successful HEALING roll</span>
              </label>
            </div>
          )}

          {healingRoll && (
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
              Recovered {healingRoll} HP
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              onClick={() => {
                setShowRestDialog(null);
                setHealingRoll(null);
                setHealerPresent(false);
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => handleRest(showRestDialog)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Rest
            </button>
          </div>
        </div>
      </div>
    );
  };

  const canCastSpells = () => {
    return (
      character.profession === 'Mage' ||
      character.trainedSkills.some(skill => 
        ['ELEMENTALISM', 'ANIMISM', 'MENTALISM'].includes(skill.toUpperCase())
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* First Row: Character Info and Action Buttons */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{character.name}</h1>
          <p className="text-gray-600">
            {character.kin} {character.profession}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowInventoryModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Package className="w-5 h-5" />
            Inventory
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRestDialog('shift')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Clock className="w-5 h-5" />
              Shift Rest
            </button>
            <button
              onClick={() => setShowRestDialog('stretch')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              <Sun className="w-5 h-5" />
              Stretch Rest
            </button>
            <button
              onClick={() => setShowRestDialog('round')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Moon className="w-5 h-5" />
              Round Rest
            </button>
          </div>
        </div>
      </div>

      {/* Second Row: Attributes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {renderAttribute('STR', character.attributes.STR, <Shield />, 'exhausted')}
        {renderAttribute('CON', character.attributes.CON, <Heart />, 'sickly')}
        {renderAttribute('AGL', character.attributes.AGL, <Swords />, 'dazed')}
        {renderAttribute('INT', character.attributes.INT, <Brain />, 'angry')}
        {renderAttribute('WIL', character.attributes.WIL, <Zap />, 'scared')}
        {renderAttribute('CHA', character.attributes.CHA, <Users />, 'disheartened')}
      </div>

      {/* Third Row: Skills, Movement, HP, and WP */}
      <div className="grid grid-cols-12 gap-4">
        {/* Skills and Movement */}
        <div className="col-span-6 flex items-center gap-4">
          <button
            onClick={() => setShowSkillsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Book className="w-5 h-5" />
            Skills
          </button>
          {canCastSpells() && (
            <button
              onClick={() => setShowSpellcastingModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Sparkles className="w-5 h-5" />
              Spells
            </button>
          )}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg">
            <span className="font-medium">Movement:</span>
            <span className="font-bold text-xl">
              {calculateMovement(character.kin, character.attributes.AGL)}
            </span>
          </div>
        </div>

        {/* HP and WP */}
        <div className="col-span-6 grid grid-cols-2 gap-4">
          {/* HP */}
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-600" />
                HP
              </h3>
              <span className="text-base font-medium">
                {character.currentHP ?? character.attributes.CON} / {character.attributes.CON}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const newHP = Math.max(0, (character.currentHP ?? character.attributes.CON) - 1);
                  const { error } = await supabase
                    .from('characters')
                    .update({ currentHP: newHP })
                    .eq('id', character.id);
                  if (!error) {
                    onUpdate({ ...character, currentHP: newHP });
                  }
                }}
                className="flex-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                disabled={(character.currentHP ?? character.attributes.CON) === 0}
              >
                -
              </button>
              <button
                onClick={async () => {
                  const newHP = Math.min(
                    character.attributes.CON,
                    (character.currentHP ?? character.attributes.CON) + 1
                  );
                  const { error } = await supabase
                    .from('characters')
                    .update({ currentHP: newHP })
                    .eq('id', character.id);
                  if (!error) {
                    onUpdate({ ...character, currentHP: newHP });
                  }
                }}
                className="flex-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                disabled={(character.currentHP ?? character.attributes.CON) === character.attributes.CON}
              >
                +
              </button>
            </div>
          </div>
          {/* WP */}
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold flex items-center gap-1">
                <Zap className="w-4 h-4 text-blue-600" />
                WP
              </h3>
              <span className="text-base font-medium">
                {character.currentWP ?? character.attributes.WIL} / {character.attributes.WIL}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const newWP = Math.max(0, (character.currentWP ?? character.attributes.WIL) - 1);
                  const { error } = await supabase
                    .from('characters')
                    .update({ currentWP: newWP })
                    .eq('id', character.id);
                  if (!error) {
                    onUpdate({ ...character, currentWP: newWP });
                  }
                }}
                className="flex-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                disabled={(character.currentWP ?? character.attributes.WIL) === 0}
              >
                -
              </button>
              <button
                onClick={async () => {
                  const newWP = Math.min(
                    character.attributes.WIL,
                    (character.currentWP ?? character.attributes.WIL) + 1
                  );
                  const { error } = await supabase
                    .from('characters')
                    .update({ currentWP: newWP })
                    .eq('id', character.id);
                  if (!error) {
                    onUpdate({ ...character, currentWP: newWP });
                  }
                }}
                className="flex-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                disabled={(character.currentWP ?? character.attributes.WIL) === character.attributes.WIL}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Section */}
      <EquipmentSection character={character} onUpdate={onUpdate} />

      {/* Modals */}
      {showSkillsModal && (
        <SkillsModal
          character={character}
          onClose={() => setShowSkillsModal(false)}
        />
      )}
      
      {showSpellcastingModal && (
        <SpellcastingView
          character={character}
          onClose={() => setShowSpellcastingModal(false)}
          onUpdate={onUpdate}
        />
      )}

      {showInventoryModal && (
        <InventoryModal
          character={character}
          onClose={() => setShowInventoryModal(false)}
          onUpdate={onUpdate}
        />
      )}

      {renderRestDialog()}
    </div>
  );
}
