import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Character } from '../../types/character';
import { Sparkles, AlertCircle, Info, Filter } from 'lucide-react';
import { Button } from '../shared/Button';
import { useSpells, DBSpell } from '../../hooks/useSpells';

interface SpellcastingViewProps {
  character: Character;
  onClose: () => void;
  onUpdate: (character: Character) => void;
}

export function SpellcastingView({ character, onClose, onUpdate }: SpellcastingViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'general' | 'school'>('all');
  const { generalSpells, schoolSpells, loading: spellsLoading, error: spellsError } = useSpells(character.id!);

  const handleCastSpell = async (spell: DBSpell) => {
    try {
      setLoading(true);
      setError(null);

      const currentWP = character.currentWP ?? character.attributes.WIL;
      if (currentWP < spell.willpower_cost) {
        setError('Insufficient Willpower Points');
        return;
      }

      const newWP = currentWP - spell.willpower_cost;

      const { error: updateError } = await supabase
        .from('characters')
        .update({ current_wp: newWP })
        .eq('id', character.id);

      if (updateError) throw updateError;

      onUpdate({
        ...character,
        currentWP: newWP
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cast spell');
    } finally {
      setLoading(false);
    }
  };

  const filteredSpells = [...generalSpells, ...schoolSpells].filter(spell => {
    if (filter === 'general') return spell.school_id === null;
    if (filter === 'school') return spell.school_id !== null;
    return true;
  });

  if (spellsLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <p className="text-gray-600">Loading spells...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                Spellcasting
              </h2>
              <p className="text-gray-600">
                Current WP: {character.currentWP ?? character.attributes.WIL}/{character.attributes.WIL}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
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

          {spellsError && (
            <div className="mb-6 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-700">{spellsError}</p>
              </div>
            </div>
          )}

          {/* Spellcasting Info */}
          <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Spellcasting</h4>
              <p className="text-sm text-blue-700">
                Each spell requires Willpower Points (WP) to cast. Make sure you have enough WP before attempting to cast a spell.
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-4 flex items-center gap-2">
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

          {/* Spells Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="px-4 py-2">Spell</th>
                  <th className="px-4 py-2">School</th>
                  <th className="px-4 py-2">Rank</th>
                  <th className="px-4 py-2">WP Cost</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSpells.map((spell, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">
                      <div className="group relative">
                        <span className="font-medium">{spell.name}</span>
                        <div className="hidden group-hover:block absolute left-0 top-full mt-2 p-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10 w-64">
                          {spell.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">{spell.magic_schools?.name || 'General Magic'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        spell.rank === 0 
                          ? 'bg-gray-100 text-gray-800' 
                          : spell.rank <= 3
                          ? 'bg-blue-100 text-blue-800'
                          : spell.rank <= 6
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {spell.rank === 0 ? 'Trick' : `Rank ${spell.rank}`}
                      </span>
                    </td>
                    <td className="px-4 py-2">{spell.willpower_cost} WP</td>
                    <td className="px-4 py-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCastSpell(spell)}
                        loading={loading}
                        disabled={loading || (character.currentWP ?? character.attributes.WIL) < spell.willpower_cost}
                      >
                        Cast
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredSpells.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                      No spells available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
