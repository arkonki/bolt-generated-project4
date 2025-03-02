import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Eye, 
  Code, 
  ArrowLeft,
  Bold,
  Italic,
  Table2,
  Image,
  Link,
  StickyNote
} from 'lucide-react';
import { Button } from '../shared/Button';
import { HomebrewRenderer } from './HomebrewRenderer';
import { CompendiumEntry } from '../../types/compendium';

interface CompendiumFullPageProps {
  entry: CompendiumEntry;
  onClose: () => void;
  onSave: (entry: CompendiumEntry) => Promise<void>;
  onSaveAsTemplate?: (entry: CompendiumEntry) => Promise<void>;
}

export function CompendiumFullPage({ entry, onClose, onSave, onSaveAsTemplate }: CompendiumFullPageProps) {
  const [editedEntry, setEditedEntry] = useState(entry);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(editedEntry);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (onSaveAsTemplate) {
      setLoading(true);
      try {
        await onSaveAsTemplate(editedEntry);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={onClose}
          >
            Back
          </Button>
          <h2 className="text-xl font-bold">{editedEntry.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={previewMode ? Code : Eye}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          {onSaveAsTemplate && (
            <Button
              variant="secondary"
              onClick={handleSaveAsTemplate}
              loading={loading}
            >
              Save as Template
            </Button>
          )}
          <Button
            variant="primary"
            icon={Save}
            onClick={handleSave}
            loading={loading}
          >
            Save
          </Button>
        </div>
      </div>
      
      {/* Toolbar */}
      {!previewMode && (
        <div className="border-b p-2 flex items-center gap-2 bg-white">
          <Button
            variant="secondary"
            size="sm"
            icon={Bold}
            onClick={() => {
              const textarea = document.querySelector('textarea');
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const before = text.substring(0, start);
                const selection = text.substring(start, end);
                const after = text.substring(end);
                setEditedEntry({
                  ...editedEntry,
                  content: `${before}**${selection}**${after}`
                });
              }
            }}
          >
            Bold
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Italic}
            onClick={() => {
              const textarea = document.querySelector('textarea');
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const before = text.substring(0, start);
                const selection = text.substring(start, end);
                const after = text.substring(end);
                setEditedEntry({
                  ...editedEntry,
                  content: `${before}_${selection}_${after}`
                });
              }
            }}
          >
            Italic
          </Button>
          <div className="w-px h-6 bg-gray-300" />
          <Button
            variant="secondary"
            size="sm"
            icon={Table2}
            onClick={() => {
              const tableTemplate = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
              setEditedEntry({
                ...editedEntry,
                content: editedEntry.content + tableTemplate
              });
            }}
          >
            Table
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Image}
            onClick={() => {
              const imageTemplate = `![Image description](https://example.com/image.jpg)`;
              setEditedEntry({
                ...editedEntry,
                content: editedEntry.content + imageTemplate
              });
            }}
          >
            Image
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Link}
            onClick={() => {
              const linkTemplate = `[Link text](https://example.com)`;
              setEditedEntry({
                ...editedEntry,
                content: editedEntry.content + linkTemplate
              });
            }}
          >
            Link
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={StickyNote}
            onClick={() => {
              const noteTemplate = `
> ### Note
> This is a note block for important information.
`;
              setEditedEntry({
                ...editedEntry,
                content: editedEntry.content + noteTemplate
              });
            }}
          >
            Note
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Editor */}
          {!previewMode && (
            <div className="flex-1 p-6 overflow-auto bg-gray-50">
              <div className="max-w-4xl mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editedEntry.title}
                    onChange={(e) => setEditedEntry({
                      ...editedEntry,
                      title: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editedEntry.category}
                    onChange={(e) => setEditedEntry({
                      ...editedEntry,
                      category: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={editedEntry.content}
                    onChange={(e) => setEditedEntry({
                      ...editedEntry,
                      content: e.target.value
                    })}
                    rows={20}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {previewMode && (
            <div className="flex-1 p-6 overflow-auto bg-gray-50 homebrew">
              <div className="max-w-4xl mx-auto prose">
                <h1>{editedEntry.title}</h1>
                <div className="mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {editedEntry.category}
                  </span>
                </div>
                <HomebrewRenderer content={editedEntry.content} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
