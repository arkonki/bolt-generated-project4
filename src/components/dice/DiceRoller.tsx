import React, { useState } from 'react';
import { Dices, RotateCcw, ArrowRight, History, Plus, Shield, Sword, X } from 'lucide-react';
import { Button } from '../shared/Button';

type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

interface DiceRoll {
  type: DiceType;
  results: number[];
  success?: boolean;
  sum?: number;
  timestamp: Date;
  pushed?: boolean;
  hasBoon?: boolean;
  hasBane?: boolean;
  skillValue?: number;
}

interface DiceGroup {
  type: DiceType;
  count: number;
}

export function DiceRoller() {
  const [selectedDice, setSelectedDice] = useState<DiceType>('d20');
  const [quantity, setQuantity] = useState(1);
  const [rollHistory, setRollHistory] = useState<DiceRoll[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [canPush, setCanPush] = useState(false);
  const [showSum, setShowSum] = useState(false);
  const [hasBoon, setHasBoon] = useState(false);
  const [hasBane, setHasBane] = useState(false);
  const [diceGroups, setDiceGroups] = useState<DiceGroup[]>([]);
  const [skillValue, setSkillValue] = useState<number>(0);

  const diceTypes: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];

  const rollDice = (groups: DiceGroup[], isPush: boolean = false) => {
    const results: number[] = [];
    let totalSum = 0;

    groups.forEach(group => {
      const sides = parseInt(group.type.substring(1));
      for (let i = 0; i < group.count; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        results.push(roll);
        totalSum += roll;
      }
    });

    const isD20Roll = groups.some(g => g.type === 'd20');
    let success = undefined;
    if (isD20Roll && skillValue > 0) {
      const d20Result = results[results.length - 1];
      success = d20Result <= skillValue;

      if (d20Result === 1 || d20Result === 20) {
        onDragonDemonRoll(d20Result === 1);
      }
    }

    const newRoll: DiceRoll = {
      type: groups[0].type,
      results,
      success,
      sum: totalSum,
      timestamp: new Date(),
      pushed: isPush,
      hasBoon,
      hasBane,
      skillValue: isD20Roll ? skillValue : undefined
    };

    setLastRoll(newRoll);
    setRollHistory(prev => [newRoll, ...prev]);
    setCanPush(!isPush && isD20Roll);
    setShowSum(false);
  };

  const addDiceGroup = () => {
    setDiceGroups([...diceGroups, { type: 'd20', count: 1 }]);
  };

  const removeDiceGroup = (index: number) => {
    setDiceGroups(diceGroups.filter((_, i) => i !== index));
  };

  const updateDiceGroup = (index: number, field: keyof DiceGroup, value: any) => {
    const newGroups = [...diceGroups];
    newGroups[index] = { ...newGroups[index], [field]: value };
    setDiceGroups(newGroups);
  };

  const pushRoll = () => {
    if (lastRoll && !lastRoll.pushed) {
      rollDice([{ type: lastRoll.type, count: 1 }], true);
      setCanPush(false);
    }
  };

  const clearHistory = () => {
    setRollHistory([]);
    setLastRoll(null);
    setCanPush(false);
    setShowSum(false);
  };

  const calculateSum = (results: number[]) => {
    return results.reduce((a, b) => a + b, 0);
  };

  const onDragonDemonRoll = (isDragon: boolean) => {
    // Placeholder for skill marking logic
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Dices className="w-6 h-6 text-blue-600" />
          Dice Roller
        </h2>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <History className="w-4 h-4" />
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {/* Dice Groups */}
          <div className="space-y-4 mb-4">
            {diceGroups.map((group, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={group.type}
                  onChange={(e) => updateDiceGroup(index, 'type', e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  {diceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={group.count}
                  onChange={(e) => updateDiceGroup(index, 'count', parseInt(e.target.value))}
                  className="w-20 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={() => removeDiceGroup(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            <Button
              variant="secondary"
              icon={Plus}
              onClick={addDiceGroup}
              className="w-full"
            >
              Add Dice
            </Button>
          </div>

          {/* Skill Value Input (for d20 rolls) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skill Value (for d20 rolls)
            </label>
            <input
              type="number"
              min="0"
              max="18"
              value={skillValue}
              onChange={(e) => setSkillValue(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Boon/Bane Toggles */}
          <div className="flex gap-4 mb-4">
            <Button
              variant={hasBoon ? "primary" : "secondary"}
              icon={Shield}
              onClick={() => {
                setHasBoon(!hasBoon);
                if (!hasBoon) setHasBane(false);
              }}
            >
              Boon
            </Button>
            <Button
              variant={hasBane ? "primary" : "secondary"}
              icon={Sword}
              onClick={() => {
                setHasBane(!hasBane);
                if (!hasBane) setHasBoon(false);
              }}
            >
              Bane
            </Button>
          </div>

          {/* Roll Button */}
          <div className="flex gap-2">
            <button
              onClick={() => rollDice(diceGroups, false)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Dices className="w-5 h-5" />
              Roll Dice
            </button>
            {canPush && (
              <button
                onClick={pushRoll}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                <ArrowRight className="w-5 h-5" />
                Push
              </button>
            )}
          </div>

          {/* Last Roll Result */}
          {lastRoll && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Results {lastRoll.hasBoon && "(with Boon)"} {lastRoll.hasBane && "(with Bane)"}:
                </p>
                <div className="flex flex-wrap gap-2 justify-center mb-2">
                  {lastRoll.results.map((result, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center justify-center w-8 h-8 bg-white border rounded-lg font-medium ${
                        result === 1 ? 'border-green-500 text-green-700' :
                        result === 20 ? 'border-red-500 text-red-700' :
                        'border-gray-300 text-gray-700'
                      }`}
                    >
                      {result}
                    </span>
                  ))}
                </div>
                {lastRoll.success !== undefined && (
                  <p className={`text-lg font-bold ${
                    lastRoll.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {lastRoll.success ? 'Success!' : 'Failure'}
                  </p>
                )}
                {!showSum && lastRoll.results.length > 1 && (
                  <button
                    onClick={() => setShowSum(true)}
                    className="flex items-center gap-1 mx-auto text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Calculate Sum
                  </button>
                )}
                {showSum && (
                  <p className="text-lg font-bold text-blue-600">
                    Total: {calculateSum(lastRoll.results)}
                  </p>
                )}
                {lastRoll.pushed && (
                  <p className="text-sm text-amber-600 mt-1">Pushed Roll</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Roll History */}
        {showHistory && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Roll History</h3>
              <button
                onClick={clearHistory}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <RotateCcw className="w-4 h-4" />
                Clear
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {rollHistory.length > 0 ? (
                <div className="space-y-2">
                  {rollHistory.map((roll, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg ${
                        roll.pushed ? 'bg-amber-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{roll.type}</span>
                        <span className="text-sm text-gray-600">
                          {roll.pushed && '(Pushed)'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {roll.results.map((result, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center justify-center w-6 h-6 bg-white border border-gray-300 rounded text-sm"
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                      {roll.results.length > 1 && (
                        <p className="text-sm text-gray-600">
                          Sum: {calculateSum(roll.results)}
                        </p>
                      )}
                      <div className="text-xs text-gray-500">
                        {roll.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No rolls yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
