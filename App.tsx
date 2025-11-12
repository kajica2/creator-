import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { hashtagCategories, readySets } from './data/hashtags';
import { Hashtag, HashtagSize, PromptHistoryItem, PromptType, RagSource, User, SubscriptionPlan, Page, GeneratedContentStore, UserProgress } from './types';
import SystemErrorBoundary from './src/components/system/SystemErrorBoundary';
import OfflineModeManager from './src/components/system/OfflineModeManager';
import { ProgressStatusDisplay } from './src/components/system/ProgressStatusDisplay';
import { SelectedTray } from './components/SelectedTray';
import { AIStoryGenerator } from './components/AIStoryGenerator';
import { SunoLyricsGenerator } from './components/SunoLyricsGenerator';
import { WebsiteStrategyGenerator } from './components/WebsiteStrategyGenerator';
import { AISkillGenerator } from './components/AISkillGenerator';
import { TensorMutator } from './components/TensorMutator';
import { AIConceptGenerator } from './components/AIConceptGenerator';
import { PromptHistory } from './components/PromptHistory';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { TextToImageGenerator } from './components/TextToImageGenerator';
import { ImageEditor } from './components/ImageEditor';
import { ContextModifier } from './components/ContextModifier';
import { AIWebsiteGenerator } from './components/AIWebsiteGenerator';
import { RagSourceManager } from './components/RagSourceManager';
import { BatchMediaImportModal } from './components/BatchMediaImportModal';
import { GalleryComponent } from './components/Gallery';
import { ProductRoadmap } from './components/ProductRoadmap';
import { Auth } from './components/Auth';
import { Settings } from './components/Settings';
import { Subscription } from './components/Subscription';
import { UpgradeModal } from './components/UpgradeModal';
import { BatchImageGenerator } from './components/BatchImageGenerator';
import { BatchPromptGenerator } from './components/BatchPromptGenerator';
import { Sidebar } from './components/Sidebar';
import { HashtagManager } from './components/HashtagManager';
import { OnboardingScreen } from './components/OnboardingScreen';
import { GamificationDashboard } from './components/GamificationDashboard';
import { ThinkingMode } from './components/ThinkingMode';
import { AudioTranscriber } from './components/AudioTranscriber';
import AudioAgentIntegrationExample from './components/audio/AudioAgentIntegrationExample';
import { SentryNavigationCloud } from './components/SentryNavigationCloud';
import SynapticSymphony from './projects/synaptic-symphony/SynapticSymphony';
import { MediaLibrary } from './components/MediaLibrary';
import { ObsidianSync } from './components/ObsidianSync';
import { AppGallery } from './src/components/AppGallery';
import { GoogleDeveloperConsole } from './src/components/GoogleDeveloperConsole';
import { MarkdownFileReader } from './src/components/MarkdownFileReader';
import { AuthProvider } from './src/components/AuthProvider';
import { LoginButton } from './src/components/LoginButton';

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
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const App: React.FC = () => {
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        try {
            return window.localStorage.getItem('hasSeenOnboarding') === 'true';
        } catch {
            return false;
        }
    });
    const [activePage, setActivePage] = useState<Page>(() => (typeof window !== 'undefined' && window.localStorage.getItem('hasSeenOnboarding') === 'true' ? 'Hashtag Manager' : 'Onboarding'));
    const [selectedHashtags, setSelectedHashtags] = useState<Set<string>>(new Set());
    const [promptHistory, setPromptHistory] = useState<PromptHistoryItem[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isContextModalOpen, setIsContextModalOpen] = useState(false);
    const [isRagModalOpen, setIsRagModalOpen] = useState(false);
    const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const [user, setUser] = useState<User | null>(null);
    const [language, setLanguage] = useState<'English' | 'Spanish'>('English');
    const [aiContext, setAiContext] = useState<string>('');
    const [ragSources, setRagSources] = useState<RagSource[]>([]);
    const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>('free');
    const [credits, setCredits] = useState(5);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContentStore>({});

    const allHashtags = useMemo(() => {
        return hashtagCategories.flatMap(cat => cat.hashtags);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            window.localStorage.setItem('hasSeenOnboarding', hasSeenOnboarding ? 'true' : 'false');
        } catch {
            // noop
        }
    }, [hasSeenOnboarding]);

    const handleHashtagSelect = useCallback((name: string) => {
        setSelectedHashtags(prev => {
            const newSet = new Set(prev);
            if (newSet.has(name)) {
                newSet.delete(name);
            } else {
                newSet.add(name);
            }
            return newSet;
        });
    }, []);

    const handleClearSelected = useCallback(() => {
        setSelectedHashtags(new Set());
    }, []);

    const handleSelectSet = useCallback((hashtags: string[]) => {
        setSelectedHashtags(new Set(hashtags));
        setActivePage('AI Story');
    }, []);

    const handleLaunchDemo = useCallback(() => {
        setHasSeenOnboarding(true);
        setActivePage('Hashtag Manager');
    }, []);

    const handleRequestInvite = useCallback(() => {
        setHasSeenOnboarding(true);
        setActivePage('Subscription');
    }, []);

    const handleSkipOnboarding = useCallback(() => {
        setHasSeenOnboarding(true);
        setActivePage('Hashtag Manager');
    }, []);

    const handleAddPromptToHistory = useCallback((prompt: { type: PromptType; prompt: string }) => {
        const newHistoryItem: PromptHistoryItem = {
            id: Date.now().toString(),
            type: prompt.type,
            prompt: prompt.prompt,
            timestamp: Date.now()
        };
        setPromptHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]);
    }, []);

    const handleClearHistory = useCallback(() => {
        setPromptHistory([]);
    }, []);

    const handleAuthSuccess = useCallback((userData: User) => {
        setUser(userData);
    }, []);

    const handleSignOut = useCallback(() => {
        setUser(null);
    }, []);

    const handleSetAiContext = useCallback((context: string) => {
        setAiContext(context);
    }, []);

    const handleUpgradePlan = useCallback((newPlan: SubscriptionPlan) => {
        setSubscriptionPlan(newPlan);
    }, []);

    const handleAddCredits = useCallback((additionalCredits: number) => {
        setCredits(prev => prev + additionalCredits);
    }, []);

    const handleAttemptGeneration = useCallback(() => {
        if (subscriptionPlan === 'free' && credits <= 0) {
            setIsUpgradeModalOpen(true);
            return false;
        }
        if (subscriptionPlan === 'free') {
            setCredits(prev => prev - 1);
        }
        return true;
    }, [subscriptionPlan, credits]);

    const handleContentGenerated = useCallback((content: any) => {
        const contentId = Date.now().toString();
        setGeneratedContent(prev => ({
            ...prev,
            [contentId]: content
        }));
    }, []);

    const selectedHashtagObjects = useMemo(() => {
        return allHashtags.filter(h => selectedHashtags.has(h.name));
    }, [selectedHashtags, allHashtags]);

    const toolUsage = useMemo(() => {
        return promptHistory.reduce<Record<string, number>>((acc, entry) => {
            const key = entry.type;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }, [promptHistory]);

    const userProgress = useMemo<UserProgress>(() => {
        const xpBase = promptHistory.length * 15 + selectedHashtagObjects.length * 5;
        const xp = Math.max(60, xpBase);
        const level = Math.max(1, Math.floor(xp / 200) + 1);
        const streak =
            promptHistory.length === 0
                ? 1
                : Math.min(30, Math.floor(promptHistory.length / 2) + 1);
        const lastActivity = promptHistory[0]?.timestamp
            ? new Date(promptHistory[0].timestamp).toISOString()
            : new Date().toISOString();

        return {
            xp,
            level,
            achievements: [],
            streak,
            lastActivityDate: lastActivity,
            totalGenerations: promptHistory.length,
            toolUsage,
            completedChallenges: [],
        };
    }, [promptHistory, selectedHashtagObjects, toolUsage]);

    const activeRagSources = useMemo(() => ragSources.filter(s => s.status === 'ready'), [ragSources]);

    const handlePageChange = useCallback((page: Page) => {
        setActivePage(page);
        setIsSidebarOpen(false);
    }, []);

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
            case 'Onboarding':
                return (
                    <OnboardingScreen
                        onLaunchDemo={handleLaunchDemo}
                        onRequestInvite={handleRequestInvite}
                        onSkipTour={!hasSeenOnboarding ? handleSkipOnboarding : undefined}
                    />
                );
            case 'Roadmap':
                return <ProductRoadmap />;
            case 'Settings':
                return <Settings />;
            case 'Subscription':
                return (
                    <Subscription
                        currentPlan={subscriptionPlan}
                        onUpgradePlan={handleUpgradePlan}
                        onAddCredits={handleAddCredits}
                    />
                );
            case 'Gamification':
                return (
                    <GamificationDashboard
                        userProgress={userProgress}
                        onAddCredits={handleAddCredits}
                    />
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
                return <AIStoryGenerator {...commonProps} selectedHashtags={selectedHashtagObjects} />;
            case 'AI Lyrics':
                return <SunoLyricsGenerator {...commonProps} />;
            case 'AI Strategy':
                return <WebsiteStrategyGenerator {...commonProps} />;
            case 'AI Skill':
                return <AISkillGenerator {...commonProps} />;
            case 'AI Mutator':
                return <TensorMutator {...commonProps} />;
            case 'AI Concept':
                return <AIConceptGenerator {...commonProps} />;
            case 'Text-to-Image':
                return <TextToImageGenerator {...commonProps} />;
            case 'Image Edit':
                return (
                    <ImageEditor
                        user={user}
                        onPromptGenerated={handleAddPromptToHistory}
                        aiContext={aiContext}
                        ragSources={activeRagSources}
                        onAttemptGeneration={handleAttemptGeneration}
                        onContentGenerated={handleContentGenerated}
                    />
                );
            case 'Batch Images':
                return <BatchImageGenerator {...commonProps} />;
            case 'Batch Prompts':
                return <BatchPromptGenerator {...commonProps} />;
            case 'AI Website':
                return <AIWebsiteGenerator {...commonProps} generatedContent={generatedContent} />;
            case 'Thinking Mode':
                return <ThinkingMode {...commonProps} />;
            case 'Audio Transcriber':
                return <AudioTranscriber {...commonProps} />;
            case 'Audio Agents':
                return <AudioAgentIntegrationExample userId={user?.id} />;
            case 'Synaptic Symphony':
                return <SynapticSymphony />;
            case 'Sentry Navigation Cloud':
                return (
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
                );
            case 'Gallery':
                return <GalleryComponent />;
            case 'App Gallery':
                return <AppGallery />;
            case 'Google Developer Console':
                return <GoogleDeveloperConsole />;
            case 'Markdown File Reader':
                return <MarkdownFileReader />;
            case 'Media Library':
                return <MediaLibrary user={user} onOpenBatchImport={() => setIsBatchImportModalOpen(true)} />;
            case 'Documentation':
                return <ObsidianSync />;
            case 'History':
                return <PromptHistory history={promptHistory} onClear={handleClearHistory} />;
            default:
                return null;
        }
    }, [activePage, user, handleAddPromptToHistory, language, aiContext, activeRagSources, handleAttemptGeneration, handleContentGenerated, subscriptionPlan, handleUpgradePlan, handleAddCredits, hashtagCategories, readySets, selectedHashtags, handleHashtagSelect, handleSelectSet, selectedHashtagObjects, generatedContent, promptHistory, handleClearHistory, handleLaunchDemo, handleRequestInvite, handleSkipOnboarding, hasSeenOnboarding, userProgress, setIsBatchImportModalOpen]);

    return (
        <AuthProvider>
            <SystemErrorBoundary>
                <OfflineModeManager>
                    <div className="bg-gray-900 text-white min-h-screen font-sans">
            {/* Main Layout Container */}
            <div className="flex h-screen">
                {/* Sidebar */}
                <Sidebar
                    activePage={activePage}
                    onPageChange={handlePageChange}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                    {/* Header */}
                    <header className="bg-gray-900/95 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-700 shrink-0">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-center py-3">
                                 <div className="flex items-center">
                                    <button
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="md:hidden mr-3 p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <MenuIcon />
                                    </button>
                                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                                        KaiDjuric AI Tools
                                    </h1>
                                </div>
                                <div className="flex items-center space-x-2">
                                   <div className={`text-sm px-3 py-1.5 rounded-full ${credits < 1 && subscriptionPlan === 'free' ? 'text-red-400 bg-red-500/10' : 'text-gray-400'}`}>
                                        Credits: {subscriptionPlan === 'free' ? credits : '∞'}
                                    </div>
                                   <button
                                        onClick={() => setIsRagModalOpen(true)}
                                        className={`relative hidden sm:flex items-center text-sm font-semibold py-1.5 px-3 rounded-full transition-all border ${activeRagSources.length > 0 ? 'bg-green-500/20 border-green-500 text-green-300 shadow-lg shadow-green-500/10' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}`}
                                    >
                                       <ContextIcon />
                                       Add Context
                                       {activeRagSources.length > 0 && (
                                           <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">{activeRagSources.length}</span>
                                       )}
                                   </button>
                                   <button
                                        onClick={() => setIsContextModalOpen(true)}
                                        className={`hidden sm:flex items-center text-sm font-semibold py-1.5 px-3 rounded-full transition-all border ${aiContext ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/10' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}`}
                                    >
                                       <PersonaIcon />
                                       Set Persona
                                   </button>
                                   <button
                                        onClick={() => handlePageChange('Onboarding')}
                                        className="hidden sm:flex items-center text-sm font-semibold py-1.5 px-3 rounded-full transition-all border bg-purple-600/20 border-purple-500 text-purple-200 hover:bg-purple-500/30 hover:text-white"
                                    >
                                        Product Tour
                                   </button>
                                   <button
                                        onClick={() => handlePageChange('Media Library')}
                                        className="hidden sm:flex items-center text-sm font-semibold py-1.5 px-3 rounded-full transition-all border bg-blue-600/20 border-blue-500 text-blue-200 hover:bg-blue-500/30 hover:text-white"
                                    >
                                        Media Library
                                   </button>
                                   <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
                                   <LoginButton />
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            {renderContent()}
                        </div>
                    </main>
                </div>
            </div>

            {/* Selected Hashtag Tray */}
            <SelectedTray
                selectedHashtags={selectedHashtagObjects}
                onRemove={handleHashtagSelect}
                onClear={handleClearSelected}
            />

            {/* Modals */}
            <ContextModifier
                isOpen={isContextModalOpen}
                onClose={() => setIsContextModalOpen(false)}
                currentContext={aiContext}
                onSetContext={handleSetAiContext}
            />
            {isRagModalOpen && (
                <RagSourceManager
                    isOpen={isRagModalOpen}
                    onClose={() => setIsRagModalOpen(false)}
                    sources={ragSources}
                    onSourcesChange={setRagSources}
                />
            )}
            {isBatchImportModalOpen && (
                <BatchMediaImportModal
                    isOpen={isBatchImportModalOpen}
                    onClose={() => setIsBatchImportModalOpen(false)}
                    onImportComplete={handleBatchImportComplete}
                    user={user}
                />
            )}
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                onUpgrade={() => {
                    setActivePage('Subscription');
                    setIsUpgradeModalOpen(false);
                }}
            />

            {/* Global Progress Display */}
            <div className="fixed bottom-4 right-4 z-40 max-w-sm">
                <ProgressStatusDisplay showAllReports={true} compact={true} />
            </div>
        </div>
                </OfflineModeManager>
            </SystemErrorBoundary>
        </AuthProvider>
    );
};

export default App;