import React, { useState } from 'react';
import { Hashtag, ReadySet } from '../types';

interface HashtagAdderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHashtag: (hashtag: string, category: string) => void;
  existingSets: ReadySet[];
  existingCategories: string[];
  hashtagSuggestions: string[];
}

const HashtagAdderModal: React.FC<HashtagAdderModalProps> = ({
  isOpen,
  onClose,
  onAddHashtag,
  existingSets,
  existingCategories,
  hashtagSuggestions
}) => {
  const [hashtagInput, setHashtagInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAdd = () => {
    if (!hashtagInput.trim()) return;
    
    const category = selectedCategory === 'custom' ? customCategory : selectedCategory;
    onAddHashtag(hashtagInput.trim(), category);
    setHashtagInput('');
    setSelectedCategory('');
    setCustomCategory('');
    onClose();
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    if (e.target.value !== 'custom') {
      setCustomCategory('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setHashtagInput(suggestion);
    setShowSuggestions(false);
  };

  const filteredSuggestions = hashtagSuggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(hashtagInput.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Add Hashtag</h3>
          <button className="text-gray-400 hover:text-white text-xl" onClick={onClose}>×</button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <label htmlFor="hashtagInput" className="block text-sm font-medium text-gray-300 mb-2">Hashtag</label>
            <div className="relative">
              <input
                id="hashtagInput"
                type="text"
                value={hashtagInput}
                onChange={(e) => {
                  setHashtagInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Enter hashtag (e.g., #YourHashtag)"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {showSuggestions && hashtagInput && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-600 cursor-pointer text-white border-b border-gray-600 last:border-b-0"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select a category</option>
              {existingCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
              <option value="custom">Custom Category</option>
            </select>
          </div>
          
          {selectedCategory === 'custom' && (
            <div className="mb-4">
              <label htmlFor="customCategory" className="block text-sm font-medium text-gray-300 mb-2">Custom Category Name</label>
              <input
                id="customCategory"
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Available Sets</h4>
            <div className="bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto">
              {existingSets.map(set => (
                <div key={set.name} className="flex justify-between items-center py-1 border-b border-gray-600 last:border-b-0">
                  <span className="text-white text-sm">{set.name}</span>
                  <span className="text-gray-400 text-xs">({set.hashtags.length} hashtags)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            className="px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={handleAdd}
            disabled={!hashtagInput.trim() || !selectedCategory || (selectedCategory === 'custom' && !customCategory.trim())}
          >
            Add Hashtag
          </button>
        </div>
      </div>
    </div>
  );
};

export default HashtagAdderModal;