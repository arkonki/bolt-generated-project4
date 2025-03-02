import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Character } from '../../types/character';
import { Shield, Sword, AlertCircle, Package, X } from 'lucide-react';
import { findEquipment } from '../../data/equipment';

interface EquipmentModalProps {
  character: Character;
  onClose: () => void;
  onUpdate: (character: Character) => void;
}

interface EquippedWeapon {
  name: string;
  grip: '1H' | '2H';
  range: number | string;
  damage: string;
  durability: number;
  features: string[];
}

export function EquipmentModal({ character, onClose, onUpdate }: EquipmentModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleUnequipItem = async (type: 'armor' | 'helmet' | 'weapon', weaponIndex?: number) => {
    try {
      const newEquipment = { ...character.equipment };
      const equipped = newEquipment.equipped;

      if (type === 'weapon' && typeof weaponIndex === 'number') {
        // Add weapon to inventory before removing from equipped
        const weapon = equipped.weapons[weaponIndex];
        newEquipment.inventory.push(weapon.name);
        equipped.weapons.splice(weaponIndex, 1);
      } else if (type === 'armor' && equipped.armor) {
        // Add armor to inventory before removing from equipped
        newEquipment.inventory.push(equipped.armor);
        delete equipped.armor;
      } else if (type === 'helmet' && equipped.helmet) {
        // Add helmet to inventory before removing from equipped
        newEquipment.inventory.push(equipped.helmet);
        delete equipped.helmet;
      }

      const { error: updateError } = await supabase
        .from('characters')
        .update({ equipment: newEquipment })
        .eq('id', character.id);

      if (updateError) throw updateError;

      onUpdate({
        ...character,
        equipment: newEquipment
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unequip item');
    }
  };

  const calculateArmorRating = () => {
    let rating = 0;
    const equipped = character.equipment.equipped;

    if (equipped.armor) {
      const armorData = findEquipment(equipped.armor);
      if (armorData?.armor_rating) {
        rating += Number(armorData.armor_rating);
      }
    }

    if (equipped.helmet) {
      const helmetData = findEquipment(equipped.helmet);
      if (helmetData?.armor_rating) {
        rating += Number(helmetData.armor_rating);
      }
    }

    return rating;
  };

  const getBaneEffects = (itemName: string) => {
    const item = findEquipment(itemName);
    if (!item?.effect) return null;

    const baneMatch = item.effect.match(/Bane on ([^.]+)/);
    return baneMatch ? baneMatch[1] : null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Equipment</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Armor Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Armor (Total Rating: {calculateArmorRating()})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Body Armor */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">Body Armor</h4>
                    {character.equipment.equipped.armor ? (
                      <>
                        <p className="text-lg font-bold">{character.equipment.equipped.armor}</p>
                        {getBaneEffects(character.equipment.equipped.armor) && (
                          <p className="text-sm text-red-600">
                            Bane on: {getBaneEffects(character.equipment.equipped.armor)}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500">No armor equipped</p>
                    )}
                  </div>
                  {character.equipment.equipped.armor && (
                    <button
                      onClick={() => handleUnequipItem('armor')}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Helmet */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">Helmet</h4>
                    {character.equipment.equipped.helmet ? (
                      <>
                        <p className="text-lg font-bold">{character.equipment.equipped.helmet}</p>
                        {getBaneEffects(character.equipment.equipped.helmet) && (
                          <p className="text-sm text-red-600">
                            Bane on: {getBaneEffects(character.equipment.equipped.helmet)}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500">No helmet equipped</p>
                    )}
                  </div>
                  {character.equipment.equipped.helmet && (
                    <button
                      onClick={() => handleUnequipItem('helmet')}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Weapons Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sword className="w-5 h-5 text-blue-600" />
              Weapons
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-2">Weapon</th>
                    <th className="px-4 py-2">Grip</th>
                    <th className="px-4 py-2">Range</th>
                    <th className="px-4 py-2">Damage</th>
                    <th className="px-4 py-2">Durability</th>
                    <th className="px-4 py-2">Features</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {character.equipment.equipped.weapons.map((weapon, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{weapon.name}</td>
                      <td className="px-4 py-2">{weapon.grip}</td>
                      <td className="px-4 py-2">{weapon.range}</td>
                      <td className="px-4 py-2">{weapon.damage}</td>
                      <td className="px-4 py-2">{weapon.durability}</td>
                      <td className="px-4 py-2">
                        {weapon.features.join(', ')}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleUnequipItem('weapon', index)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {character.equipment.equipped.weapons.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                        No weapons equipped
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
