import React from 'react';
import { HashtagSize } from '../types';

interface HashtagFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedSizes: Set<HashtagSize>;
  onSizeToggle: (size: HashtagSize) => void;
}

export const HashtagFilters: React.FC<HashtagFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedSizes,
  onSizeToggle,
}) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl space-y-4">
      <input
        type="text"
        placeholder="Search hashtags..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
      />
      <div>
        <label className="text-sm font-semibold text-gray-400">Filter by size:</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.values(HashtagSize).map((size) => (
            <button
              key={size}
              onClick={() => onSizeToggle(size)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedSizes.has(size)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
