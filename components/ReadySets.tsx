
import React, { useState } from 'react';
import { ReadySet } from '../types';
import SetCreatorModal from './SetCreatorModal';
import HashtagAdderModal from './HashtagAdderModal';
import BatchHashtagImportModal from './BatchHashtagImportModal';
import { getUserCollections, addToFavorites, removeFromFavorites, createCustomSet } from '../utils/hashtagStorage';

interface ReadySetsProps {
    sets: ReadySet[];
    onSelectSet: (hashtags: string[]) => void;
    onSetUpdate?: () => void;
    isLoading?: boolean;
    isFallback?: boolean;
}

const ClipboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
    </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} stroke="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const ExpandIcon = ({ expanded }: { expanded: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d={expanded ? "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" : "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"} clipRule="evenodd" />
    </svg>
);

export const ReadySetsComponent: React.FC<ReadySetsProps> = ({
    sets,
    onSelectSet,
    onSetUpdate,
    isLoading = false,
    isFallback = false
}) => {
    const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());
    const [isSetCreatorOpen, setIsSetCreatorOpen] = useState(false);
    const [isHashtagAdderOpen, setIsHashtagAdderOpen] = useState(false);
    const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
    const [userCollections, setUserCollections] = useState(getUserCollections());

    const toggleSetExpansion = (setTitle: string) => {
        const newExpanded = new Set(expandedSets);
        if (newExpanded.has(setTitle)) {
            newExpanded.delete(setTitle);
        } else {
            newExpanded.add(setTitle);
        }
        setExpandedSets(newExpanded);
    };

    const handleCreateSet = (setName: string, category: string) => {
        createCustomSet(setName, category, []);
        setUserCollections(getUserCollections());
        onSetUpdate?.();
    };

    const handleAddHashtag = (hashtag: string, category: string) => {
        // For now, we'll just add to favorites
        addToFavorites(hashtag);
        setUserCollections(getUserCollections());
        onSetUpdate?.();
    };

    const toggleFavorite = (hashtag: string) => {
        if (userCollections.favorites.includes(hashtag)) {
            removeFromFavorites(hashtag);
        } else {
            addToFavorites(hashtag);
        }
        setUserCollections(getUserCollections());
        onSetUpdate?.();
    };

    const getHashtagSuggestions = () => {
        const allHashtags = sets.flatMap(set => set.hashtags);
        return [...new Set(allHashtags)].slice(0, 20);
    };

    const getExistingCategories = () => {
        return [...new Set(sets.map(set => set.category))];
    };

    const displayHashtags = (set: ReadySet) => {
        const isExpanded = expandedSets.has(set.title);
        const displayCount = isExpanded ? set.hashtags.length : 5;
        return set.hashtags.slice(0, displayCount);
    };

    const handleBatchImportComplete = () => {
        setUserCollections(getUserCollections());
        onSetUpdate?.();
    };

    return (
        <div className="space-y-4">
            {/* Enhanced Header with Action Buttons */}
            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-purple-300">Hashtag Sets</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setIsHashtagAdderOpen(true)}
                            className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 px-3 rounded-full transition-colors"
                        >
                            <PlusIcon />
                            <span>Add Hashtag</span>
                        </button>
                        <button
                            onClick={() => setIsSetCreatorOpen(true)}
                            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-3 rounded-full transition-colors"
                        >
                            <PlusIcon />
                            <span>New Set</span>
                        </button>
                        <button
                            onClick={() => setIsBatchImportOpen(true)}
                            className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-1.5 px-3 rounded-full transition-colors"
                        >
                            <PlusIcon />
                            <span>Batch Import</span>
                        </button>
                    </div>
                </div>
                <p className="text-sm text-gray-400">Select a pre-made set or create your own collections.</p>
                {isFallback && (
                    <div className="mt-3 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
                        Showing built-in ready sets while Supabase data is unavailable.
                    </div>
                )}
            </div>

            {isLoading && (
                <div className="flex items-center justify-center rounded-xl border border-gray-700 bg-gray-900/60 py-12 text-sm text-gray-400">
                    Loading ready sets...
                </div>
            )}

            {/* Sets Display - Grouped by Collection */}
            {!isLoading && (() => {
                // Group sets by title to create collections
                const groupedSets = sets.reduce((acc, set) => {
                    const collectionName = set.title;
                    if (!acc[collectionName]) {
                        acc[collectionName] = [];
                    }
                    acc[collectionName].push(set);
                    return acc;
                }, {} as Record<string, typeof sets>);

                return Object.entries(groupedSets).map(([collectionName, collectionSets]) => {
                    const typedCollectionSets = collectionSets as typeof sets;
                    const isExpanded = expandedSets.has(collectionName);
                    const totalHashtags = typedCollectionSets.reduce((sum, set) => sum + set.hashtags.length, 0);
                    const uniqueHashtags = [...new Set(typedCollectionSets.flatMap(set => set.hashtags))];
                    
                    return (
                        <div key={collectionName} className="bg-gray-800/50 border border-gray-700 rounded-xl shadow-md p-4 transition-all hover:border-purple-500/50">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center space-x-2">
                                    <h3 className="font-bold text-gray-200">{collectionName}</h3>
                                    <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                                        {typedCollectionSets.length} set{typedCollectionSets.length > 1 ? 's' : ''}
                                    </span>
                                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                        {totalHashtags} hashtags
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => toggleSetExpansion(collectionName)}
                                        className="flex items-center space-x-1 text-gray-400 hover:text-gray-200 text-xs transition-colors"
                                    >
                                        <ExpandIcon expanded={isExpanded} />
                                        <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
                                    </button>
                                    <button
                                        onClick={() => onSelectSet(uniqueHashtags)}
                                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-1.5 px-3 rounded-full transition-colors"
                                    >
                                        <ClipboardIcon />
                                        <span>Select Collection</span>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Collection Summary */}
                            {!isExpanded && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {uniqueHashtags.slice(0, 8).map((tag: string) => (
                                        <div key={tag} className="flex items-center space-x-1 bg-gray-700 text-gray-300 px-2 py-0.5 rounded-md group">
                                            <span className="text-xs">{tag}</span>
                                            <button
                                                onClick={() => toggleFavorite(tag)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                                            >
                                                <HeartIcon filled={userCollections.favorites.includes(tag)} />
                                            </button>
                                        </div>
                                    ))}
                                    {uniqueHashtags.length > 8 && (
                                        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-md">
                                            +{uniqueHashtags.length - 8} more
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Expanded View - Individual Sets */}
                            {isExpanded && typedCollectionSets.map((set, index) => (
                                <div key={`${set.id}-${index}`} className="mb-4 last:mb-0 border-l-2 border-purple-500/50 pl-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center space-x-2">
                                            <h4 className="font-semibold text-gray-300 text-sm">
                                                {set.category} • {set.hashtags.length} hashtags
                                            </h4>
                                        </div>
                                        <button
                                            onClick={() => onSelectSet(set.hashtags)}
                                            className="flex items-center space-x-1 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold py-1 px-2 rounded transition-colors"
                                        >
                                            <ClipboardIcon />
                                            <span>Select Set</span>
                                        </button>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-1.5">
                                        {set.hashtags.map((tag: string) => (
                                            <div key={tag} className="flex items-center space-x-1 bg-gray-700 text-gray-300 px-2 py-0.5 rounded-md group">
                                                <span className="text-xs">{tag}</span>
                                                <button
                                                    onClick={() => toggleFavorite(tag)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                                                >
                                                    <HeartIcon filled={userCollections.favorites.includes(tag)} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {!isExpanded && uniqueHashtags.length > 8 && (
                                <div className="text-center">
                                    <button
                                        onClick={() => toggleSetExpansion(collectionName)}
                                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                    >
                                        Expand to see {typedCollectionSets.length} set{typedCollectionSets.length > 1 ? 's' : ''} with {totalHashtags} total hashtags
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                });
            })()}

            {/* User Collections Section */}
            {userCollections.customSets.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-semibold text-green-300 mb-3">Your Collections</h3>
                    {userCollections.customSets.map(set => (
                        <div key={set.name} className="bg-green-900/20 border border-green-700 rounded-xl shadow-md p-4 mb-3">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center space-x-2">
                                    <h4 className="font-bold text-green-200">{set.name}</h4>
                                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                        {set.hashtags.length}
                                    </span>
                                </div>
                                <span className="text-xs text-green-400 bg-green-900/50 px-2 py-1 rounded">
                                    {set.category}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {set.hashtags.map(tag => (
                                    <span key={tag} className="text-xs bg-green-800/50 text-green-200 px-2 py-0.5 rounded-md">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Favorites Section */}
            {userCollections.favorites.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-semibold text-red-300 mb-3">Your Favorites</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {userCollections.favorites.map(tag => (
                            <div key={tag} className="flex items-center space-x-1 bg-red-900/30 border border-red-700 text-red-200 px-2 py-0.5 rounded-md">
                                <span className="text-xs">{tag}</span>
                                <button
                                    onClick={() => toggleFavorite(tag)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <HeartIcon filled={true} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            <SetCreatorModal
                isOpen={isSetCreatorOpen}
                onClose={() => setIsSetCreatorOpen(false)}
                onCreateSet={handleCreateSet}
                existingCategories={getExistingCategories()}
            />

            <HashtagAdderModal
                isOpen={isHashtagAdderOpen}
                onClose={() => setIsHashtagAdderOpen(false)}
                onAddHashtag={handleAddHashtag}
                existingSets={sets}
                existingCategories={getExistingCategories()}
                hashtagSuggestions={getHashtagSuggestions()}
            />

            <BatchHashtagImportModal
                isOpen={isBatchImportOpen}
                onClose={() => setIsBatchImportOpen(false)}
                onImportComplete={handleBatchImportComplete}
            />
        </div>
    );
};
