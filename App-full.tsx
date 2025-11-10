import React, { useState, useMemo, useCallback, useEffect, Suspense, memo } from 'react';
// import { AccessibilityProvider, useAccessibility, useKeyboardNavigation, useLiveRegion } from './src/hooks/useAccessibility.tsx';
// import { ARIA_ROLES, ARIA_PROPERTIES, keyboardShortcuts } from './src/utils/accessibility';
import { hashtagCategories, readySets } from './data/hashtags';
import { Hashtag, HashtagSize, PromptHistoryItem, PromptType, RagSource, User, SubscriptionPlan, Page, GeneratedContentStore } from './types';

// Performance optimization: Keep critical components loaded immediately
import { SelectedTray } from './components/SelectedTray';
import { PromptHistory } from './components/PromptHistory';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ContextModifier } from './components/ContextModifier';
import { Auth } from './components/Auth';
import { UpgradeModal } from './components/UpgradeModal';
import { Sidebar } from './components/Sidebar';
import { HashtagManager } from './components/HashtagManager';
import { OnboardingModal } from './components/OnboardingModal';

// Import existing components directly for now
import { AIStoryGenerator } from './components/AIStoryGenerator';
import { SunoLyricsGenerator } from './components/SunoLyricsGenerator';
import { WebsiteStrategyGenerator } from './components/WebsiteStrategyGenerator';
import { AISkillGenerator } from './components/AISkillGenerator';
import { TensorMutator } from './components/TensorMutator';
import { AIConceptGenerator } from './components/AIConceptGenerator';
import { TextToImageGenerator } from './components/TextToImageGenerator';
import { ImageEditor } from './components/ImageEditor';
import { AIWebsiteGenerator } from './components/AIWebsiteGenerator';
import { RagSourceManager } from './components/RagSourceManager';
import { BatchMediaImportModal } from './components/BatchMediaImportModal';
import { GalleryComponent } from './components/Gallery';
import { ProductRoadmap } from './components/ProductRoadmap';
import { Settings } from './components/Settings';
import { Subscription } from './components/Subscription';
import { BatchImageGenerator } from './components/BatchImageGenerator';
import { BatchPromptGenerator } from './components/BatchPromptGenerator';
import { ThinkingMode } from './components/ThinkingMode';
import { AudioTranscriber } from './components/AudioTranscriber';
import AudioAgentIntegrationExample from './components/audio/AudioAgentIntegrationExample';
import { SentryNavigationCloud } from './components/SentryNavigationCloud';
import SynapticSymphony from './projects/synaptic-symphony/SynapticSymphony';
import { MediaLibrary } from './components/MediaLibrary';
// import { ObsidianPanel, DocumentationBrowser } from './components/documentation';


const PersonaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
    </svg>
);

const ContextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM5 11a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z" />
    </svg>
);

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const SkipLink = () => (
    <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-blue-600 text-white px-4 py-2 rounded-b-md font-medium"
    >
        Skip to main content
    </a>
);


const AppContent: React.FC = memo(() => {
    const { announceMessage } = useAccessibility();
    const { announce, LiveRegion } = useLiveRegion();
    const { measureAsyncOperation } = usePerformanceMonitor('AppContent');

    // Service worker for caching and offline support
    const {
        isOnline,
        updateAvailable,
        triggerUpdate,
        cacheUrls
    } = useServiceWorker({
        onSuccess: () => console.log('App cached for offline use'),
        onUpdate: () => console.log('New app version available'),
        onOffline: () => announce('App is now offline'),
        onOnline: () => announce('App is back online')
    });

    const [activePage, setActivePage] = useState<Page>('Hashtag Manager');
    const [selectedHashtags, setSelectedHashtags] = useState<Set<string>>(new Set());
    const [promptHistory, setPromptHistory] = useState<PromptHistoryItem[]>(() => {
        try {
            const savedHistory = localStorage.getItem('promptHistory');
            return savedHistory ? JSON.parse(savedHistory) : [];
        } catch (error) {
            console.error("Could not load prompt history from localStorage", error);
            return [];
        }
    });
    const [language, setLanguage] = useState<'en' | 'sr'>('en');
    const [aiContext, setAiContext] = useState<string>('');
    const [isContextModalOpen, setIsContextModalOpen] = useState(false);
    const [ragSources, setRagSources] = useState<RagSource[]>([]);
    const [isRagModalOpen, setIsRagModalOpen] = useState(false);
    const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>('free');
    const [credits, setCredits] = useState(10);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContentStore>({});
    
    const allHashtags = useMemo(() => hashtagCategories.flatMap(c => c.hashtags), []);

    useEffect(() => {
        try {
            localStorage.setItem('promptHistory', JSON.stringify(promptHistory));
        } catch (error) {
            console.error("Could not save prompt history to localStorage", error);
        }
    }, [promptHistory]);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeenOnboarding) {
            setIsOnboardingOpen(true);
        }
    }, []);

    const handleCloseOnboarding = () => {
        localStorage.setItem('hasSeenOnboarding', 'true');
        setIsOnboardingOpen(false);
    };

    const handleHashtagSelect = useCallback((name: string) => {
        setSelectedHashtags(prev => {
            const newSet = new Set(prev);
            if (newSet.has(name)) {
                newSet.delete(name);
                announce(`Hashtag ${name} removed from selection. ${newSet.size} hashtags selected.`);
            } else {
                newSet.add(name);
                announce(`Hashtag ${name} added to selection. ${newSet.size} hashtags selected.`);
            }
            return newSet;
        });
    }, [announce]);

    const handleClearSelected = useCallback(() => {
        const count = selectedHashtags.size;
        setSelectedHashtags(new Set());
        if (count > 0) {
            announce(`All ${count} hashtags cleared from selection.`);
        }
    }, [selectedHashtags.size, announce]);

    const handleSelectSet = useCallback((hashtags: string[]) => {
        setSelectedHashtags(new Set(hashtags));
        setActivePage('AI Story'); // Navigate to a relevant tab after selecting a set
    }, []);

    const handleAddPromptToHistory = useCallback((prompt: { type: PromptType; prompt: string }) => {
        const newHistoryItem: PromptHistoryItem = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            ...prompt,
        };
        setPromptHistory(prev => [newHistoryItem, ...prev].slice(0, 50));
    }, []);
    
    const handleContentGenerated = useCallback((page: Page, content: any) => {
        setGeneratedContent(prev => ({
            ...prev,
            [page]: content
        }));
    }, []);

    const handleClearHistory = useCallback(() => {
        setPromptHistory([]);
    }, []);

    const handleSetAiContext = (context: string) => {
        setAiContext(context);
        setIsContextModalOpen(false);
    };

    const handleAuthSuccess = useCallback((authedUser: User) => {
        setUser(authedUser);
        setActivePage('Media Library');
    }, []);

    const handleSignOut = useCallback(() => {
        setUser(null);
        setActivePage('Hashtag Manager');
    }, []);
    
    const handleAttemptGeneration = useCallback((generationFn: () => Promise<void>, count: number = 1) => {
        if (subscriptionPlan === 'free' && credits < count) {
            setIsUpgradeModalOpen(true);
            return;
        }

        if (subscriptionPlan === 'free') {
            setCredits(prev => prev - count);
        }

        generationFn();
    }, [subscriptionPlan, credits]);

    const handleUpgradePlan = (plan: SubscriptionPlan) => {
        setSubscriptionPlan(plan);
        if (plan !== 'free') {
            setCredits(Infinity); 
        } else {
            setCredits(10);
        }
        setActivePage('Subscription');
    };
    
    const handleAddCredits = (amount: number) => {
        setCredits(prev => prev + amount);
    };

    const selectedHashtagObjects = useMemo(() => {
        return allHashtags.filter(h => selectedHashtags.has(h.name));
    }, [selectedHashtags, allHashtags]);
    
    const activeRagSources = useMemo(() => ragSources.filter(s => s.status === 'ready'), [ragSources]);

    const handlePageChange = useCallback((page: Page) => {
        setActivePage(page);
        setIsSidebarOpen(false);
        announce(`Navigated to ${page}`);

        // Preload components based on page category for better UX
        if (['AI Story', 'AI Lyrics', 'AI Strategy', 'AI Skill', 'AI Mutator', 'AI Concept'].includes(page)) {
            preloadContentCreation();
        } else if (['Text-to-Image', 'Image Edit', 'Batch Images', 'Batch Prompts'].includes(page)) {
            preloadImageStudio();
        } else if (['Thinking Mode', 'Audio Transcriber', 'Audio Agents', 'Synaptic Symphony'].includes(page)) {
            preloadAdvancedTools();
        } else if (['Media Library', 'Gallery', 'Website Manager', 'Sentry Navigation Cloud'].includes(page)) {
            preloadGallery();
        } else if (['Settings', 'Subscription', 'Roadmap', 'Gamification'].includes(page)) {
            preloadAccount();
        }
    }, [announce]);

    const handleBatchImportComplete = useCallback((importedSources: RagSource[]) => {
        setRagSources(prev => {
            const existingIds = new Set(prev.map(source => source.id));
            const deduped = importedSources.filter(source => !existingIds.has(source.id));
            return [...prev, ...deduped];
        });
    }, []);

    const renderContent = useCallback(() => {
        const commonProps = {
            user,
            onPromptGenerated: handleAddPromptToHistory,
            language,
            aiContext,
            ragSources: activeRagSources,
            onAttemptGeneration: handleAttemptGeneration,
            onContentGenerated: handleContentGenerated
        };

        switch (activePage) {
            case 'Roadmap':
                return (
                    <LoadingWrapper loadingType="skeleton">
                        <ProductRoadmap />
                    </LoadingWrapper>
                );
            case 'Settings':
                return (
                    <LoadingWrapper loadingType="skeleton">
                        <Settings />
                    </LoadingWrapper>
                );
            case 'Subscription':
                return (
                    <LoadingWrapper loadingType="skeleton">
                        <Subscription
                            currentPlan={subscriptionPlan}
                            onUpgradePlan={handleUpgradePlan}
                            onAddCredits={handleAddCredits}
                        />
                    </LoadingWrapper>
                );
            case 'Hashtag Manager':
                return <HashtagManager
                    hashtagCategories={hashtagCategories}
                    readySets={readySets}
                    selectedHashtags={selectedHashtags}
                    onHashtagSelect={handleHashtagSelect}
                    onSelectSet={handleSelectSet}
                />;
            case 'AI Story':
                return (
                    <LoadingWrapper>
                        <AIStoryGenerator {...commonProps} selectedHashtags={selectedHashtagObjects} />
                    </LoadingWrapper>
                );
            case 'AI Lyrics':
                return (
                    <LoadingWrapper>
                        <SunoLyricsGenerator {...commonProps} />
                    </LoadingWrapper>
                );
            case 'AI Strategy':
                return (
                    <LoadingWrapper>
                        <WebsiteStrategyGenerator {...commonProps} />
                    </LoadingWrapper>
                );
            case 'AI Skill':
                return (
                    <LoadingWrapper>
                        <AISkillGenerator {...commonProps} />
                    </LoadingWrapper>
                );
            case 'AI Mutator':
                return (
                    <LoadingWrapper>
                        <TensorMutator {...commonProps} />
                    </LoadingWrapper>
                );
            case 'AI Concept':
                return (
                    <LoadingWrapper>
                        <AIConceptGenerator {...commonProps} />
                    </LoadingWrapper>
                );
            case 'Text-to-Image':
                return (
                    <LoadingWrapper>
                        <TextToImageGenerator {...commonProps} />
                    </LoadingWrapper>
                );
            case 'Image Edit':
                return (
                    <LoadingWrapper>
                        <ImageEditor
                            user={user}
                            onPromptGenerated={handleAddPromptToHistory}
                            aiContext={aiContext}
                            ragSources={activeRagSources}
                            onAttemptGeneration={handleAttemptGeneration}
                            onContentGenerated={handleContentGenerated}
                        />
                    </LoadingWrapper>
                );
            case 'Batch Images':
                return (
                    <LoadingWrapper>
                        <BatchImageGenerator {...commonProps} />
                    </LoadingWrapper>
                );
            case 'Batch Prompts':
                return (
                    <LoadingWrapper>
                        <BatchPromptGenerator {...commonProps} />
                    </LoadingWrapper>
                );
            case 'AI Website':
                return (
                    <LoadingWrapper>
                        <AIWebsiteGenerator {...commonProps} generatedContent={generatedContent} />
                    </LoadingWrapper>
                );
            case 'Thinking Mode':
                return (
                    <LoadingWrapper>
                        <ThinkingMode {...commonProps} />
                    </LoadingWrapper>
                );
            case 'Audio Transcriber':
                return (
                    <LoadingWrapper>
                        <AudioTranscriber {...commonProps} />
                    </LoadingWrapper>
                );
            case 'Audio Agents':
                return (
                    <LoadingWrapper>
                        <AudioAgentIntegrationExample userId={user?.id} />
                    </LoadingWrapper>
                );
            case 'Synaptic Symphony':
                return (
                    <LoadingWrapper>
                        <SynapticSymphony />
                    </LoadingWrapper>
                );
            case 'Sentry Navigation Cloud':
                return (
                    <LoadingWrapper>
                        <SentryNavigationCloud
                            width={1200}
                            height={700}
                            showCategories={true}
                            interactive={true}
                            onItemClick={(item) => {
                                console.log('Sentry navigation item clicked:', item);
                                alert(`Would navigate to: ${item.name}\nURL: ${item.url}\nDescription: ${item.description}`);
                            }}
                        />
                    </LoadingWrapper>
                );
            case 'Gallery':
                return (
                    <LoadingWrapper>
                        <GalleryComponent />
                    </LoadingWrapper>
                );
            case 'Media Library':
                return (
                    <LoadingWrapper>
                        <MediaLibrary user={user} onOpenBatchImport={() => setIsBatchImportModalOpen(true)} />
                    </LoadingWrapper>
                );
            case 'Documentation':
                return (
                    <div className="space-y-6">
                        <div className="p-6 bg-gray-50 rounded-lg">
                            <h2 className="text-2xl font-bold mb-4">Documentation</h2>
                            <p>Documentation components coming soon...</p>
                        </div>
                    </div>
                );
            case 'History':
                return <PromptHistory history={promptHistory} onClear={handleClearHistory} />;
            default:
                return null;
        }
    }, [activePage, user, handleAddPromptToHistory, language, aiContext, activeRagSources, handleAttemptGeneration, handleContentGenerated, subscriptionPlan, handleUpgradePlan, handleAddCredits, hashtagCategories, readySets, selectedHashtags, handleHashtagSelect, handleSelectSet, selectedHashtagObjects, generatedContent, promptHistory, handleClearHistory, setIsBatchImportModalOpen]);

    // Keyboard shortcuts handler
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Alt+M - Open menu
            if (event.altKey && event.key === 'm') {
                event.preventDefault();
                setIsSidebarOpen(!isSidebarOpen);
                announce('Navigation menu toggled');
            }
            // Alt+H - Show help
            if (event.altKey && event.key === 'h') {
                event.preventDefault();
                announce('Keyboard shortcuts: Alt+M for menu, Alt+H for help, Alt+S for settings');
            }
            // Alt+S - Open settings
            if (event.altKey && event.key === 's') {
                event.preventDefault();
                setActivePage('Settings');
                announce('Opened accessibility settings');
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSidebarOpen, announce]);

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <SkipLink />
            <LiveRegion />
            {/* Main Layout Container */}
            <div className="flex h-screen">
                {/* Sidebar */}
                <aside role={ARIA_ROLES.NAVIGATION} aria-label="Main navigation">
                    <Sidebar
                        activePage={activePage}
                        onPageChange={handlePageChange}
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                    {/* Header */}
                    <header role={ARIA_ROLES.BANNER} className="bg-gray-900/95 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-700 shrink-0">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-center py-3">
                                 <div className="flex items-center">
                                    <button
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="md:hidden mr-3 p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                        aria-label="Open navigation menu"
                                        aria-expanded={isSidebarOpen}
                                        aria-controls="sidebar-nav"
                                    >
                                        <MenuIcon />
                                    </button>
                                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                                        <span className="sr-only">KaiDjuric AI Tools - </span>
                                        KaiDjuric AI Tools
                                    </h1>
                                </div>
                                <div className="flex items-center space-x-2" role="toolbar" aria-label="User tools and settings">
                                   <div
                                        className={`text-sm px-3 py-1.5 rounded-full ${credits < 1 && subscriptionPlan === 'free' ? 'text-red-400 bg-red-500/10' : 'text-gray-400'}`}
                                        role="status"
                                        aria-label={`${subscriptionPlan === 'free' ? credits : 'Unlimited'} credits available`}
                                    >
                                        <span aria-hidden="true">Credits: {subscriptionPlan === 'free' ? credits : '∞'}</span>
                                    </div>
                                   <button
                                        onClick={() => setIsRagModalOpen(true)}
                                        className={`relative hidden sm:flex items-center text-sm font-semibold py-1.5 px-3 rounded-full transition-all border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${activeRagSources.length > 0 ? 'bg-green-500/20 border-green-500 text-green-300 shadow-lg shadow-green-500/10' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}`}
                                        aria-label={`Add context sources. Currently ${activeRagSources.length} sources active`}
                                        aria-describedby="context-tooltip"
                                    >
                                       <ContextIcon />
                                       Add Context
                                       {activeRagSources.length > 0 && (
                                           <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">{activeRagSources.length}</span>
                                       )}
                                   </button>
                                   <button
                                        onClick={() => setIsContextModalOpen(true)}
                                        className={`hidden sm:flex items-center text-sm font-semibold py-1.5 px-3 rounded-full transition-all border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${aiContext ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/10' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}`}
                                        aria-label={`Set AI persona. ${aiContext ? 'Persona active' : 'No persona set'}`}
                                        aria-describedby="persona-tooltip"
                                    >
                                       <PersonaIcon />
                                       Set Persona
                                   </button>
                                   <button
                                        onClick={() => handlePageChange('Media Library')}
                                        className="hidden sm:flex items-center text-sm font-semibold py-1.5 px-3 rounded-full transition-all border bg-blue-600/20 border-blue-500 text-blue-200 hover:bg-blue-500/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                        aria-label="Open Media Library"
                                    >
                                        Media Library
                                   </button>
                                   <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
                                   <Auth user={user} onAuthSuccess={handleAuthSuccess} onSignOut={handleSignOut} />
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main
                        role={ARIA_ROLES.MAIN}
                        id="main-content"
                        className="flex-1 overflow-y-auto"
                        aria-label={`${activePage} content`}
                        tabIndex={-1}
                    >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            <h2 className="sr-only">Current page: {activePage}</h2>
                            {renderContent()}
                        </div>
                    </main>
                </div>
            </div>

            {/* Selected Hashtag Tray - Fixed Position */}
            <aside
                role={ARIA_ROLES.COMPLEMENTARY}
                aria-label="Selected hashtags"
                className="fixed bottom-0 left-0 right-0 z-20"
            >
                <SelectedTray
                    selectedHashtags={selectedHashtagObjects}
                    onRemove={handleHashtagSelect}
                    onClear={handleClearSelected}
                />
            </aside>

            {/* Modals - High Z-Index with lazy loading */}
            <div role="dialog" aria-hidden={!isContextModalOpen}>
                <ContextModifier
                    isOpen={isContextModalOpen}
                    onClose={() => setIsContextModalOpen(false)}
                    currentContext={aiContext}
                    onSetContext={handleSetAiContext}
                />
            </div>
            {isRagModalOpen && (
                <div role="dialog" aria-hidden={!isRagModalOpen}>
                    <LoadingWrapper loadingType="spinner">
                        <RagSourceManager
                            isOpen={isRagModalOpen}
                            onClose={() => setIsRagModalOpen(false)}
                            sources={ragSources}
                            onSourcesChange={setRagSources}
                        />
                    </LoadingWrapper>
                </div>
            )}
            {isBatchImportModalOpen && (
                <div role="dialog" aria-hidden={!isBatchImportModalOpen}>
                    <LoadingWrapper loadingType="spinner">
                        <BatchMediaImportModal
                            isOpen={isBatchImportModalOpen}
                            onClose={() => setIsBatchImportModalOpen(false)}
                            onImportComplete={handleBatchImportComplete}
                            user={user}
                        />
                    </LoadingWrapper>
                </div>
            )}
            <div role="dialog" aria-hidden={!isUpgradeModalOpen}>
                <UpgradeModal
                    isOpen={isUpgradeModalOpen}
                    onClose={() => setIsUpgradeModalOpen(false)}
                    onUpgrade={() => {
                        setActivePage('Subscription');
                        setIsUpgradeModalOpen(false);
                    }}
                />
            </div>
            <div role="dialog" aria-hidden={!isOnboardingOpen}>
                <OnboardingModal
                    isOpen={isOnboardingOpen}
                    onClose={handleCloseOnboarding}
                />
            </div>
        </div>
    );
});

AppContent.displayName = 'AppContent';

const App: React.FC = memo(() => {
    return (
        <AccessibilityProvider>
            <AppContent />
        </AccessibilityProvider>
    );
});

App.displayName = 'App';

export default App;