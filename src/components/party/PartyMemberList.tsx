import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Character } from '../../types/character';
import { Shield, Heart, Zap, Sword } from 'lucide-react';
import { Button } from '../shared/Button';

interface PartyMemberListProps {
  party: {
    id: string;
    members: Character[];
  };
  onUpdate: () => void;
}

export function PartyMemberList({ party, onUpdate }: PartyMemberListProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {party.members.map((member) => (
        <div
          key={member.id}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold">{member.name}</h3>
              <p className="text-gray-600">
                {member.kin} {member.profession}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate(`/character/${member.id}`)}
            >
              View Sheet
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span>
                {member.currentHP}/{member.attributes.CON} HP
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <span>
                {member.currentWP}/{member.attributes.WIL} WP
              </span>
            </div>
          </div>

          {/* Conditions */}
          {Object.entries(member.conditions).some(([_, value]) => value) && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Conditions:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(member.conditions).map(([condition, active]) => 
                  active && (
                    <span
                      key={condition}
                      className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800"
                    >
                      {condition}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* Equipment Overview */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Equipment:</h4>
            <div className="space-y-1">
              {member.equipment.equipped.armor && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span>{member.equipment.equipped.armor}</span>
                </div>
              )}
              {member.equipment.equipped.weapons.map((weapon, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Sword className="w-4 h-4 text-gray-500" />
                  <span>{weapon.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
