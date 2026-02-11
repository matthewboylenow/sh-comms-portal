// app/command-center/components/SocialSuggestions.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface SocialContent {
  id: string;
  platform: string;
  contentType: string;
  content: string;
  hashtags?: string;
}

const platformColors: Record<string, string> = {
  facebook: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  x: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  linkedin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function SocialSuggestions() {
  const [suggestions, setSuggestions] = useState<SocialContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/social?status=draft&limit=3');
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.content || []);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'inspirational',
          platform: 'instagram',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      if (data.success && data.content) {
        setSuggestions((prev) => [data.content, ...prev].slice(0, 3));
      }
    } catch (err: any) {
      console.error('Error generating content:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (content: SocialContent) => {
    try {
      const text = content.hashtags
        ? `${content.content}\n\n${content.hashtags}`
        : content.content;

      await navigator.clipboard.writeText(text);
      setCopiedId(content.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Social Content Ideas</h3>
        </div>
        {expanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3">
              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    Generate Content Idea
                  </>
                )}
              </button>

              {error && (
                <p className="text-sm text-red-500 dark:text-red-400 text-center">
                  {error}
                </p>
              )}

              {/* Suggestions */}
              {loading ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  Loading suggestions...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  No suggestions yet. Click generate to create one!
                </div>
              ) : (
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                            platformColors[suggestion.platform] || platformColors.instagram
                          }`}
                        >
                          {suggestion.platform}
                        </span>
                        <button
                          onClick={() => handleCopy(suggestion)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          {copiedId === suggestion.id ? (
                            <CheckIcon className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {suggestion.content}
                      </p>
                      {suggestion.hashtags && (
                        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                          {suggestion.hashtags}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
