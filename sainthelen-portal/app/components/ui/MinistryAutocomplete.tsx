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
          className={`block h-10 w-full rounded border border-line-2 bg-surface px-[11px] text-md text-ink placeholder:text-ink-3 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/25 ${className}`}
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
            <InformationCircleIcon className="h-4 w-4 text-status-approved-d" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-line bg-surface shadow-pop"
        >
          {suggestions.map((ministry) => (
            <div
              key={ministry.id}
              className="cursor-pointer border-b border-line px-3 py-2 last:border-b-0 hover:bg-surface-2"
              onClick={() => handleSuggestionClick(ministry)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-ink">
                    {ministry.name}
                  </div>
                  {ministry.description && (
                    <div className="text-xs text-ink-3">
                      {ministry.description}
                    </div>
                  )}
                </div>
                {ministry.requiresApproval && (
                  <ExclamationTriangleIcon className="ml-2 h-4 w-4 flex-shrink-0 text-status-review-d" />
                )}
              </div>
            </div>
          ))}
          
          {!selectedMinistry && value.trim() && (
            <div className="border-t border-line bg-surface-2 px-3 py-2">
              <div className="text-xs text-ink-2">
                Don't see your ministry? You can still submit "{value}" as a custom entry.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approval Warning */}
      {showApprovalWarning && selectedMinistry && (
        <div className="mt-2 rounded-r border-l-[3px] border-status-review-d bg-status-review-bg px-3.5 py-2.5">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-review-t" />
            <div className="text-sm">
              <p className="font-semibold text-status-review-t">
                Approval Required
              </p>
              <p className="text-status-review-t mt-1 leading-relaxed">
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