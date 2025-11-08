import React, { useState, useEffect } from 'react';
import { Hashtag } from '../types';

interface SelectedTrayProps {
  selectedHashtags: Hashtag[];
  onRemove: (name: string) => void;
  onClear: () => void;
}

export const SelectedTray: React.FC<SelectedTrayProps> = ({ selectedHashtags, onRemove, onClear }) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleCopy = () => {
    const textToCopy = selectedHashtags.map(h => h.name).join(' ');
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
  };

  if (selectedHashtags.length === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-0 z-20 w-full p-4 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 animate-slide-up">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-200 mb-2">
              Selected Hashtags ({selectedHashtags.length})
            </h3>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {selectedHashtags.map(hashtag => (
                <span key={hashtag.name} className="flex items-center text-xs bg-purple-600 text-white pl-2 pr-1 py-0.5 rounded-full">
                  {hashtag.name}
                  <button onClick={() => onRemove(hashtag.name)} className="ml-1.5 text-purple-200 hover:text-white">&times;</button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={onClear}
              className="flex-1 bg-red-600/50 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
