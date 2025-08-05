'use client';

import { useState, useRef, useEffect } from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface Ministry {
  id: string;
  name: string;
  aliases?: string[];
  requiresApproval: boolean;
  approvalCoordinator?: string;
  description?: string;
  active: boolean;
}

interface MinistryAutocompleteProps {
  value: string;
  onChange: (value: string, ministry?: Ministry) => void;
  onApprovalStatusChange?: (requiresApproval: boolean, ministry?: Ministry) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export default function MinistryAutocomplete({
  value,
  onChange,
  onApprovalStatusChange,
  className = '',
  placeholder = 'Start typing ministry name...',
  required = false
}: MinistryAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Ministry[]>([]);
  const [allMinistries, setAllMinistries] = useState<Ministry[]>([]);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [showApprovalWarning, setShowApprovalWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch ministries from API
  useEffect(() => {
    const fetchMinistries = async () => {
      try {
        const response = await fetch('/api/admin/ministries');
        if (response.ok) {
          const data = await response.json();
          const activeMinistries = data.ministries.filter((m: Ministry) => m.active);
          setAllMinistries(activeMinistries);
        }
      } catch (error) {
        console.error('Failed to fetch ministries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMinistries();
  }, []);

  // Update selected ministry when value changes
  useEffect(() => {
    const ministry = allMinistries.find(m => 
      m.name.toLowerCase() === value.toLowerCase()
    );
    setSelectedMinistry(ministry || null);
    setShowApprovalWarning(ministry?.requiresApproval || false);
    onApprovalStatusChange?.(ministry?.requiresApproval || false, ministry || undefined);
  }, [value, allMinistries, onApprovalStatusChange]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchMinistries = (query: string): Ministry[] => {
    if (!query || loading) return [];
    
    const lowerQuery = query.toLowerCase();
    return allMinistries.filter(ministry =>
      ministry.name.toLowerCase().includes(lowerQuery) ||
      ministry.aliases?.some(alias => alias.toLowerCase().includes(lowerQuery)) ||
      ministry.description?.toLowerCase().includes(lowerQuery)
    ).sort((a, b) => {
      // Prioritize exact matches at the beginning
      const aStartsWith = a.name.toLowerCase().startsWith(lowerQuery) || 
        a.aliases?.some(alias => alias.toLowerCase().startsWith(lowerQuery));
      const bStartsWith = b.name.toLowerCase().startsWith(lowerQuery) || 
        b.aliases?.some(alias => alias.toLowerCase().startsWith(lowerQuery));
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return a.name.localeCompare(b.name);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    if (inputValue.trim()) {
      const results = searchMinistries(inputValue);
      setSuggestions(results.slice(0, 10)); // Limit to 10 suggestions
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (ministry: Ministry) => {
    onChange(ministry.name, ministry);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (value.trim()) {
      const results = searchMinistries(value);
      setSuggestions(results.slice(0, 10));
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-sh-primary/50 focus:border-sh-primary dark:bg-gray-800/50 dark:text-white backdrop-blur-sm transition-all duration-200 ${className}`}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
        />
        
        {selectedMinistry && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <InformationCircleIcon className="h-5 w-5 text-green-500" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-soft max-h-60 overflow-y-auto"
        >
          {suggestions.map((ministry) => (
            <div
              key={ministry.id}
              className="px-4 py-3 cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-700/70 border-b border-gray-100/50 dark:border-gray-700/50 last:border-b-0 transition-all duration-200 first:rounded-t-2xl last:rounded-b-2xl"
              onClick={() => handleSuggestionClick(ministry)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {ministry.name}
                  </div>
                  {ministry.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {ministry.description}
                    </div>
                  )}
                </div>
                {ministry.requiresApproval && (
                  <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 flex-shrink-0 ml-2" />
                )}
              </div>
            </div>
          ))}
          
          {!selectedMinistry && value.trim() && (
            <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-600/50 bg-gray-50/50 dark:bg-gray-700/50 rounded-b-2xl">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Don't see your ministry? You can still submit "{value}" as a custom entry.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approval Warning */}
      {showApprovalWarning && selectedMinistry && (
        <div className="mt-3 p-4 bg-amber-50/80 dark:bg-amber-900/30 backdrop-blur-sm border border-amber-200/50 dark:border-amber-800/50 rounded-2xl shadow-soft">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Approval Required
              </p>
              <p className="text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                This announcement will require approval from the Coordinator of Adult Discipleship 
                before being published. You will receive an email notification once reviewed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Ministry Info */}
      {!selectedMinistry && value.trim() && !isOpen && (
        <div className="mt-3 p-4 bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 rounded-2xl shadow-soft">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800 dark:text-blue-300">
                Custom Ministry Entry
              </p>
              <p className="text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
                You're submitting "{value}" as a custom ministry. This will be reviewed by the communications team.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}