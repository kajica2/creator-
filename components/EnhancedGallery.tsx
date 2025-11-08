import React, { useState, useMemo } from 'react';
import { ContentStorage, StoredContentItem, Persona, Page } from '../types';
import { getContentByPersona, getContentByTool, getPersonasWithStats, searchContent, deleteContentItem, deletePersona } from '../utils/contentStorage';

interface EnhancedGalleryProps {
  contentStorage: ContentStorage;
  onContentStorageUpdate: (storage: ContentStorage) => void;
}

const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

export const EnhancedGallery: React.FC<EnhancedGalleryProps> = ({ 
  contentStorage, 
  onContentStorageUpdate 
}) => {
  const [activeView, setActiveView] = useState<'all' | 'persona' | 'tool'>('all');
  const [selectedPersona, setSelectedPersona] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<Page | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Get filtered content based on current filters
  const filteredContent = useMemo(() => {
    let content = contentStorage.content;

    // Apply search filter
    if (searchQuery.trim()) {
      content = searchContent(contentStorage, searchQuery);
    }

    // Apply persona filter
    if (selectedPersona !== 'all') {
      content = content.filter(item => item.personaId === selectedPersona);
    }

    // Apply tool filter
    if (selectedTool !== 'all') {
      content = content.filter(item => item.tool === selectedTool);
    }

    return content.sort((a, b) => b.timestamp - a.timestamp);
  }, [contentStorage, selectedPersona, selectedTool, searchQuery]);

  // Get personas with updated stats
  const personas = useMemo(() => getPersonasWithStats(contentStorage), [contentStorage]);

  // Get unique tools from content
  const tools = useMemo(() => {
    const toolSet = new Set<Page>();
    contentStorage.content.forEach(item => toolSet.add(item.tool));
    return Array.from(toolSet);
  }, [contentStorage.content]);

  // Handle content deletion
  const handleDeleteContent = (contentId: string) => {
    const updatedStorage = deleteContentItem(contentStorage, contentId);
    onContentStorageUpdate(updatedStorage);
    setShowDeleteConfirm(null);
  };

  // Handle persona deletion
  const handleDeletePersona = (personaId: string) => {
    const updatedStorage = deletePersona(contentStorage, personaId);
    onContentStorageUpdate(updatedStorage);
    setSelectedPersona('all');
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render content item based on type
  const renderContentItem = (item: StoredContentItem) => {
    const getToolColor = (tool: Page) => {
      const colors: Record<string, string> = {
        'AI Story': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        'AI Lyrics': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        'AI Strategy': 'bg-green-500/20 text-green-300 border-green-500/30',
        'Text-to-Image': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        'AI Website': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        'Thinking Mode': 'bg-pink-500/20 text-pink-300 border-pink-500/30'
      };
      return colors[tool] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    };

    return (
      <div key={item.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getToolColor(item.tool)}`}>
              {item.tool}
            </span>
            <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
              {item.personaName}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              {formatTimestamp(item.timestamp)}
            </span>
            <button
              onClick={() => setShowDeleteConfirm(item.id)}
              className="text-red-400 hover:text-red-300 transition-colors p-1"
              title="Delete content"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Content Preview */}
          {item.type === 'Text-to-Image' && item.content?.imageUrl ? (
            <div className="rounded-lg overflow-hidden bg-gray-900">
              <img 
                src={item.content.imageUrl} 
                alt="Generated image" 
                className="w-full h-48 object-cover"
              />
            </div>
          ) : (
            <div className="bg-gray-900/50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {typeof item.content === 'string' 
                  ? item.content 
                  : JSON.stringify(item.content, null, 2)
                }
              </pre>
            </div>
          )}

          {/* Hashtags */}
          {item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.hashtags.map((tag, index) => (
                <span key={index} className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white"
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All Content
            </button>
            <button
              onClick={() => setActiveView('persona')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'persona' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              By Persona
            </button>
            <button
              onClick={() => setActiveView('tool')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'tool' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              By Tool
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="mt-4 flex flex-wrap gap-4">
          {/* Persona Filter */}
          {activeView !== 'tool' && (
            <div className="flex items-center gap-2">
              <FilterIcon className="text-gray-400" />
              <select
                value={selectedPersona}
                onChange={(e) => setSelectedPersona(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Personas</option>
                {personas.map(persona => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name} ({persona.contentCount})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tool Filter */}
          {activeView !== 'persona' && (
            <div className="flex items-center gap-2">
              <FilterIcon className="text-gray-400" />
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value as Page | 'all')}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Tools</option>
                {tools.map(tool => (
                  <option key={tool} value={tool}>
                    {tool}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-300">{contentStorage.content.length}</div>
          <div className="text-sm text-gray-400">Total Content</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-300">{personas.length}</div>
          <div className="text-sm text-gray-400">Personas</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-300">{tools.length}</div>
          <div className="text-sm text-gray-400">Tools Used</div>
        </div>
      </div>

      {/* Content Grid */}
      {filteredContent.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContent.map(renderContentItem)}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No content found</div>
          <div className="text-gray-500 text-sm mt-2">
            {searchQuery ? 'Try adjusting your search or filters' : 'Start generating content to see it here'}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-2">Delete Content</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete this content? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteContent(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};