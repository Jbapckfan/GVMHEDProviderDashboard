"use client";

import { useState, ChangeEvent, FormEvent } from 'react';
import Button from './Button';

/**
 * SearchBar - Natural language search across uploaded data
 */

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = "Search across all files..." }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-[#8A8F98]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="
              w-full pl-12 pr-12 py-3
              bg-white/[0.05] border border-white/[0.10]
              rounded-xl text-[#EDEDEF] placeholder-[#8A8F98]
              focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:border-[#5E6AD2]
              transition-all duration-200
            "
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#8A8F98] hover:text-[#EDEDEF] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <Button type="submit" variant="primary" size="md">
          Search
        </Button>
      </div>

      {/* Quick search suggestions */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs text-[#8A8F98]">Quick searches:</span>
        {['wait time', 'patient', 'emergency', 'discharge'].map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setQuery(suggestion);
              onSearch(suggestion);
            }}
            className="
              px-2 py-1 text-xs rounded-md
              bg-white/[0.03] border border-white/[0.06]
              text-[#8A8F98] hover:text-[#EDEDEF] hover:border-[#5E6AD2]/50
              transition-all duration-200
            "
          >
            {suggestion}
          </button>
        ))}
      </div>
    </form>
  );
}
