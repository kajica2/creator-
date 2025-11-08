import React, { useMemo, useState } from 'react';
import { HashtagCategory, ReadySet, HashtagSize } from '../types';
import { HashtagFilters } from './HashtagFilters';
import { HashtagCategoryComponent } from './HashtagCategory';
import { ReadySetsComponent } from './ReadySets';
import UrlHashtagGenerator from './UrlHashtagGenerator';

interface HashtagManagerProps {
    hashtagCategories: HashtagCategory[];
    readySets: ReadySet[];
    selectedHashtags: Set<string>;
    onHashtagSelect: (name: string) => void;
    onSelectSet: (hashtags: string[]) => void;
    isLoadingCategories?: boolean;
    isLoadingReadySets?: boolean;
    onRefreshReadySets?: () => void;
    isCategoriesFallback?: boolean;
    isReadySetsFallback?: boolean;
}

export const HashtagManager: React.FC<HashtagManagerProps> = ({
    hashtagCategories,
    readySets,
    selectedHashtags,
    onHashtagSelect,
    onSelectSet,
    isLoadingCategories = false,
    isLoadingReadySets = false,
    onRefreshReadySets,
    isCategoriesFallback = false,
    isReadySetsFallback = false,
}) => {
    const [activeView, setActiveView] = useState<'explore' | 'sets' | 'url-generator'>('explore');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSizes, setSelectedSizes] = useState<Set<HashtagSize>>(new Set(Object.values(HashtagSize)));

    const handleSizeToggle = (size: HashtagSize) => {
        setSelectedSizes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(size)) {
                newSet.delete(size);
            } else {
                newSet.add(size);
            }
            if (newSet.size === 0) {
                return new Set(Object.values(HashtagSize));
            }
            return newSet;
        });
    };

    const filteredCategories = useMemo(() => {
        return hashtagCategories.map(category => {
            const filteredHashtags = category.hashtags.filter(hashtag =>
                hashtag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                selectedSizes.has(hashtag.size)
            );
            return { ...category, hashtags: filteredHashtags };
        }).filter(category => category.hashtags.length > 0);
    }, [searchTerm, selectedSizes, hashtagCategories]);


    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 p-1 rounded-xl flex items-center space-x-1 max-w-md mx-auto">
                <button
                    onClick={() => setActiveView('explore')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeView === 'explore' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    Explore
                </button>
                 <button
                    onClick={() => setActiveView('sets')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeView === 'sets' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    Ready Sets
                </button>
                <button
                    onClick={() => setActiveView('url-generator')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeView === 'url-generator' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    URL Generator
                </button>
            </div>

            {activeView === 'explore' && (
                <div className="space-y-6">
                    {isCategoriesFallback && (
                        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200">
                            Showing built-in hashtag catalogue while Supabase data is unavailable.
                        </div>
                    )}
                    <HashtagFilters
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        selectedSizes={selectedSizes}
                        onSizeToggle={handleSizeToggle}
                    />
                    {isLoadingCategories ? (
                        <div className="flex items-center justify-center rounded-lg border border-gray-700 bg-gray-900/60 py-12 text-sm text-gray-400">
                            Loading hashtag catalogue...
                        </div>
                    ) : (
                        filteredCategories.map(cat => (
                            <HashtagCategoryComponent
                                key={cat.category}
                                category={cat}
                                selectedHashtags={selectedHashtags}
                                onHashtagSelect={onHashtagSelect}
                            />
                        ))
                    )}
                </div>
            )}

            {activeView === 'sets' && (
                <ReadySetsComponent
                    sets={readySets}
                    onSelectSet={onSelectSet}
                    onSetUpdate={onRefreshReadySets}
                    isLoading={isLoadingReadySets}
                    isFallback={isReadySetsFallback}
                />
            )}

            {activeView === 'url-generator' && (
                <UrlHashtagGenerator onSetUpdate={onRefreshReadySets} />
            )}
        </div>
    )

}