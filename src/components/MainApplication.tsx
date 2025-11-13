import React, { useState, Suspense } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { HashtagManager } from './HashtagManager';
import { AppGallery } from './AppGallery';
import type { Page } from '../types';
import {
  AIStoryGenerator,
  SunoLyricsGenerator,
  WebsiteStrategyGenerator,
  AISkillGenerator,
  TensorMutator,
  AIConceptGenerator,
  TextToImageGenerator,
  ImageEditor,
  BatchImageGenerator,
  BatchPromptGenerator,
  ThinkingMode,
  AudioTranscriber,
  AudioAgentIntegrationExample,
  SynapticSymphony,
  GalleryComponent,
  MediaLibrary,
  AIWebsiteGenerator,
  SentryNavigationCloud,
  ProductRoadmap,
  Settings,
  Subscription,
  GamificationDashboard,
  GoogleDeveloperConsole,
  MarkdownFileReader,
  SupabasePanel
} from './LazyComponents';

// Loading component for suspense
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    <span className="ml-3 text-slate-300">Loading...</span>
  </div>
);

interface MainApplicationProps {
  initialPage?: Page;
}

export function MainApplication({ initialPage = 'Hashtag Manager' }: MainApplicationProps) {
  const [currentPage, setCurrentPage] = useState<Page>(initialPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    const commonProps = {
      onBack: () => setCurrentPage('Hashtag Manager'),
      onNavigate: (page: Page) => setCurrentPage(page)
    };

    switch (currentPage) {
      // Core Tools
      case 'Hashtag Manager':
        return <HashtagManager />;
      case 'App Gallery':
        return <AppGallery />;

      // AI Content Creation
      case 'AI Story':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AIStoryGenerator {...commonProps} />
          </Suspense>
        );
      case 'AI Lyrics':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SunoLyricsGenerator {...commonProps} />
          </Suspense>
        );
      case 'AI Strategy':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <WebsiteStrategyGenerator {...commonProps} />
          </Suspense>
        );
      case 'AI Skill':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AISkillGenerator {...commonProps} />
          </Suspense>
        );
      case 'AI Mutator':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <TensorMutator {...commonProps} />
          </Suspense>
        );
      case 'AI Concept':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AIConceptGenerator {...commonProps} />
          </Suspense>
        );

      // Image & Media Studio
      case 'Text-to-Image':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <TextToImageGenerator {...commonProps} />
          </Suspense>
        );
      case 'Image Edit':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ImageEditor {...commonProps} />
          </Suspense>
        );
      case 'Batch Images':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <BatchImageGenerator {...commonProps} />
          </Suspense>
        );
      case 'Batch Prompts':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <BatchPromptGenerator {...commonProps} />
          </Suspense>
        );
      case 'Media Library':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <MediaLibrary {...commonProps} />
          </Suspense>
        );

      // Audio & Video
      case 'Audio Transcriber':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AudioTranscriber {...commonProps} />
          </Suspense>
        );
      case 'Audio Agents':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AudioAgentIntegrationExample {...commonProps} />
          </Suspense>
        );
      case 'Synaptic Symphony':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SynapticSymphony {...commonProps} />
          </Suspense>
        );

      // Advanced Tools
      case 'Thinking Mode':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ThinkingMode {...commonProps} />
          </Suspense>
        );
      case 'AI Website':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AIWebsiteGenerator {...commonProps} />
          </Suspense>
        );
      case 'Sentry Navigation Cloud':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SentryNavigationCloud {...commonProps} />
          </Suspense>
        );

      // Gallery
      case 'Gallery':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <GalleryComponent {...commonProps} />
          </Suspense>
        );

      // Developer Tools
      case 'Google Developer Console':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <GoogleDeveloperConsole {...commonProps} />
          </Suspense>
        );
      case 'Markdown File Reader':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <MarkdownFileReader {...commonProps} />
          </Suspense>
        );
      case 'Supabase Panel':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SupabasePanel />
          </Suspense>
        );

      // Account & Settings
      case 'Settings':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Settings {...commonProps} />
          </Suspense>
        );
      case 'Subscription':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Subscription {...commonProps} />
          </Suspense>
        );
      case 'Roadmap':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ProductRoadmap {...commonProps} />
          </Suspense>
        );
      case 'Gamification':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <GamificationDashboard {...commonProps} />
          </Suspense>
        );

      // Placeholder pages for missing implementations
      case 'Onboarding':
      case 'History':
      case 'Documentation':
      case 'React Projects Gallery':
      case 'Tools Demo':
        return (
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">{currentPage}</h2>
            <p className="text-slate-400">This page is coming soon!</p>
            <button
              onClick={() => setCurrentPage('Hashtag Manager')}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Back to Hashtag Manager
            </button>
          </div>
        );

      default:
        return (
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>
            <p className="text-slate-400">The page "{currentPage}" could not be found.</p>
            <button
              onClick={() => setCurrentPage('Hashtag Manager')}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Back to Hashtag Manager
            </button>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex bg-slate-950 text-slate-50 overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <Sidebar
        activePage={currentPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSidebarOpen(false); // Close sidebar on mobile after navigation
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default MainApplication;