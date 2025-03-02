import React, { useState } from 'react';
import { Swords, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Character } from '../../types/character';
import { Button } from '../shared/Button';

interface HeroicAbility {
  name: string;
  description: string;
  willpowerCost: number;
}

interface HeroicAbilitiesTableProps {
  character: Character;
  onUpdate: (character: Character) => void;
}

export function HeroicAbilitiesTable({ character, onUpdate }: HeroicAbilitiesTableProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get heroic ability based on profession
  const getHeroicAbility = (): HeroicAbility | null => {
    if (character.profession === 'Mage') return null;

    const abilities: Record<string, HeroicAbility> = {
      Fighter: {
        name: 'Veteran',
        description: 'Your combat experience allows you to perform devastating attacks.',
        willpowerCost: 3
      },
      Hunter: {
        name: 'Companion',
        description: 'You have a loyal animal companion that aids you in your adventures.',
        willpowerCost: 3
      },
      Knight: {
        name: 'Guardian',
        description: 'You can protect allies from harm by intercepting attacks meant for them.',
        willpowerCost: 3
      },
      Thief: {
        name: 'Backstabbing',
        description: 'You can perform devastating attacks when striking from hiding.',
        willpowerCost: 3
      },
      Bard: {
        name: 'Musician',
        description: 'Your music can inspire allies, granting them bonuses to their actions.',
        willpowerCost: 3
      },
      Mariner: {
        name: 'Sea Legs',
        description: 'You excel at maintaining balance and fighting on unstable surfaces.',
        willpowerCost: 3
      },
      Merchant: {
        name: 'Treasure Hunter',
        description: 'Your keen eye helps you spot valuable items and hidden treasures.',
        willpowerCost: 3
      },
      Scholar: {
        name: 'Intuition',
        description: 'Your scholarly knowledge grants you insights into various situations.',
        willpowerCost: 3
      }
    };

    return abilities[character.profession] || null;
  };

  const ability = getHeroicAbility();

  const handleUseAbility = async () => {
    if (!ability) return;

    try {
      setLoading(true);
      setError(null);

      const currentWP = character.currentWP ?? character.attributes.WIL;
      if (currentWP < ability.willpowerCost) {
        setError('Insufficient Willpower Points');
        return;
      }

      const newWP = currentWP - ability.willpowerCost;

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
      setError(err instanceof Error ? err.message : 'Failed to use ability');
    } finally {
      setLoading(false);
    }
  };

  if (!ability) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Swords className="w-5 h-5 text-blue-600" />
        Heroic Ability
      </h3>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-2">Ability</th>
              <th className="px-4 py-2">WP Cost</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2">
                <div className="group relative">
                  <span className="font-medium">{ability.name}</span>
                  <div className="hidden group-hover:block absolute left-0 top-full mt-2 p-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10 w-64">
                    {ability.description}
                  </div>
                </div>
              </td>
              <td className="px-4 py-2">{ability.willpowerCost} WP</td>
              <td className="px-4 py-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUseAbility}
                  loading={loading}
                  disabled={loading || (character.currentWP ?? character.attributes.WIL) < ability.willpowerCost}
                >
                  Use
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
