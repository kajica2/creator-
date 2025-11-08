import React, { useState, useEffect } from 'react';
import { PromptHistoryItem } from '../types';

interface PromptHistoryProps {
  history: PromptHistoryItem[];
  onClear: () => void;
}

const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const CopyIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM5 11a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z" />
    </svg>
);

const PromptItem: React.FC<{ item: PromptHistoryItem }> = ({ item }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(item.prompt);
        setIsCopied(true);
    };

    useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => setIsCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isCopied]);

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 transition-all hover:border-purple-500/50">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-gray-200">{item.type}</h3>
                    <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-1 px-2.5 rounded-full transition-colors"
                >
                    <CopyIcon />
                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                </button>
            </div>
            <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap font-mono">{item.prompt}</p>
        </div>
    );
}

export const PromptHistory: React.FC<PromptHistoryProps> = ({ history, onClear }) => {
    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex justify-between items-center">
                <div className="flex items-center">
                    <HistoryIcon />
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">Prompt History</h2>
                </div>
                {history.length > 0 && (
                    <button
                        onClick={onClear}
                        className="flex items-center text-sm bg-red-600/50 hover:bg-red-600/80 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                       <TrashIcon /> Clear All
                    </button>
                )}
            </div>
            
            {history.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500">Your generated prompts will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map(item => <PromptItem key={item.id} item={item} />)}
                </div>
            )}
        </div>
    );
};