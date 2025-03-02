import React, { useState, useEffect } from 'react';
import { Plus, Users, Sword, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/shared/Button';
import { useNavigate } from 'react-router-dom';
import { Character } from '../types/character';

interface Party {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  members: Character[];
}

export function AdventureParty() {
  const { user, isDM } = useAuth();
  const navigate = useNavigate();
  const [parties, setParties] = useState<Party[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadParties();
      loadAvailableCharacters();
    }
  }, [user]);

  async function loadParties() {
    try {
      const { data: partiesData, error: partiesError } = await supabase
        .from('parties')
        .select('*')
        .eq(isDM() ? 'created_by' : 'id', isDM() ? user?.id : 'party_members.party_id')
        .order('created_at', { ascending: false });

      if (partiesError) throw partiesError;

      const partiesWithMembers = await Promise.all(
        (partiesData || []).map(async (party) => {
          const { data: membersData } = await supabase
            .from('party_members')
            .select('characters (*)')
            .eq('party_id', party.id);

          return {
            ...party,
            members: membersData?.map((m) => m.characters) || [],
          };
        })
      );

      setParties(partiesWithMembers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parties');
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableCharacters() {
    try {
      // First get all characters for the user
      const { data: characters, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user?.id);

      if (charactersError) throw charactersError;

      // Then get all party members
      const { data: partyMembers, error: membersError } = await supabase
        .from('party_members')
        .select('character_id');

      if (membersError) throw membersError;

      // Filter out characters that are already in parties
      const partyMemberIds = partyMembers?.map(pm => pm.character_id) || [];
      const availableChars = characters?.filter(char => !partyMemberIds.includes(char.id)) || [];

      setAvailableCharacters(availableChars);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load characters');
    }
  }

  async function createParty() {
    try {
      if (!newPartyName.trim()) {
        setError('Party name is required');
        return;
      }

      const { data: party, error: partyError } = await supabase
        .from('parties')
        .insert([
          {
            name: newPartyName,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (partyError) throw partyError;

      if (selectedCharacters.length > 0) {
        const { error: membersError } = await supabase
          .from('party_members')
          .insert(
            selectedCharacters.map((characterId) => ({
              party_id: party.id,
              character_id: characterId,
            }))
          );

        if (membersError) throw membersError;
      }

      setNewPartyName('');
      setSelectedCharacters([]);
      setIsCreating(false);
      loadParties();
      loadAvailableCharacters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create party');
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-600">Loading adventure parties...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Adventure Parties</h1>
        </div>
        {isDM() && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Party
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {isCreating && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Party</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="partyName" className="block text-sm font-medium text-gray-700 mb-1">
                Party Name
              </label>
              <input
                type="text"
                id="partyName"
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter party name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Characters
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableCharacters.map((character) => (
                  <div
                    key={character.id}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedCharacters.includes(character.id || '')
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      if (character.id) {
                        setSelectedCharacters((prev) =>
                          prev.includes(character.id!)
                            ? prev.filter((id) => id !== character.id)
                            : [...prev, character.id]
                        );
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Sword className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-medium">{character.name}</h3>
                        <p className="text-sm text-gray-600">
                          {character.kin} {character.profession}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={createParty}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Create Party
              </button>
            </div>
          </div>
        </div>
      )}

      {parties.length > 0 ? (
        <div className="grid gap-6">
          {parties.map((party) => (
            <div
              key={party.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{party.name}</h2>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/party/${party.id}`)}
                >
                  View Party
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {party.members.map((member) => (
                  <div key={member.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sword className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-medium">{member.name}</h3>
                        <p className="text-sm text-gray-600">
                          {member.kin} {member.profession}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {isDM()
              ? "You haven't created any parties yet."
              : "You're not a member of any adventure parties."}
          </p>
          {isDM() && (
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Party
            </button>
          )}
        </div>
      )}
    </div>
  );
}
