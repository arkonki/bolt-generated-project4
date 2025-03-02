import React from 'react';
import { Shield, Sword, Star } from 'lucide-react';
import { Character } from '../../types/character';
import { findEquipment } from '../../lib/equipment';
import { HeroicAbilitiesTable } from './HeroicAbilitiesTable';

interface EquipmentSectionProps {
  character: Character;
  onUpdate: (character: Character) => void;
}

export function EquipmentSection({ character, onUpdate }: EquipmentSectionProps) {
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
    <div className="grid grid-cols-12 gap-6">
      {/* Armor Section */}
      <div className="col-span-12 md:col-span-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Armor (AR: {calculateArmorRating()})
          </h3>
          
          <div className="space-y-4">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weapons Section */}
      <div className="col-span-12 md:col-span-7">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sword className="w-5 h-5 text-blue-600" />
            Weapons & Shields
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
                      <div className="flex flex-wrap gap-1">
                        {weapon.features.map((feature, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {character.equipment.equipped.weapons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                      No weapons equipped
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Heroic Abilities Section */}
      <div className="col-span-12 md:col-span-5">
        <HeroicAbilitiesTable character={character} onUpdate={onUpdate} />
      </div>
    </div>
  );
}
