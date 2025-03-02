import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface SpellFormProps {
  editingEntry: any;
  setEditingEntry: (entry: any) => void;
}

export function SpellForm({ editingEntry, setEditingEntry }: SpellFormProps) {
  const [magicSchools, setMagicSchools] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    async function fetchMagicSchools() {
      const { data, error } = await supabase
        .from('magic_schools')
        .select('id, name')
        .order('name');
      if (error) {
        console.error("Error fetching magic schools:", error);
      } else {
        setMagicSchools(data || []);
      }
    }
    fetchMagicSchools();
  }, []);

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          value={editingEntry.name || ''}
          onChange={(e) =>
            setEditingEntry({ ...editingEntry, name: e.target.value })
          }
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      {/* School */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          School
        </label>
        <select
          value={editingEntry.school_id || ''}
          onChange={(e) =>
            setEditingEntry({ ...editingEntry, school_id: e.target.value })
          }
          className="w-full px-3 py-2 border rounded-md"
        >
          {/* Empty value represents General Magic */}
          <option value="">General Magic</option>
          {magicSchools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      </div>

      {/* Rank */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rank
        </label>
        <select
          value={editingEntry.rank !== undefined ? editingEntry.rank : 1}
          onChange={(e) =>
            setEditingEntry({ ...editingEntry, rank: parseInt(e.target.value) })
          }
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="0">Trick</option>
          {[...Array(10)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              Rank {i + 1}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={editingEntry.description || ''}
          onChange={(e) =>
            setEditingEntry({ ...editingEntry, description: e.target.value })
          }
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      {/* Casting Time and Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Casting Time
          </label>
          <input
            type="text"
            value={editingEntry.casting_time || ''}
            onChange={(e) =>
              setEditingEntry({ ...editingEntry, casting_time: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Range
          </label>
          <input
            type="text"
            value={editingEntry.range || ''}
            onChange={(e) =>
              setEditingEntry({ ...editingEntry, range: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Duration and Willpower Cost */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration
          </label>
          <input
            type="text"
            value={editingEntry.duration || ''}
            onChange={(e) =>
              setEditingEntry({ ...editingEntry, duration: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Willpower Cost
          </label>
          <input
            type="number"
            value={editingEntry.willpower_cost || 0}
            onChange={(e) =>
              setEditingEntry({
                ...editingEntry,
                willpower_cost: parseInt(e.target.value),
              })
            }
            className="w-full px-3 py-2 border rounded-md"
            min="0"
          />
        </div>
      </div>
    </div>
  );
}
