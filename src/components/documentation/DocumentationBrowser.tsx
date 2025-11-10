import React, { useState, useEffect } from 'react';
import { getObsidianSyncService, ObsidianFile, ObsidianNote } from '../../services/obsidian';

interface DocumentationBrowserProps {
  className?: string;
}

export const DocumentationBrowser: React.FC<DocumentationBrowserProps> = ({ className = '' }) => {
  const [files, setFiles] = useState<ObsidianFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ObsidianNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const syncService = getObsidianSyncService();
      const client = (syncService as any).client; // Access the client directly

      const allFiles = await client.listFiles();
      const markdownFiles = allFiles.filter((file: ObsidianFile) => file.extension === 'md');

      setFiles(markdownFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const loadFileContent = async (file: ObsidianFile) => {
    try {
      setLoading(true);
      setError(null);

      const syncService = getObsidianSyncService();
      const client = (syncService as any).client;

      const note = await client.getNote(file.path);
      setSelectedFile(note);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file content');
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupFilesByFolder = (files: ObsidianFile[]) => {
    const grouped: { [key: string]: ObsidianFile[] } = {};

    files.forEach(file => {
      const pathParts = file.path.split('/');
      const folder = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'Root';

      if (!grouped[folder]) {
        grouped[folder] = [];
      }
      grouped[folder].push(file);
    });

    return grouped;
  };

  const groupedFiles = groupFilesByFolder(filteredFiles);

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="border-b border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Documentation Browser</h3>

        {/* Search Bar */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documentation..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={loadFiles}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🔄' : '↻'}
          </button>
        </div>
      </div>

      <div className="flex h-96">
        {/* File List */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          {error && (
            <div className="p-4 text-red-600 bg-red-50">
              {error}
            </div>
          )}

          {loading && (
            <div className="p-4 text-center text-gray-500">
              Loading files...
            </div>
          )}

          {!loading && !error && Object.keys(groupedFiles).length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No documentation files found
            </div>
          )}

          {Object.entries(groupedFiles).map(([folder, folderFiles]) => (
            <div key={folder} className="border-b border-gray-100 last:border-b-0">
              <div className="px-4 py-2 bg-gray-50 font-medium text-sm text-gray-700">
                📁 {folder} ({folderFiles.length})
              </div>

              {folderFiles.map((file) => (
                <div
                  key={file.path}
                  onClick={() => loadFileContent(file)}
                  className={`px-4 py-2 cursor-pointer border-b border-gray-100 hover:bg-blue-50 ${
                    selectedFile?.path === file.path ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">
                    📄 {file.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatFileSize(file.stat.size)} • {formatDate(file.stat.mtime)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* File Content */}
        <div className="w-2/3 overflow-y-auto">
          {selectedFile ? (
            <div className="p-4">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h4 className="font-semibold text-gray-900">{selectedFile.path}</h4>

                {/* Frontmatter */}
                {selectedFile.frontmatter && Object.keys(selectedFile.frontmatter).length > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <div className="font-medium text-gray-700 mb-1">Metadata:</div>
                    {Object.entries(selectedFile.frontmatter).map(([key, value]) => (
                      <div key={key} className="text-gray-600">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tags */}
                {selectedFile.tags && selectedFile.tags.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">Tags: </span>
                    {selectedFile.tags.map((tag) => (
                      <span key={tag} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mr-1">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Links */}
                {selectedFile.links && selectedFile.links.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">Links: </span>
                    {selectedFile.links.map((link) => (
                      <span key={link} className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded mr-1">
                        [[{link}]]
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {selectedFile.content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Select a file to view its content
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      {selectedFile && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Open in Obsidian (would need to implement deep linking)
                const obsidianUrl = `obsidian://open?vault=${encodeURIComponent('viral-hashtag-ai')}&file=${encodeURIComponent(selectedFile.path)}`;
                window.open(obsidianUrl, '_blank');
              }}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
            >
              📱 Open in Obsidian
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(selectedFile.content);
              }}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              📋 Copy Content
            </button>

            <button
              onClick={() => {
                const blob = new Blob([selectedFile.content], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = selectedFile.path.split('/').pop() || 'document.md';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              💾 Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};