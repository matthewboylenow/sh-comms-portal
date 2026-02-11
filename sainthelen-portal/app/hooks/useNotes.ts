// app/hooks/useNotes.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Note {
  id: string;
  userEmail: string;
  content: string;
  color: string | null;
  isPinned: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';

export default function useNotes() {
  const { data: session, status } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/notes');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch notes (${response.status})`);
      }

      const data = await response.json();

      if (data.success) {
        setNotes(data.notes || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  // Create a note
  const createNote = useCallback(async (noteData: {
    content: string;
    color?: NoteColor;
    isPinned?: boolean;
  }) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create note');
      }

      const data = await response.json();

      if (data.success) {
        // Add to beginning if pinned, otherwise add to list based on pin status
        if (data.note.isPinned) {
          setNotes(prev => [data.note, ...prev]);
        } else {
          // Find first unpinned note and insert there
          setNotes(prev => {
            const pinnedCount = prev.filter(n => n.isPinned).length;
            return [...prev.slice(0, pinnedCount), data.note, ...prev.slice(pinnedCount)];
          });
        }
        return data.note;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error creating note:', err);
      throw err;
    }
  }, []);

  // Update a note
  const updateNote = useCallback(async (id: string, updates: Partial<{
    content: string;
    color: NoteColor;
    isPinned: boolean;
  }>) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update note');
      }

      const data = await response.json();

      if (data.success) {
        setNotes(prev => prev.map(n => n.id === id ? data.note : n));
        return data.note;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error updating note:', err);
      throw err;
    }
  }, []);

  // Toggle pin status
  const togglePin = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/notes/toggle-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to toggle pin');
      }

      const data = await response.json();

      if (data.success) {
        // Re-sort notes with pinned first
        setNotes(prev => {
          const updated = prev.map(n => n.id === id ? data.note : n);
          return updated.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
        });
        return data.note;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error toggling pin:', err);
      throw err;
    }
  }, []);

  // Delete a note
  const deleteNote = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete note');
      }

      const data = await response.json();

      if (data.success) {
        setNotes(prev => prev.filter(n => n.id !== id));
        return true;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error deleting note:', err);
      throw err;
    }
  }, []);

  // Load notes on mount and when session changes
  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotes();
    }
  }, [status, fetchNotes]);

  // Get pinned notes
  const pinnedNotes = notes.filter(n => n.isPinned);
  const unpinnedNotes = notes.filter(n => !n.isPinned);

  return {
    notes,
    pinnedNotes,
    unpinnedNotes,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    togglePin,
    deleteNote,
  };
}
