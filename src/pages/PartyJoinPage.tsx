import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, AlertCircle } from 'lucide-react';
import { Button } from '../components/shared/Button';
import { Character } from '../types/character';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';

export function PartyJoinPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [party, setParty] = useState<any>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (id) {
      loadPartyAndCharacters();
    }
  }, [id]);

  async function loadPartyAndCharacters() {
    try {
      setLoading(true);
      
      // Load party details
      const { data: partyData, error: partyError } = await supabase
        .from('parties')
        .select('*')
        .eq('id', id)
        .single();

      if (partyError) throw partyError;
      setParty(partyData);

      // Load available characters
      const { data: charactersData, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .not('id', 'in', `(
          select character_id from party_members where party_id = '${id}'
        )`);

      if (charactersError) throw charactersError;
      setCharacters(charactersData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const handleJoin = async () => {
    if (!selectedCharacter) {
      setError('Please select a character');
      return;
    }

    try {
      setJoining(true);
      setError(null);

      const { error } = await supabase
        .from('party_members')
        .insert([{
          party_id: id,
          character_id: selectedCharacter
        }]);

      if (error) throw error;

      navigate(`/party/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join party');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} />
        <Button
          variant="secondary"
          onClick={() => navigate('/adventure-party')}
          className="mt-4"
        >
          Back to Parties
        </Button>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message="Party not found" />
        <Button
          variant="secondary"
          onClick={() => navigate('/adventure-party')}
          className="mt-4"
        >
          Back to Parties
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Join Adventure Party</h1>
          <p className="text-gray-600">
            You've been invited to join {party.name}. Select a character to join with.
          </p>
        </div>

        {characters.length > 0 ? (
          <div className="space-y-6">
            <div className="grid gap-4">
              {characters.map((character) => (
                <div
                  key={character.id}
                  onClick={() => setSelectedCharacter(character.id!)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCharacter === character.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{character.name}</h3>
                      <p className="text-sm text-gray-600">
                        {character.kin} {character.profession}
                      </p>
                    </div>
                    {selectedCharacter === character.id && (
                      <div className="w-4 h-4 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="secondary"
                onClick={() => navigate('/adventure-party')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={joining}
                disabled={!selectedCharacter || joining}
                onClick={handleJoin}
              >
                Join Party
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              You don't have any available characters to join with.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/')}
            >
              Create a Character
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
