import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { hashtagCategories, readySets } from './data/hashtags';
import { Hashtag, HashtagSize, PromptHistoryItem, PromptType, RagSource, User, SubscriptionPlan, Page, GeneratedContentStore } from './types';
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
import { OnboardingModal } from './components/OnboardingModal';
import { ThinkingMode } from './components/ThinkingMode';
import { AudioTranscriber } from './components/AudioTranscriber';
import AudioAgentIntegrationExample from './components/audio/AudioAgentIntegrationExample';
import { SentryNavigationCloud } from './components/SentryNavigationCloud';
import SynapticSymphony from './projects/synaptic-symphony/SynapticSymphony';
import { MediaLibrary } from './components/MediaLibrary';


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

    const handlePageChange = (page: Page) => {
        setActivePage(page);
        setIsSidebarOpen(false);
    }

    const handleBatchImportComplete = useCallback((importedSources: RagSource[]) => {
        setRagSources(prev => {
            const existingIds = new Set(prev.map(source => source.id));
            const deduped = importedSources.filter(source => !existingIds.has(source.id));
            return [...prev, ...deduped];
        });
    }, []);

    const renderContent = () => {
        switch (activePage) {
            case 'Roadmap':
                return <ProductRoadmap />;
            case 'Settings':
                return <Settings />;
            case 'Subscription':
                return <Subscription currentPlan={subscriptionPlan} onUpgradePlan={handleUpgradePlan} onAddCredits={handleAddCredits} />;
            case 'Hashtag Manager':
                return <HashtagManager 
                    hashtagCategories={hashtagCategories}
                    readySets={readySets}
                    selectedHashtags={selectedHashtags}
                    onHashtagSelect={handleHashtagSelect}
                    onSelectSet={handleSelectSet}
                />;
            case 'AI Story':
                return <AIStoryGenerator user={user} selectedHashtags={selectedHashtagObjects} onPromptGenerated={handleAddPromptToHistory} language={language} aiContext={aiContext} ragSources={activeRagSources} onAttemptGeneration={handleAttemptGeneration} onContentGenerated={handleContentGenerated} />;
            case 'AI Lyrics':
                return <SunoLyricsGenerator user={user} onPromptGenerated={handleAddPromptToHistory} language={language} aiContext={aiContext} ragSources={activeRagSources} onAttemptGeneration={handleAttemptGeneration} onContentGenerated={handleContentGenerated} />;
            case 'AI Strategy':
                return <WebsiteStrategyGenerator user={user} onPromptGenerated={handleAddPromptToHistory} language={language} aiContext={aiContext} ragSources={activeRagSources} onAttemptGeneration={handleAttemptGeneration} onContentGenerated={handleContentGenerated} />;
            case 'AI Skill':
                return <AISkillGenerator user={user} onPromptGenerated={handleAddPromptToHistory} language={language} aiContext={aiContext} ragSources={activeRagSources} onAttemptGeneration={handleAttemptGeneration} onContentGenerated={handleContentGenerated} />;
            case 'AI Mutator':
                 return <TensorMutator user={user} onPromptGenerated={handleAddPromptToHistory} language={language} aiContext={aiContext} ragSources={activeRagSources} onAttemptGeneration={handleAttemptGeneration} onContentGenerated={handleContentGenerated} />;
            case 'AI Concept':
                return <AIConceptGenerator user={user} onPromptGenerated={handleAddPromptToHistory} language={language} aiContext={aiContext} ragSources={activeRagSources} onAttemptGeneration={handleAttemptGeneration} onContentGenerated={handleContentGenerated} />;
            case 'Text-to-Image':
                return <TextToImageGenerator user={user} onPromptGenerated={handleAddPromptToHistory} language={language} aiContext={aiContext} ragSources={activeRagSources} onAttemptGeneration={handleAttemptGeneration} onContentGenerated={handleContentGenerated} />;
            case 'Image Edit':
                return <ImageEditor user={user} onPromptGenerated={handleAddPromptToHistory} aiContext={aiContext} ragSources={activeRagSources} onAttemptGeneration={handleAttemptGeneration} onContentGenerated={handleContentGenerated} />;
             case 'Batch Images':
                return <BatchImageGenerator user={user} onPromptGenerated={handleAddPromptToHistory} language={language} aiContext={aiContext} ragSources={activeRagSources} onAttemptGeneration={handleAttemptGeneration} onContentGenerated={handleContentGenerated} />;
            case 'Batch Prompts':
                return <BatchPromptGenerator user={user} onPromptGenerated={handleAddPromptToHistory} language={language} aiContext={aiContext} ragSources={activeRagSources} onAttemptGeneration={handleAttemptGeneration} onContentGenerated={handleContentGenerated} />;
            case 'AI Website':
                return <AIWebsiteGenerator user={user} onPromptGenerated={handleAddPromptToHistory} language={language} aiContext={aiContext} ragSources={activeRagSources} onAttemptGeneration={handleAttemptGeneration} generatedContent={generatedContent} />;
            case 'Thinking Mode':
                return <ThinkingMode user={user} onPromptGenerated={handleAddPromptToHistory} language={language} aiContext={aiContext} ragSources={activeRagSources} onAttemptGeneration={handleAttemptGeneration} onContentGenerated={handleContentGenerated} />;
            case 'Audio Transcriber':
                return <AudioTranscriber user={user} onPromptGenerated={handleAddPromptToHistory} language={language} aiContext={aiContext} ragSources={activeRagSources} onAttemptGeneration={handleAttemptGeneration} onContentGenerated={handleContentGenerated} />;
            case 'Audio Agents':
                return <AudioAgentIntegrationExample userId={user?.id} />;
            case 'Synaptic Symphony':
                return <SynapticSymphony />;
            case 'Sentry Navigation Cloud':
                return <SentryNavigationCloud
                    width={1200}
                    height={700}
                    showCategories={true}
                    interactive={true}
                    onItemClick={(item) => {
                        console.log('Sentry navigation item clicked:', item);
                        // In a real app, this would navigate to the actual page
                        alert(`Would navigate to: ${item.name}\nURL: ${item.url}\nDescription: ${item.description}`);
                    }}
                />;
            case 'Gallery':
                return <GalleryComponent />;
            case 'Media Library':
                return <MediaLibrary user={user} onOpenBatchImport={() => setIsBatchImportModalOpen(true)} />;
            case 'History':
                return <PromptHistory history={promptHistory} onClear={handleClearHistory} />;
            default:
                return null;
        }
    };

    return (
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
                                        className="md:hidden mr-3 p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition-colors"
                                        aria-label="Open sidebar"
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
                                        className={`relative hidden sm:flex items-center text-sm font-semibold py-1.5 px-3 rounded-full transition-all border ${activeRagSources.length > 0 ? 'bg-green-500/20 border-green-500 text-green-300 shadow-lg shadow-green-500/10' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}`}>
                                       <ContextIcon />
                                       Add Context
                                       {activeRagSources.length > 0 && (
                                           <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">{activeRagSources.length}</span>
                                       )}
                                   </button>
                                   <button
                                        onClick={() => setIsContextModalOpen(true)}
                                        className={`hidden sm:flex items-center text-sm font-semibold py-1.5 px-3 rounded-full transition-all border ${aiContext ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/10' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}`}>
                                       <PersonaIcon />
                                       Set Persona
                                   </button>
                                   <button
                                        onClick={() => handlePageChange('Media Library')}
                                        className="hidden sm:flex items-center text-sm font-semibold py-1.5 px-3 rounded-full transition-all border bg-blue-600/20 border-blue-500 text-blue-200 hover:bg-blue-500/30 hover:text-white"
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
                    <main className="flex-1 overflow-y-auto">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            {renderContent()}
                        </div>
                    </main>
                </div>
            </div>

            {/* Selected Hashtag Tray - Fixed Position */}
            <SelectedTray
                selectedHashtags={selectedHashtagObjects}
                onRemove={handleHashtagSelect}
                onClear={handleClearSelected}
            />

            {/* Modals - High Z-Index */}
            <ContextModifier
                isOpen={isContextModalOpen}
                onClose={() => setIsContextModalOpen(false)}
                currentContext={aiContext}
                onSetContext={handleSetAiContext}
            />
            <RagSourceManager
                isOpen={isRagModalOpen}
                onClose={() => setIsRagModalOpen(false)}
                sources={ragSources}
                onSourcesChange={setRagSources}
            />
            <BatchMediaImportModal
                isOpen={isBatchImportModalOpen}
                onClose={() => setIsBatchImportModalOpen(false)}
                onImportComplete={handleBatchImportComplete}
                user={user}
            />
             <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                onUpgrade={() => {
                    setActivePage('Subscription');
                    setIsUpgradeModalOpen(false);
                }}
            />
            <OnboardingModal
                isOpen={isOnboardingOpen}
                onClose={handleCloseOnboarding}
            />
        </div>
    );
};

export default App;