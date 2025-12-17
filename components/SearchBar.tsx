import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Package } from 'lucide-react';
import { LocationData } from '../types';

interface SearchBarProps {
  locations: LocationData[];
  onSelectLocation: (location: LocationData) => void;
}

interface SearchResult {
  location: LocationData;
  matchType: 'location' | 'article';
  matchText: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ locations, onSelectLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Perform search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    locations.forEach((loc) => {
      // Search by location code
      if (loc.locationCode && loc.locationCode.toLowerCase().includes(query)) {
        searchResults.push({
          location: loc,
          matchType: 'location',
          matchText: loc.locationCode
        });
      }
      // Search by article code
      else if (loc.productCode && loc.productCode.toLowerCase().includes(query)) {
        searchResults.push({
          location: loc,
          matchType: 'article',
          matchText: `${loc.productCode} - ${loc.productDesc || ''}`
        });
      }
      // Search by article description
      else if (loc.productDesc && loc.productDesc.toLowerCase().includes(query)) {
        searchResults.push({
          location: loc,
          matchType: 'article',
          matchText: `${loc.productCode} - ${loc.productDesc}`
        });
      }
    });

    // Limit results to top 50
    setResults(searchResults.slice(0, 50));
    setIsOpen(searchResults.length > 0);
    setSelectedIndex(0);
  }, [searchQuery, locations]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectLocation(result.location);
    setSearchQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchQuery && setIsOpen(results.length > 0)}
          placeholder="Cerca ubicazione o articolo..."
          className="w-full bg-slate-900 border border-slate-700 rounded pl-10 pr-10 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded shadow-2xl z-50 max-h-96 overflow-y-auto"
        >
          <div className="p-2 border-b border-slate-700 text-xs text-slate-400">
            {results.length} risultat{results.length !== 1 ? 'i' : 'o'} trovat{results.length !== 1 ? 'i' : 'o'}
          </div>

          {results.map((result, index) => (
            <button
              key={`${result.location.id}-${index}`}
              onClick={() => handleSelectResult(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors flex items-start gap-3 ${
                index === selectedIndex ? 'bg-slate-800' : ''
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {result.matchType === 'location' ? (
                  <MapPin size={16} className="text-blue-400" />
                ) : (
                  <Package size={16} className="text-green-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Location Code */}
                <div className="text-white text-sm font-medium font-mono">
                  {result.location.locationCode}
                </div>

                {/* Match Text */}
                {result.matchType === 'article' && (
                  <div className="text-slate-400 text-xs truncate mt-0.5">
                    {result.matchText}
                  </div>
                )}

                {/* Quantity */}
                {result.location.quantity && result.location.quantity > 0 && (
                  <div className="text-green-400 text-xs mt-0.5">
                    Qty: {result.location.quantity.toFixed(2)}
                  </div>
                )}

                {/* Coordinates */}
                <div className="text-slate-500 text-xs mt-1">
                  Scaff {result.location.aisle} • Posiz {result.location.bay} • Piano {result.location.level}
                </div>
              </div>

              {/* Movement Indicators */}
              <div className="flex-shrink-0 flex flex-col gap-1">
                {result.location.movOut && result.location.movOut > 0 && (
                  <div className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded">
                    Out: {result.location.movOut}
                  </div>
                )}
                {result.location.movIn && result.location.movIn > 0 && (
                  <div className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded">
                    In: {result.location.movIn}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-slate-500 text-center">
          ↑↓ naviga • Enter seleziona • Esc chiudi
        </div>
      )}
    </div>
  );
};
