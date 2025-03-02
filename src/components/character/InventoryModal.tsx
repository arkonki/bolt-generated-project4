import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Character } from '../../types/character';
import { 
  Package, 
  Search, 
  Filter, 
  ShoppingBag, 
  Coins, 
  AlertCircle, 
  Shield, 
  Sword,
  ArrowRight,
  Plus,
  Scale,
  X,
  Edit2
} from 'lucide-react';
import { Equipment, equipment, findEquipment, parseCost, formatCost } from '../../data/equipment';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../shared/Button';

interface InventoryModalProps {
  character: Character;
  onClose: () => void;
  onUpdate: (character: Character) => void;
}

export function InventoryModal({ character, onClose, onUpdate }: InventoryModalProps) {
  const { isAdmin, isDM } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'shop' | 'money'>('inventory');
  const [filters, setFilters] = useState({
    search: '',
    category: 'all'
  });
  const [customItem, setCustomItem] = useState<{
    name: string;
    category: string;
    cost: string;
    supply: string;
    weight: number;
    effect: string;
  }>({
    name: '',
    category: 'equipment',
    cost: '1 silver',
    supply: 'Common',
    weight: 1,
    effect: ''
  });
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);

  // Load starting equipment if inventory is empty
  useEffect(() => {
    if (character.startingEquipment && character.equipment.inventory.length === 0) {
      loadStartingEquipment();
    }
  }, []);

  const loadStartingEquipment = async () => {
    try {
      const newEquipment = {
        ...character.equipment,
        inventory: [...character.startingEquipment.items]
      };

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
      setError(err instanceof Error ? err.message : 'Failed to load starting equipment');
    }
  };

  async function loadAvailableCharacters() {
    // Implementation left empty as per original
  }

  const handleMoneyChange = async (type: 'gold' | 'silver' | 'copper', amount: number) => {
    try {
      const newMoney = {
        ...character.equipment.money,
        [type]: Math.max(0, character.equipment.money[type] + amount)
      };

      const newEquipment = {
        ...character.equipment,
        money: newMoney
      };

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
      setError(err instanceof Error ? err.message : 'Failed to update money');
    }
  };

  const handleCreateCustomItem = async () => {
    try {
      if (!customItem.name || !customItem.cost) {
        setError('Name and cost are required');
        return;
      }

      // Check if item can be equipped
      const itemData = findEquipment(customItem.name);
      const canBeEquipped = itemData && (
        itemData.category === 'armor' ||
        itemData.category === 'helmets' ||
        itemData.category === 'melee_weapons' ||
        itemData.category === 'ranged_weapons'
      );

      const newEquipment = {
        ...character.equipment,
        inventory: [...character.equipment.inventory, customItem.name]
      };

      const { error: updateError } = await supabase
        .from('characters')
        .update({ equipment: newEquipment })
        .eq('id', character.id);

      if (updateError) throw updateError;

      onUpdate({
        ...character,
        equipment: newEquipment
      });

      setShowCustomItemForm(false);
      setCustomItem({
        name: '',
        category: 'equipment',
        cost: '1 silver',
        supply: 'Common',
        weight: 1,
        effect: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create custom item');
    }
  };

  const handleEquipItem = async (itemName: string) => {
    try {
      const itemData = findEquipment(itemName);
      if (!itemData) return;

      const newEquipment = { ...character.equipment };

      // Remove from inventory
      newEquipment.inventory = newEquipment.inventory.filter(i => i !== itemName);

      // Add to appropriate equipped slot
      if (itemData.category === 'armor') {
        if (newEquipment.equipped.armor) {
          newEquipment.inventory.push(newEquipment.equipped.armor);
        }
        newEquipment.equipped.armor = itemName;
      } else if (itemData.category === 'helmets') {
        if (newEquipment.equipped.helmet) {
          newEquipment.inventory.push(newEquipment.equipped.helmet);
        }
        newEquipment.equipped.helmet = itemName;
      } else if (itemData.category === 'melee_weapons' || itemData.category === 'ranged_weapons') {
        newEquipment.equipped.weapons.push({
          name: itemName,
          grip: itemData.grip || '1H',
          range: itemData.range || 'melee',
          damage: itemData.damage || 'D6',
          durability: itemData.durability || 6,
          features: itemData.features || []
        });
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
      setError(err instanceof Error ? err.message : 'Failed to equip item');
    }
  };

  const filteredInventory = character.equipment.inventory.filter(item => {
    const matchesSearch = item.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = filters.category === 'all' || findEquipment(item)?.category === filters.category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">{activeTab === 'inventory' ? 'Inventory' : activeTab === 'shop' ? 'Shop' : 'Money'}</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <Coins className="w-4 h-4" />
                {formatCost(character.equipment.money)}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  activeTab === 'inventory'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Package className="w-5 h-5" />
                Inventory
              </button>
              <button
                onClick={() => setActiveTab('shop')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  activeTab === 'shop'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                Shop
              </button>
              <button
                onClick={() => setActiveTab('money')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  activeTab === 'money'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Coins className="w-5 h-5" />
                Money
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {activeTab === 'money' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gold */}
                <div className="p-6 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium mb-4 text-yellow-800">Gold</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleMoneyChange('gold', -1)}
                      className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                    >
                      -1
                    </button>
                    <span className="text-xl font-medium text-yellow-900">
                      {character.equipment.money.gold}
                    </span>
                    <button
                      onClick={() => handleMoneyChange('gold', 1)}
                      className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Silver */}
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-4 text-gray-800">Silver</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleMoneyChange('silver', -1)}
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      -1
                    </button>
                    <span className="text-xl font-medium text-gray-900">
                      {character.equipment.money.silver}
                    </span>
                    <button
                      onClick={() => handleMoneyChange('silver', 1)}
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Copper */}
                <div className="p-6 bg-orange-50 rounded-lg">
                  <h3 className="font-medium mb-4 text-orange-800">Copper</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleMoneyChange('copper', -1)}
                      className="px-3 py-1 bg-orange-200 text-orange-800 rounded hover:bg-orange-300"
                    >
                      -1
                    </button>
                    <span className="text-xl font-medium text-orange-900">
                      {character.equipment.money.copper}
                    </span>
                    <button
                      onClick={() => handleMoneyChange('copper', 1)}
                      className="px-3 py-1 bg-orange-200 text-orange-800 rounded hover:bg-orange-300"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>

              {(isAdmin || isDM) && (
                <div className="mt-8">
                  <h3 className="font-medium mb-4">Quick Add</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => handleMoneyChange('gold', 10)}
                      className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
                    >
                      +10 Gold
                    </button>
                    <button
                      onClick={() => handleMoneyChange('silver', 50)}
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                    >
                      +50 Silver
                    </button>
                    <button
                      onClick={() => handleMoneyChange('copper', 100)}
                      className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200"
                    >
                      +100 Copper
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Categories</option>
                    <option value="armor">Armor</option>
                    <option value="weapons">Weapons</option>
                    <option value="equipment">Equipment</option>
                    <option value="tools">Tools</option>
                    <option value="supplies">Supplies</option>
                  </select>
                </div>

                {(isAdmin || isDM) && (
                  <Button
                    variant="secondary"
                    icon={Plus}
                    onClick={() => setShowCustomItemForm(true)}
                  >
                    Custom Item
                  </Button>
                )}
              </div>

              {/* Inventory List */}
              <div className="space-y-4">
                {filteredInventory.map((item, index) => {
                  const itemData = findEquipment(item);
                  const canBeEquipped = itemData && (
                    itemData.category === 'armor' ||
                    itemData.category === 'helmets' ||
                    itemData.category === 'melee_weapons' ||
                    itemData.category === 'ranged_weapons'
                  );

                  return (
                    <div
                      key={`${item}-${index}`}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{item}</h3>
                          {itemData && (
                            <p className="text-sm text-gray-600">
                              {itemData.effect}
                            </p>
                          )}
                        </div>
                        {itemData && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100">
                              {itemData.category}
                            </span>
                            <span className="text-sm text-gray-600">
                              {itemData.cost}
                            </span>
                          </div>
                        )}
                        {canBeEquipped && (
                          <button
                            onClick={() => handleEquipItem(item)}
                            className="ml-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                          >
                            Equip
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredInventory.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-600">
                      {filters.search || filters.category !== 'all'
                        ? 'No items found matching your search criteria.'
                        : 'No items in inventory.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Custom Item Form */}
              {showCustomItemForm && (
                <div className="mb-6 p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Create Custom Item</h3>
                    <button
                      onClick={() => setShowCustomItemForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={customItem.name}
                        onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={customItem.category}
                        onChange={(e) => setCustomItem({ ...customItem, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="equipment">Equipment</option>
                        <option value="weapon">Weapon</option>
                        <option value="armor">Armor</option>
                        <option value="tool">Tool</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost
                      </label>
                      <input
                        type="text"
                        value={customItem.cost}
                        onChange={(e) => setCustomItem({ ...customItem, cost: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="e.g., 1 gold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weight
                      </label>
                      <input
                        type="number"
                        value={customItem.weight}
                        onChange={(e) => setCustomItem({ ...customItem, weight: Number(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Effect/Description
                      </label>
                      <textarea
                        value={customItem.effect}
                        onChange={(e) => setCustomItem({ ...customItem, effect: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-4">
                    <Button
                      variant="secondary"
                      onClick={() => setShowCustomItemForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      icon={Plus}
                      onClick={handleCreateCustomItem}
                    >
                      Create Item
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
