import React, { useState, useMemo } from 'react';
import { ContentStorage, StoredContentItem } from '../types';
import { downloadWebsiteAsZip } from '../utils/zipDownload';

interface WebsiteManagerProps {
  contentStorage: ContentStorage;
  onContentStorageUpdate: (storage: ContentStorage) => void;
}

export const WebsiteManager: React.FC<WebsiteManagerProps> = ({
  contentStorage,
  onContentStorageUpdate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [websiteToDelete, setWebsiteToDelete] = useState<StoredContentItem | null>(null);

  // Filter website content items
  const websiteItems = useMemo(() => {
    const items = contentStorage.content.filter(item => item.tool === 'AI Website');
    
    // Filter by search query
    const filtered = searchQuery 
      ? items.filter(item => 
          item.metadata?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.content?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : items;
    
    // Sort items
    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return b.createdAt - a.createdAt;
      } else {
        return (a.metadata?.title || '').localeCompare(b.metadata?.title || '');
      }
    });
  }, [contentStorage.content, searchQuery, sortBy]);

  const handleOpenWebsite = (item: StoredContentItem) => {
    if (item.content) {
      const blob = new Blob([item.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  const handleDownloadZip = async (item: StoredContentItem) => {
    if (item.content) {
      // Extract title from content or use default
      let websiteTitle = 'Generated Website';
      if (typeof item.content === 'string') {
        const titleMatch = item.content.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          websiteTitle = titleMatch[1].trim();
        }
      }
      await downloadWebsiteAsZip(item.content, websiteTitle);
    }
  };

  const handleEditWebsite = (item: StoredContentItem) => {
    // Navigate to AI Website generator with the existing content
    // This would require additional implementation to pass the content
    console.log('Edit website:', item);
  };

  const handleDeleteWebsite = (item: StoredContentItem) => {
    setWebsiteToDelete(item);
  };

  const confirmDeleteWebsite = () => {
    if (websiteToDelete) {
      const updatedStorage = {
        ...contentStorage,
        content: contentStorage.content.filter(item => item.id !== websiteToDelete.id)
      };
      onContentStorageUpdate(updatedStorage);
      setWebsiteToDelete(null);
    }
  };

  const cancelDeleteWebsite = () => {
    setWebsiteToDelete(null);
  };

  const getWebsiteThumbnail = (item: StoredContentItem) => {
    // Extract website title from content for placeholder
    let websiteTitle = 'Website';
    if (typeof item.content === 'string') {
      const titleMatch = item.content.match(/<title[^>]*>(.*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        websiteTitle = titleMatch[1].trim();
      }
    }
    
    // Use a gradient placeholder based on the item ID for consistent colors
    const colorThemes = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500'
    ];
    
    const colorIndex = Math.abs(item.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colorThemes.length;
    const gradient = colorThemes[colorIndex];
    
    return (
      <div className={`w-full h-32 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center`}>
        <span className="text-white text-sm font-medium">
          {websiteTitle.substring(0, 20)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Website Manager</h1>
          <p className="text-gray-400">Manage and organize your generated websites</p>
        </div>
        <div className="text-sm text-gray-400">
          {websiteItems.length} website{websiteItems.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search websites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
          className="p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white"
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Website Grid */}
      {websiteItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websiteItems.map((item) => (
            <div
              key={item.id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-purple-500/50 transition-all duration-200"
            >
              {/* Thumbnail */}
              <div className="mb-4">
                {getWebsiteThumbnail(item)}
              </div>

              {/* Website Info */}
              <div className="space-y-2 mb-4">
                <h3 className="font-semibold text-white text-lg truncate">
                  {(() => {
                    if (typeof item.content === 'string') {
                      const titleMatch = item.content.match(/<title[^>]*>(.*?)<\/title>/i);
                      if (titleMatch && titleMatch[1]) {
                        return titleMatch[1].trim();
                      }
                    }
                    return 'Untitled Website';
                  })()}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{item.personaName}</span>
                </div>
                {item.metadata?.prompt && (
                  <p className="text-sm text-gray-300 line-clamp-2">
                    {item.metadata.prompt.substring(0, 100)}...
                  </p>
                )}
              </div>

              {/* Links Section */}
              <div className="space-y-2 mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenWebsite(item)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    <span>🔗</span>
                    Open
                  </button>
                  <button
                    onClick={() => handleDownloadZip(item)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    <span>📦</span>
                    Download ZIP
                  </button>
                </div>
              </div>

              {/* Actions Section */}
              <div className="flex gap-2 pt-3 border-t border-gray-700">
                <button
                  onClick={() => handleEditWebsite(item)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  <span>✏️</span>
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteWebsite(item)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  <span>🗑️</span>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌐</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Websites Generated Yet</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery ? 'No websites match your search' : 'Generate your first website to get started'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => window.location.hash = '#ai-website'}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-6 rounded-lg transition-all"
            >
              Generate Website
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {websiteToDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div
            className="bg-gray-800 border border-red-500/50 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 transform animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white">Delete Website</h3>
            
            <div className="space-y-2">
              <p className="text-gray-300">
                Are you sure you want to delete <strong className="text-white">{websiteToDelete.metadata?.title || 'this website'}</strong>?
              </p>
              <p className="text-sm text-red-400">
                This action cannot be undone. The website will be permanently removed.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={cancelDeleteWebsite}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteWebsite}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Delete Website
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};