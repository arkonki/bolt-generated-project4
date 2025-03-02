import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react';
import { Button } from '../shared/Button';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface PartyNotesProps {
  partyId: string;
  isDM: boolean;
}

export function PartyNotes({ partyId, isDM }: PartyNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadNotes();
  }, [partyId]);

  async function loadNotes() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('party_id', partyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);

      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data?.map(note => note.category) || []));
      setCategories(uniqueCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!editingNote) return;

    try {
      if (editingNote.id) {
        const { error } = await supabase
          .from('notes')
          .update({
            title: editingNote.title,
            content: editingNote.content,
            category: editingNote.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNote.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notes')
          .insert([{
            party_id: partyId,
            title: editingNote.title,
            content: editingNote.content,
            category: editingNote.category
          }]);

        if (error) throw error;
      }

      setEditingNote(null);
      loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  const filteredNotes = notes.filter(note =>
    selectedCategory === 'all' || note.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setEditingNote({
            id: '',
            title: '',
            content: '',
            category: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })}
        >
          Add Note
        </Button>
      </div>

      {editingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingNote.id ? 'Edit Note' : 'New Note'}
                </h2>
                <button
                  onClick={() => setEditingNote(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({
                      ...editingNote,
                      title: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingNote.category}
                      onChange={(e) => setEditingNote({
                        ...editingNote,
                        category: e.target.value
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Quests, Locations, NPCs"
                    />
                    {categories.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => setEditingNote({
                          ...editingNote,
                          category: e.target.value
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="" disabled>Select existing...</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({
                      ...editingNote,
                      content: e.target.value
                    })}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    variant="secondary"
                    onClick={() => setEditingNote(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    icon={Save}
                    onClick={handleSave}
                  >
                    Save Note
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{note.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Tag className="w-4 h-4" />
                  <span>{note.category}</span>
                  <span>•</span>
                  <span>
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                  {note.updated_at !== note.created_at && (
                    <>
                      <span>•</span>
                      <span>
                        Updated {new Date(note.updated_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingNote(note)}
                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="prose max-w-none">
              <MarkdownRenderer content={note.content} />
            </div>
          </div>
        ))}

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {selectedCategory === 'all'
                ? "No notes have been created yet."
                : `No notes found in the '${selectedCategory}' category.`}
            </p>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setEditingNote({
                id: '',
                title: '',
                content: '',
                category: selectedCategory === 'all' ? '' : selectedCategory,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })}
              className="mt-4"
            >
              Create First Note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
