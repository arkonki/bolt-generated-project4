import React, { useState, useEffect } from 'react';
import { Plus, Book, Search, Filter, Edit2, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Note {
  id: string;
  title: string;
  content: string;
  character_id: string | null;
  party_id: string | null;
  created_at: string;
  character?: {
    name: string;
  };
  party?: {
    name: string;
  };
}

interface Character {
  id: string;
  name: string;
}

interface Party {
  id: string;
  name: string;
}

export function Notes() {
  const { user, isDM } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'character' | 'party'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadNotes();
      loadCharacters();
      if (isDM()) {
        loadParties();
      }
    }
  }, [user]);

  async function loadNotes() {
    try {
      let query = supabase
        .from('notes')
        .select(`
          *,
          character:characters(name),
          party:parties(name)
        `)
        .eq('user_id', user?.id);

      if (isDM()) {
        // Get DM's party IDs first
        const { data: dmParties } = await supabase
          .from('parties')
          .select('id')
          .eq('created_by', user?.id);

        if (dmParties && dmParties.length > 0) {
          const partyIds = dmParties.map(p => p.id);
          // Add party notes to the query
          query = query.or(`party_id.in.(${partyIds.join(',')})`);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }

  async function loadCharacters() {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('id, name')
        .eq('user_id', user?.id);

      if (error) throw error;
      setCharacters(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load characters');
    }
  }

  async function loadParties() {
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('id, name')
        .eq('created_by', user?.id);

      if (error) throw error;
      setParties(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parties');
    }
  }

  async function handleSubmit() {
    try {
      if (!title.trim()) {
        setError('Title is required');
        return;
      }

      const noteData = {
        title,
        content,
        user_id: user?.id,
        character_id: selectedCharacter || null,
        party_id: selectedParty || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', isEditing);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notes')
          .insert([noteData]);

        if (error) throw error;
      }

      setTitle('');
      setContent('');
      setSelectedCharacter('');
      setSelectedParty('');
      setIsCreating(false);
      setIsEditing(null);
      loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    }
  }

  async function deleteNote(id: string) {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  }

  function editNote(note: Note) {
    setTitle(note.title);
    setContent(note.content);
    setSelectedCharacter(note.character_id || '');
    setSelectedParty(note.party_id || '');
    setIsEditing(note.id);
    setIsCreating(true);
  }

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'character' && note.character_id) ||
      (filter === 'party' && note.party_id);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-600">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Book className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Notes</h1>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setIsEditing(null);
            setTitle('');
            setContent('');
            setSelectedCharacter('');
            setSelectedParty('');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Note
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {isCreating && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Edit Note' : 'Create New Note'}
            </h2>
            <button
              onClick={() => {
                setIsCreating(false);
                setIsEditing(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter note title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="character" className="block text-sm font-medium text-gray-700 mb-1">
                  Character
                </label>
                <select
                  id="character"
                  value={selectedCharacter}
                  onChange={(e) => {
                    setSelectedCharacter(e.target.value);
                    if (e.target.value) setSelectedParty('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None</option>
                  {characters.map((char) => (
                    <option key={char.id} value={char.id}>
                      {char.name}
                    </option>
                  ))}
                </select>
              </div>

              {isDM() && (
                <div>
                  <label htmlFor="party" className="block text-sm font-medium text-gray-700 mb-1">
                    Party
                  </label>
                  <select
                    id="party"
                    value={selectedParty}
                    onChange={(e) => {
                      setSelectedParty(e.target.value);
                      if (e.target.value) setSelectedCharacter('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {parties.map((party) => (
                      <option key={party.id} value={party.id}>
                        {party.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter note content"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                {isEditing ? 'Update Note' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'character' | 'party')}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Notes</option>
            <option value="character">Character Notes</option>
            <option value="party">Party Notes</option>
          </select>
        </div>
      </div>

      {filteredNotes.length > 0 ? (
        <div className="grid gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{note.title}</h2>
                  {note.character && (
                    <p className="text-sm text-blue-600">Character: {note.character.name}</p>
                  )}
                  {note.party && (
                    <p className="text-sm text-green-600">Party: {note.party.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => editNote(note)}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-600 whitespace-pre-line">{note.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {searchTerm || filter !== 'all'
              ? 'No notes found matching your search criteria.'
              : "You haven't created any notes yet."}
          </p>
          {!searchTerm && filter === 'all' && (
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Note
            </button>
          )}
        </div>
      )}
    </div>
  );
}
