import { lazy } from 'react';

// Performance optimization: Lazy load heavy components
// This helps reduce initial bundle size and improves First Contentful Paint

// Core components - kept eager for initial page load
// (Already imported directly in App.tsx)

// Creation suite components - lazy loaded
export const AIStoryGenerator = lazy(() => import('../../components/AIStoryGenerator'));
export const SunoLyricsGenerator = lazy(() => import('../../components/SunoLyricsGenerator'));
export const WebsiteStrategyGenerator = lazy(() => import('../../components/WebsiteStrategyGenerator'));
export const AISkillGenerator = lazy(() => import('../../components/AISkillGenerator'));
export const TensorMutator = lazy(() => import('../../components/TensorMutator'));
export const AIConceptGenerator = lazy(() => import('../../components/AIConceptGenerator'));

// Image studio components - lazy loaded
export const TextToImageGenerator = lazy(() => import('../../components/TextToImageGenerator'));
export const ImageEditor = lazy(() => import('../../components/ImageEditor'));
export const BatchImageGenerator = lazy(() => import('../../components/BatchImageGenerator'));
export const BatchPromptGenerator = lazy(() => import('../../components/BatchPromptGenerator'));

// Advanced tools - lazy loaded (heavy dependencies)
export const ThinkingMode = lazy(() => import('../../components/ThinkingMode'));
export const AudioTranscriber = lazy(() => import('../../components/AudioTranscriber'));
export const AudioAgentIntegrationExample = lazy(() => import('../../components/audio/AudioAgentIntegrationExample'));
export const SynapticSymphony = lazy(() => import('../../projects/synaptic-symphony/SynapticSymphony'));

// Gallery and media components - lazy loaded
export const GalleryComponent = lazy(() => import('../../components/Gallery'));
export const MediaLibrary = lazy(() => import('../../components/MediaLibrary'));
export const EnhancedGallery = lazy(() => import('../../components/EnhancedGallery'));

// Website and navigation components - lazy loaded
export const AIWebsiteGenerator = lazy(() => import('../../components/AIWebsiteGenerator'));
export const SentryNavigationCloud = lazy(() => import('../../components/SentryNavigationCloud'));
export const WebsiteManager = lazy(() => import('../../components/WebsiteManager'));

// Account and settings components - lazy loaded
export const ProductRoadmap = lazy(() => import('../../components/ProductRoadmap'));
export const Settings = lazy(() => import('../../components/Settings'));
export const Subscription = lazy(() => import('../../components/Subscription'));
export const GamificationDashboard = lazy(() => import('../../components/GamificationDashboard'));
export const PersonaTemplatesPage = lazy(() => import('../../components/PersonaTemplatesPage'));

// Developer tools - lazy loaded
export const GoogleDeveloperConsole = lazy(() => import('../../components/GoogleDeveloperConsole'));
export const MarkdownFileReader = lazy(() => import('../../components/MarkdownFileReader'));
export const SupabasePanel = lazy(() => import('../../components/SupabasePanel'));

// Modal components - lazy loaded (only when needed)
export const RagSourceManager = lazy(() => import('../../components/RagSourceManager'));
export const BatchMediaImportModal = lazy(() => import('../../components/BatchMediaImportModal'));

// Component priority groups for loading strategy
export const COMPONENT_GROUPS = {
  // Load immediately on app start
  CRITICAL: ['Hashtag Manager', 'Sidebar'],

  // Load when content creation sections are accessed
  CONTENT_CREATION: ['AI Story', 'AI Lyrics', 'AI Strategy', 'AI Skill', 'AI Mutator', 'AI Concept'],

  // Load when image tools are accessed
  IMAGE_STUDIO: ['Text-to-Image', 'Image Edit', 'Batch Images', 'Batch Prompts'],

  // Load when advanced features are needed
  ADVANCED_TOOLS: ['Thinking Mode', 'Audio Transcriber', 'Audio Agents', 'Synaptic Symphony'],

  // Load when gallery/media sections are accessed
  GALLERY: ['Media Library', 'Gallery', 'Website Manager', 'Sentry Navigation Cloud'],

  // Load when settings/account sections are accessed
  ACCOUNT: ['Settings', 'Subscription', 'Roadmap', 'Gamification'],

  // Load when developer tools are accessed
  DEVELOPER: ['Google Developer Console', 'Markdown File Reader', 'Supabase Panel'],

  // Load only when explicitly opened
  MODALS: ['RagSourceManager', 'BatchMediaImportModal']
} as const;

// Preload functions for better UX
export const preloadContentCreation = () => {
  import('../../components/AIStoryGenerator');
  import('../../components/SunoLyricsGenerator');
  import('../../components/WebsiteStrategyGenerator');
  import('../../components/AISkillGenerator');
  import('../../components/TensorMutator');
  import('../../components/AIConceptGenerator');
};

export const preloadImageStudio = () => {
  import('../../components/TextToImageGenerator');
  import('../../components/ImageEditor');
  import('../../components/BatchImageGenerator');
  import('../../components/BatchPromptGenerator');
};

export const preloadAdvancedTools = () => {
  import('../../components/ThinkingMode');
  import('../../components/AudioTranscriber');
  import('../../components/audio/AudioAgentIntegrationExample');
  import('../../projects/synaptic-symphony/SynapticSymphony');
};

export const preloadGallery = () => {
  import('../../components/Gallery');
  import('../../components/MediaLibrary');
  import('../../components/EnhancedGallery');
};

export const preloadAccount = () => {
  import('../../components/ProductRoadmap');
  import('../../components/Settings');
  import('../../components/Subscription');
  import('../../components/GamificationDashboard');
  import('../../components/PersonaTemplatesPage');
};

export const preloadDeveloper = () => {
  import('../../components/GoogleDeveloperConsole');
  import('../../components/MarkdownFileReader');
  import('../../components/SupabasePanel');
};