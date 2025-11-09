import React, { useMemo, useState } from 'react';
import { HashtagCategory, ReadySet, HashtagSize } from '../types';
import { HashtagFilters } from './HashtagFilters';
import { HashtagCategoryComponent } from './HashtagCategory';
import { ReadySetsComponent } from './ReadySets';
import UrlHashtagGenerator from './UrlHashtagGenerator';
import HashtagCloud from './HashtagCloud';

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
    const [activeView, setActiveView] = useState<'explore' | 'cloud' | 'sets' | 'url-generator'>('explore');
    const [cloudViewMode, setCloudViewMode] = useState<'all' | 'trending'>('all');
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
            <div className="bg-gray-800/50 border border-gray-700 p-1 rounded-xl flex items-center space-x-1 max-w-2xl mx-auto">
                <button
                    onClick={() => setActiveView('explore')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeView === 'explore' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    Explore
                </button>
                <button
                    onClick={() => setActiveView('cloud')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeView === 'cloud' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    Cloud View
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

            {activeView === 'cloud' && (
                <div className="space-y-6">
                    {/* Cloud view controls */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <HashtagFilters
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                selectedSizes={selectedSizes}
                                onSizeToggle={handleSizeToggle}
                            />
                        </div>
                        <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl sm:max-w-xs">
                            <label className="text-sm font-semibold text-gray-400 block mb-2">View Mode:</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCloudViewMode('all')}
                                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                        cloudViewMode === 'all'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setCloudViewMode('trending')}
                                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                        cloudViewMode === 'trending'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Trending
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Hashtag Cloud */}
                    <HashtagCloud
                        selectedHashtags={selectedHashtags}
                        onHashtagSelect={onHashtagSelect}
                        searchTerm={searchTerm}
                        selectedSizes={selectedSizes}
                        showTrendingOnly={cloudViewMode === 'trending'}
                        maxHashtags={150}
                        sortBy="trending"
                        className="min-h-96"
                    />
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