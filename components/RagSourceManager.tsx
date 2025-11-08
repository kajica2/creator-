import React, { useState, useCallback } from 'react';
import { RagSource } from '../types';

interface RagSourceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  sources: RagSource[];
  onSourcesChange: React.Dispatch<React.SetStateAction<RagSource[]>>;
}

const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const UrlIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;

export const RagSourceManager: React.FC<RagSourceManagerProps> = ({ isOpen, onClose, sources, onSourcesChange }) => {
    const [urlInput, setUrlInput] = useState('');
    const [urlError, setUrlError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file) continue;

            const sourceId = crypto.randomUUID();
            const newSource: RagSource = {
                id: sourceId,
                type: 'file',
                name: file.name,
                content: '',
                mimeType: file.type,
                status: 'loading',
            };
            onSourcesChange((prevSources) => [...prevSources, newSource]);

            const reader = new FileReader();
            reader.onload = (readEvent) => {
                let fileContent = '';
                if (file.type.startsWith('text/')) {
                    fileContent = readEvent.target?.result as string;
                } else { // For images, audio, video
                    const dataUrl = readEvent.target?.result as string;
                    fileContent = dataUrl.split(',')[1]; // Get only the base64 part
                }
                onSourcesChange(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'ready', content: fileContent } : s));
            };
            reader.onerror = () => {
                onSourcesChange(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'error', content: 'Failed to read file' } : s));
            };

            if (file.type.startsWith('text/')) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        }
    };
    
    const handleAddUrl = () => {
        if (!urlInput.trim()) return;
        setUrlError('');
        
        try {
            new URL(urlInput); // Validate URL format
        } catch (_) {
            setUrlError('Please enter a valid URL.');
            return;
        }

        const sourceId = crypto.randomUUID();
        const newSource: RagSource = {
            id: sourceId,
            type: 'url',
            name: urlInput,
            content: '',
            mimeType: 'text/plain', // Assume URL content is text for now
            status: 'loading',
        };
        onSourcesChange((prevSources) => [...prevSources, newSource]);
        setUrlInput('');
        
        // Simulate fetching URL content
        setTimeout(() => {
             onSourcesChange(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'ready', content: `Content from URL: ${s.name}. (This is a simulation. In a real app, the server would fetch the page content here.)` } : s));
        }, 1500);
    };

    const handleRemoveSource = (id: string) => {
        onSourcesChange(sources.filter(s => s.id !== id));
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-4 transform animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-cyan-400">Manage Context Sources (RAG)</h2>
                    <p className="text-sm text-gray-400 mt-1">Provide documents, URLs, or other data for the AI to reference.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* File Upload */}
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-2">
                        <h3 className="font-semibold text-gray-300">Upload Files</h3>
                        <label htmlFor="file-upload" className="w-full text-center cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors block">
                            Select Files (.txt, images, audio, etc.)
                        </label>
                        <input id="file-upload" type="file" multiple className="hidden" accept=".txt,.md,text/plain,image/*,audio/*,video/*" onChange={handleFileChange} />
                    </div>

                    {/* URL Input */}
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-2">
                         <h3 className="font-semibold text-gray-300">Add from URL</h3>
                         <div className="flex gap-2">
                            <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com" className="flex-grow p-2 bg-gray-800 border border-gray-600 rounded-md text-sm focus:ring-1 focus:ring-purple-500 focus:outline-none" />
                            <button onClick={handleAddUrl} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 rounded-md text-sm">Add</button>
                         </div>
                         {urlError && <p className="text-xs text-red-400">{urlError}</p>}
                    </div>
                </div>
                
                 {/* Connect Services */}
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-2">
                    <h3 className="font-semibold text-gray-300">Connect Services</h3>
                    <button disabled className="w-full flex items-center justify-center text-sm bg-gray-700 text-gray-400 font-bold py-2 px-4 rounded-lg cursor-not-allowed opacity-60">
                        <MailIcon />
                        Connect Gmail (Coming Soon)
                    </button>
                </div>


                {/* Source List */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-gray-300">Active Sources ({sources.length})</h3>
                    {sources.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                            {sources.map(s => (
                                <div key={s.id} className="flex items-center justify-between bg-gray-900/50 p-2 rounded-md border border-gray-700/50">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {s.type === 'file' ? <FileIcon /> : <UrlIcon />}
                                        <span className="text-sm text-gray-300 truncate">{s.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {s.status === 'loading' && <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>}
                                        {s.status === 'error' && <span className="text-xs text-red-400">Error</span>}
                                        <button onClick={() => handleRemoveSource(s.id)} className="text-gray-500 hover:text-white"><TrashIcon /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No sources added yet.</p>
                    )}
                </div>
                
                <button onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                    Done
                </button>
            </div>
        </div>
    );
};