// app/command-center/components/NotesPanel.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Note, NoteColor } from '../../hooks/useNotes';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PinIcon,
} from 'lucide-react';

interface NotesPanelProps {
  notes: Note[];
  loading: boolean;
  onCreate: (data: { content: string; color?: NoteColor; isPinned?: boolean }) => Promise<Note>;
  onUpdate: (id: string, data: { content?: string; color?: NoteColor }) => Promise<Note>;
  onTogglePin: (id: string) => Promise<Note>;
  onDelete: (id: string) => Promise<boolean>;
}

const colorOptions: { id: NoteColor; bg: string; border: string }[] = [
  { id: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-700' },
  { id: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-700' },
  { id: 'green', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-700' },
  { id: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-300 dark:border-pink-700' },
  { id: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-700' },
];

const getColorClasses = (color: string | null) => {
  const found = colorOptions.find((c) => c.id === color);
  return found || colorOptions[0];
};

export default function NotesPanel({
  notes,
  loading,
  onCreate,
  onUpdate,
  onTogglePin,
  onDelete,
}: NotesPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<NoteColor>('yellow');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleCreate = async () => {
    if (!newNoteContent.trim()) return;

    try {
      await onCreate({
        content: newNoteContent.trim(),
        color: newNoteColor,
      });
      setNewNoteContent('');
      setIsAdding(false);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;

    try {
      await onUpdate(id, { content: editContent.trim() });
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Quick Notes</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Notes List */}
      <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            Loading notes...
          </div>
        ) : notes.length === 0 && !isAdding ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            No notes yet. Click + to add one.
          </div>
        ) : (
          <>
            {/* Add Note Form */}
            <AnimatePresence>
              {isAdding && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-3 rounded-xl border-2 ${getColorClasses(newNoteColor).bg} ${getColorClasses(newNoteColor).border}`}
                >
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Type your note..."
                    rows={3}
                    autoFocus
                    className="w-full bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 resize-none text-sm"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1">
                      {colorOptions.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setNewNoteColor(color.id)}
                          className={`w-5 h-5 rounded-full ${color.bg} border-2 ${
                            newNoteColor === color.id
                              ? 'ring-2 ring-offset-1 ring-gray-400'
                              : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsAdding(false);
                          setNewNoteContent('');
                        }}
                        className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreate}
                        disabled={!newNoteContent.trim()}
                        className="px-3 py-1 text-xs bg-sh-navy text-white rounded-lg hover:bg-sh-navy-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notes */}
            <AnimatePresence mode="popLayout">
              {notes.map((note) => {
                const colors = getColorClasses(note.color);
                const isEditing = editingId === note.id;

                return (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`group relative p-3 rounded-xl border ${colors.bg} ${colors.border} ${
                      note.isPinned ? 'ring-2 ring-sh-rust/30' : ''
                    }`}
                  >
                    {isEditing ? (
                      <div>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          autoFocus
                          className="w-full bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white resize-none text-sm"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdate(note.id)}
                            className="px-3 py-1 text-xs bg-sh-navy text-white rounded-lg"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                          {note.content}
                        </p>

                        {/* Actions */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onTogglePin(note.id)}
                            className={`p-1 rounded-md transition-colors ${
                              note.isPinned
                                ? 'text-sh-rust bg-sh-rust/10'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'
                            }`}
                          >
                            <PinIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => startEditing(note)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200/50"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(note.id)}
                            className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
