import React from 'react';
import { DiceRoller } from './DiceRoller';
import { useDice } from './DiceContext';
import { X } from 'lucide-react';

export function DiceRollerModal() {
  const { showDiceRoller, toggleDiceRoller } = useDice();

  if (!showDiceRoller) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-end">
            <button
              onClick={toggleDiceRoller}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <DiceRoller />
        </div>
      </div>
    </div>
  );
}
