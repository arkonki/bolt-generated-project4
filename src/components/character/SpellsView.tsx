import React, { useState } from 'react';
import { Character } from '../../types/character';
import { useCharacterSpells } from '../../hooks/useMagic';
import { Sparkles, Book, AlertCircle, Info, Filter } from 'lucide-react';
import { Spell } from '../../types/magic';

interface SpellsViewProps {
  character: Character;
  onUpdate: (character: Character) => void;
}

export function SpellsView({ character, onUpdate }: SpellsViewProps) {
  const { generalSpells, schoolSpells, loading, error } = useCharacterSpells(character.id || '');
  const [filter, setFilter] = useState<'all' | 'general' | 'school'>('all');

  if (!character.magicSchool) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">This character does not have access to magic.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading spells...</p>
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

  const renderSpell = (spell: Spell) => (
    <div key={spell.id} className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-lg">{spell.name}</h4>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          spell.rank === 0 
            ? 'bg-gray-100 text-gray-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {spell.rank === 0 ? 'Trick' : `Rank ${spell.rank}`}
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-gray-600">{spell.description}</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Casting Time:</span>{' '}
            <span className="text-gray-900">{spell.castingTime}</span>
          </div>
          <div>
            <span className="text-gray-500">Range:</span>{' '}
            <span className="text-gray-900">{spell.range}</span>
          </div>
          <div>
            <span className="text-gray-500">Duration:</span>{' '}
            <span className="text-gray-900">{spell.duration}</span>
          </div>
          {spell.willpowerCost > 0 && (
            <div>
              <span className="text-gray-500">WP Cost:</span>{' '}
              <span className="text-gray-900">{spell.willpowerCost}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const filteredSpells = {
    general: generalSpells.filter(spell => filter === 'all' || filter === 'general'),
    school: schoolSpells.filter(spell => filter === 'all' || filter === 'school')
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            Spells & Magic
          </h2>
          <p className="text-gray-600">
            {character.magicSchool} Magic • {character.profession}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'general' | 'school')}
            className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Spells</option>
            <option value="general">General Magic</option>
            <option value="school">School Spells</option>
          </select>
        </div>
      </div>

      {/* Magic School Info */}
      <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-800">Magic School: {character.magicSchool}</h4>
          <p className="text-sm text-blue-700">
            As a {character.magicSchool} mage, you can cast both general magic and {character.magicSchool.toLowerCase()} spells.
            Magic tricks don't cost Willpower Points, but more powerful spells do.
          </p>
        </div>
      </div>

      {/* General Magic */}
      {filteredSpells.general.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Book className="w-5 h-5 text-gray-600" />
            General Magic
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSpells.general.map(renderSpell)}
          </div>
        </div>
      )}

      {/* School Spells */}
      {filteredSpells.school.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            {character.magicSchool} Spells
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSpells.school.map(renderSpell)}
          </div>
        </div>
      )}
    </div>
  );
}
