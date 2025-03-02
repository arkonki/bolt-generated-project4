import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Search, Filter, ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '../shared/Button';
import { Character } from '../../types/character';
import { findEquipment } from '../../data/equipment';

interface PartyInventoryProps {
  partyId: string;
  members: Character[];
  isDM: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  description?: string;
  category?: string;
}

interface TransactionLog {
  id: string;
  item_name: string;
  quantity: number;
  from_type: 'party' | 'character';
  from_id: string;
  to_type: 'party' | 'character';
  to_id: string;
  timestamp: string;
}

export function PartyInventory({ partyId, members, isDM }: PartyInventoryProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [transactionLog, setTransactionLog] = useState<TransactionLog[]>([]);
  const [showTransactionLog, setShowTransactionLog] = useState(false);

  useEffect(() => {
    loadInventory();
    loadTransactionLog();
  }, [partyId]);

  async function loadInventory() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('party_inventory')
        .select('*')
        .eq('party_id', partyId);

      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactionLog() {
    try {
      const { data, error } = await supabase
        .from('party_inventory_log')
        .select('*')
        .eq('party_id', partyId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactionLog(data || []);
    } catch (err) {
      console.error('Failed to load transaction log:', err);
    }
  }

  const handleTransferToCharacter = async () => {
    if (!selectedCharacter || selectedItems.length === 0) return;

    try {
      // Start transaction
      const character = members.find(m => m.id === selectedCharacter);
      if (!character) throw new Error('Character not found');

      for (const itemId of selectedItems) {
        const item = inventory.find(i => i.id === itemId);
        if (!item) continue;

        // Update party inventory
        const { error: updateError } = await supabase
          .from('party_inventory')
          .update({ quantity: item.quantity - 1 })
          .eq('id', item.id);

        if (updateError) throw updateError;

        // Update character inventory
        const newInventory = [...character.equipment.inventory, item.name];
        const { error: characterError } = await supabase
          .from('characters')
          .update({
            equipment: {
              ...character.equipment,
              inventory: newInventory
            }
          })
          .eq('id', character.id);

        if (characterError) throw characterError;

        // Log transaction
        const { error: logError } = await supabase
          .from('party_inventory_log')
          .insert([{
            party_id: partyId,
            item_name: item.name,
            quantity: 1,
            from_type: 'party',
            from_id: partyId,
            to_type: 'character',
            to_id: character.id
          }]);

        if (logError) throw logError;
      }

      // Refresh data
      await Promise.all([
        loadInventory(),
        loadTransactionLog()
      ]);

      setSelectedItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer items');
    }
  };

  const handleTransferToParty = async (characterId: string, itemNames: string[]) => {
    try {
      const character = members.find(m => m.id === characterId);
      if (!character) throw new Error('Character not found');

      for (const itemName of itemNames) {
        // Remove from character inventory
        const newCharacterInventory = character.equipment.inventory.filter(
          item => item !== itemName
        );

        const { error: characterError } = await supabase
          .from('characters')
          .update({
            equipment: {
              ...character.equipment,
              inventory: newCharacterInventory
            }
          })
          .eq('id', character.id);

        if (characterError) throw characterError;

        // Add to party inventory
        const existingItem = inventory.find(i => i.name === itemName);
        if (existingItem) {
          const { error: updateError } = await supabase
            .from('party_inventory')
            .update({ quantity: existingItem.quantity + 1 })
            .eq('id', existingItem.id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('party_inventory')
            .insert([{
              party_id: partyId,
              name: itemName,
              quantity: 1,
              category: findEquipment(itemName)?.category || 'misc'
            }]);

          if (insertError) throw insertError;
        }

        // Log transaction
        const { error: logError } = await supabase
          .from('party_inventory_log')
          .insert([{
            party_id: partyId,
            item_name: itemName,
            quantity: 1,
            from_type: 'character',
            from_id: character.id,
            to_type: 'party',
            to_id: partyId
          }]);

        if (logError) throw logError;
      }

      // Refresh data
      await Promise.all([
        loadInventory(),
        loadTransactionLog()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer items');
    }
  };

  const categories = ['all', ...new Set(inventory.map(item => item.category))];
  
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Party Inventory */}
      <div className="col-span-12 lg:col-span-7">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Party Inventory</h2>
            <Button
              variant="secondary"
              onClick={() => setShowTransactionLog(!showTransactionLog)}
            >
              {showTransactionLog ? 'Hide History' : 'Show History'}
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inventory List */}
          <div className="space-y-4">
            {filteredInventory.map((item) => (
              <div
                key={item.id}
                className={`p-4 border rounded-lg ${
                  selectedItems.includes(item.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                onClick={() => {
                  setSelectedItems(prev =>
                    prev.includes(item.id)
                      ? prev.filter(id => id !== item.id)
                      : [...prev, item.id]
                  );
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.category && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
                {item.description && (
                  <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                )}
              </div>
            ))}

            {filteredInventory.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  {searchTerm || categoryFilter !== 'all'
                    ? 'No items found matching your search criteria.'
                    : 'No items in the party inventory.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Character Inventories & Transfer Controls */}
      <div className="col-span-12 lg:col-span-5">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Transfer Items</h2>

          {/* Character Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Character
            </label>
            <select
              value={selectedCharacter}
              onChange={(e) => setSelectedCharacter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a character...</option>
              {members.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Controls */}
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant="secondary"
              icon={ArrowLeft}
              disabled={!selectedCharacter || selectedItems.length === 0}
              onClick={handleTransferToCharacter}
            >
              To Character
            </Button>
            <Button
              variant="secondary"
              icon={ArrowRight}
              disabled={!selectedCharacter}
              onClick={() => {
                const character = members.find(m => m.id === selectedCharacter);
                if (character) {
                  handleTransferToParty(
                    character.id!,
                    character.equipment.inventory
                  );
                }
              }}
            >
              To Party
            </Button>
          </div>

          {/* Selected Character's Inventory */}
          {selectedCharacter && (
            <div>
              <h3 className="font-medium mb-4">
                {members.find(m => m.id === selectedCharacter)?.name}'s Inventory
              </h3>
              <div className="space-y-2">
                {members
                  .find(m => m.id === selectedCharacter)
                  ?.equipment.inventory.map((item, index) => (
                    <div
                      key={index}
                      className="p-2 border rounded flex items-center justify-between"
                    >
                      <span>{item}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={ArrowRight}
                        onClick={() => handleTransferToParty(selectedCharacter, [item])}
                      >
                        Transfer
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Transaction Log */}
        {showTransactionLog && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Transaction History</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {transactionLog.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-3 bg-gray-50 rounded-lg text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{transaction.item_name}</span>
                    <span className="text-gray-500">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {transaction.from_type === 'party' ? 'Party' : 
                      members.find(m => m.id === transaction.from_id)?.name}
                    {' → '}
                    {transaction.to_type === 'party' ? 'Party' :
                      members.find(m => m.id === transaction.to_id)?.name}
                  </p>
                </div>
              ))}

              {transactionLog.length === 0 && (
                <p className="text-center text-gray-600 py-4">
                  No transactions recorded yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
