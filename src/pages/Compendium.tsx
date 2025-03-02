import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Book, Search, Plus, Edit2, Save, Eye, Code, AlertCircle, FileText, Bookmark, BookmarkPlus, 
  ChevronRight, ChevronDown, Bold, Italic, Table2, Image, Link, StickyNote
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CompendiumEntry, CompendiumTemplate } from '../types/compendium';
import { Button } from '../components/shared/Button';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { MarkdownRenderer } from '../components/shared/MarkdownRenderer';
import { HomebrewRenderer } from '../components/compendium/HomebrewRenderer';
import { CompendiumFullPage } from '../components/compendium/CompendiumFullPage';

interface BookmarkedEntry extends CompendiumEntry {
  preview: string;
}

export function Compendium() {
  const { user, isAdmin } = useAuth();

  const [entries, setEntries] = useState<CompendiumEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CompendiumEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<CompendiumEntry | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [fullPageEntry, setFullPageEntry] = useState<CompendiumEntry | null>(null);
  const [templates, setTemplates] = useState<CompendiumTemplate[]>([]);
  const [bookmarkedEntries, setBookmarkedEntries] = useState<BookmarkedEntry[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCompendiumEntries();
    loadTemplates();
    loadBookmarks();
  }, []);

  const loadBookmarks = () => {
    const savedBookmarks = localStorage.getItem('compendium_bookmarks');
    if (savedBookmarks) {
      setBookmarkedEntries(JSON.parse(savedBookmarks));
    }
  };

  const toggleBookmark = (entry: CompendiumEntry) => {
    const preview = entry.content.slice(0, 100) + '...';
    setBookmarkedEntries(prev => {
      const isBookmarked = prev.some(b => b.id === entry.id);
      const newBookmarks = isBookmarked
        ? prev.filter(b => b.id !== entry.id)
        : [...prev, { ...entry, preview }];
      localStorage.setItem('compendium_bookmarks', JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  };

  async function loadCompendiumEntries() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('compendium')
        .select('*')
        .order('category')
        .order('title');

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compendium');
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplates() {
    try {
      const { data, error } = await supabase
        .from('compendium_templates')
        .select('*')
        .order('category')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    }
  }

  const categorizedEntries = useMemo(() => {
    const grouped = entries.reduce((acc, entry) => {
      const category = entry.category ?? 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(entry);
      return acc;
    }, {} as Record<string, CompendiumEntry[]>);

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [entries]);

  const handleSave = async () => {
    if (!editingEntry) return;

    try {
      const { error } = await supabase
        .from('compendium')
        .update({
          title: editingEntry.title,
          content: editingEntry.content,
          category: editingEntry.category
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      await loadCompendiumEntries();
      setEditingEntry(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    }
  };

  const handleNewEntry = () => {
    setFullPageEntry({
      title: '',
      content: '',
      category: selectedCategory || ''
    });
  };

  const handleSaveEntry = async (entry: CompendiumEntry) => {
    try {
      if (entry.id) {
        const { error } = await supabase
          .from('compendium')
          .update({
            title: entry.title,
            content: entry.content,
            category: entry.category
          })
          .eq('id', entry.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('compendium')
          .insert([{
            title: entry.title,
            content: entry.content,
            category: entry.category,
            created_by: user?.id
          }]);

        if (error) throw error;
      }

      await loadCompendiumEntries();
      setFullPageEntry(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="mx-auto mt-12" />;
  if (error) return <ErrorMessage message={error} className="m-8" />;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Compendium</h2>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleNewEntry}
              >
                New Entry
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search compendium..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {categorizedEntries.map(([category, categoryEntries]) => (
            <div key={category} className="border-b">
              <div
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <span>{category}</span>
                </div>
                <span className="text-sm text-gray-500">{categoryEntries.length}</span>
              </div>
              {expandedCategories.has(category) && (
                <div className="bg-gray-50">
                  {categoryEntries.map(entry => (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className={`px-8 py-2 cursor-pointer hover:bg-gray-100 ${
                        selectedEntry?.id === entry.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{entry.title}</span>
                        {bookmarkedEntries.some(b => b.id === entry.id) && (
                          <Bookmark className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedEntry ? (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">{selectedEntry.title}</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={bookmarkedEntries.some(b => b.id === selectedEntry.id) ? Bookmark : BookmarkPlus}
                  onClick={() => toggleBookmark(selectedEntry)}
                >
                  {bookmarkedEntries.some(b => b.id === selectedEntry.id) ? 'Bookmarked' : 'Bookmark'}
                </Button>
                {isAdmin && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Edit2}
                    onClick={() => setFullPageEntry(selectedEntry)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
            <div className="homebrew">
              <HomebrewRenderer content={selectedEntry.content} />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Welcome to the Compendium
              </h2>
              <p className="text-gray-500 max-w-md">
                Select an entry from the sidebar to view its contents, or use the search
                to find specific information.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Full Page Editor */}
      {fullPageEntry && (
        <CompendiumFullPage
          entry={fullPageEntry}
          onClose={() => setFullPageEntry(null)}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}
