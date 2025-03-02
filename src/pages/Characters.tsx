import React, { useEffect, useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Character } from '../types/character';
import { CharacterCard } from '../components/character/CharacterCard';
import { useAuth } from '../contexts/AuthContext';
import { CharacterCreationWizard } from '../components/character/CharacterCreationWizard';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { EmptyState } from '../components/shared/EmptyState';
import { Button } from '../components/shared/Button';

export function Characters() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadCharacters();
    }
  }, [user]);

  async function loadCharacters() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharacters(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load characters');
    } finally {
      setLoading(false);
    }
  }

  const handleCharacterSelect = (characterId: string) => {
    if (characterId) {
      navigate(`/character/${characterId}`);
    }
  };

  const toggleCharacterSelection = (characterId: string, event: React.MouseEvent) => {
    // If shift key is pressed, toggle selection
    if (event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedCharacters(prev => 
        prev.includes(characterId)
          ? prev.filter(id => id !== characterId)
          : [...prev, characterId]
      );
    }
  };

  const handleDeleteSelected = async () => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('characters')
        .delete()
        .in('id', selectedCharacters);

      if (error) throw error;

      // Refresh character list and clear selection
      await loadCharacters();
      setSelectedCharacters([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete characters');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8">
        <EmptyState
          icon={AlertCircle}
          title="Authentication Required"
          description="Please sign in to view your characters."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Characters</h1>
          {selectedCharacters.length > 0 && (
            <p className="text-sm text-gray-600">
              {selectedCharacters.length} character{selectedCharacters.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
        <div className="flex gap-4">
          {selectedCharacters.length > 0 && (
            <Button
              variant="danger"
              icon={Trash2}
              loading={isDeleting}
              onClick={handleDeleteSelected}
            >
              Delete Selected
            </Button>
          )}
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsCreating(true)}
          >
            Create Character
          </Button>
        </div>
      </div>

      {isCreating ? (
        <CharacterCreationWizard onComplete={() => {
          setIsCreating(false);
          loadCharacters();
        }} />
      ) : characters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <div
              key={character.id}
              className="relative group"
              onClick={(e) => {
                if (character.id) {
                  toggleCharacterSelection(character.id, e);
                  if (!e.shiftKey) {
                    handleCharacterSelect(character.id);
                  }
                }
              }}
            >
              <div
                className={`absolute inset-0 rounded-lg border-2 transition-colors ${
                  character.id && selectedCharacters.includes(character.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-transparent group-hover:border-blue-300'
                }`}
              />
              <CharacterCard character={character} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Plus}
          title="No Characters Yet"
          description="Create your first character to begin your adventure."
          action={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsCreating(true)}
            >
              Create Your First Character
            </Button>
          }
        />
      )}
    </div>
  );
}
