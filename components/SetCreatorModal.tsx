import React, { useState } from 'react';
import { ReadySet } from '../types';

interface SetCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSet: (setName: string, category: string) => void;
  existingCategories: string[];
}

const SetCreatorModal: React.FC<SetCreatorModalProps> = ({
  isOpen,
  onClose,
  onCreateSet,
  existingCategories
}) => {
  const [setName, setSetName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const handleCreate = () => {
    if (!setName.trim()) return;
    
    const category = selectedCategory === 'custom' ? customCategory : selectedCategory;
    onCreateSet(setName.trim(), category);
    setSetName('');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Create New Set</h3>
          <button className="text-gray-400 hover:text-white text-xl" onClick={onClose}>×</button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <label htmlFor="setName" className="block text-sm font-medium text-gray-300 mb-2">Set Name</label>
            <input
              id="setName"
              type="text"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="Enter set name"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
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
            onClick={handleCreate}
            disabled={!setName.trim() || !selectedCategory || (selectedCategory === 'custom' && !customCategory.trim())}
          >
            Create Set
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetCreatorModal;