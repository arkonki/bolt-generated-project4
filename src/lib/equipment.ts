import { equipment as equipmentData } from '../data/equipment';

export interface Equipment {
  name: string;
  cost: string;
  supply: string;
  weight: number | string;
  effect?: string;
  armor_rating?: number | string;
  grip?: string;
  strength_requirement?: string | number;
  range?: string | number;
  damage?: string;
  durability?: number | string;
  features?: string[];
}

export function findEquipment(name: string): Equipment | undefined {
  for (const category of Object.values(equipmentData)) {
    const found = category.find(item => item.name === name);
    if (found) return found;
  }
  return undefined;
}

export function parseCost(cost: string): { gold: number; silver: number; copper: number } {
  const parts = cost.toLowerCase().split(' ');
  const result = { gold: 0, silver: 0, copper: 0 };

  for (let i = 0; i < parts.length; i += 2) {
    const value = parseInt(parts[i]);
    const unit = parts[i + 1];

    if (unit.startsWith('gold') || unit.startsWith('g')) {
      result.gold = value;
    } else if (unit.startsWith('silver') || unit.startsWith('s')) {
      result.silver = value;
    } else if (unit.startsWith('copper') || unit.startsWith('c')) {
      result.copper = value;
    }
  }

  return result;
}

export function formatCost(cost: { gold: number; silver: number; copper: number }): string {
  const parts = [];
  if (cost.gold > 0) parts.push(`${cost.gold} gold`);
  if (cost.silver > 0) parts.push(`${cost.silver} silver`);
  if (cost.copper > 0) parts.push(`${cost.copper} copper`);
  return parts.join(', ') || '0 copper';
}
