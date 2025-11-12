/**
 * Shared Video UI Components
 * Reusable React components for video-related applications
 */

import React, { useState, useEffect, useCallback } from 'react';
import { VideoProcessingOptions, VideoProcessingResult, videoProcessing, VideoUtils } from './VideoProcessingLibrary';

// Progress indicator for video processing
export interface VideoProgressProps {
  progress: number;
  stage: string;
  showDetails?: boolean;
}

export const VideoProgress: React.FC<VideoProgressProps> = ({
  progress,
  stage,
  showDetails = false
}) => (
  <div className="w-full max-w-md mx-auto">
    <div className="flex justify-between text-sm text-gray-600 mb-2">
      <span>{stage}</span>
      <span>{Math.round(progress)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
    {showDetails && (
      <div className="text-xs text-gray-500 mt-1">
        Processing your video content...
      </div>
    )}
  </div>
);

// Platform selector component
export interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
  maxSelections?: number;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onPlatformsChange,
  maxSelections = 4
}) => {
  const platforms = [
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'instagram-reels', name: 'Instagram Reels', icon: '📷' },
    { id: 'youtube-shorts', name: 'YouTube Shorts', icon: '▶️' },
    { id: 'twitter', name: 'Twitter', icon: '🐦' },
    { id: 'facebook-reels', name: 'Facebook Reels', icon: '👥' },
    { id: 'snapchat', name: 'Snapchat', icon: '👻' }
  ];

  const handleToggle = (platformId: string) => {
    const isSelected = selectedPlatforms.includes(platformId);
    if (isSelected) {
      onPlatformsChange(selectedPlatforms.filter(p => p !== platformId));
    } else if (selectedPlatforms.length < maxSelections) {
      onPlatformsChange([...selectedPlatforms, platformId]);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {platforms.map(platform => (
        <button
          key={platform.id}
          onClick={() => handleToggle(platform.id)}
          className={`
            p-3 rounded-lg border-2 transition-all duration-200 text-sm
            ${selectedPlatforms.includes(platform.id)
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300'
            }
            ${selectedPlatforms.length >= maxSelections &&
              !selectedPlatforms.includes(platform.id)
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
            }
          `}
          disabled={selectedPlatforms.length >= maxSelections &&
                   !selectedPlatforms.includes(platform.id)}
        >
          <div className="text-lg mb-1">{platform.icon}</div>
          <div className="font-medium">{platform.name}</div>
        </button>
      ))}
    </div>
  );
};

// Video style selector
export interface StyleSelectorProps {
  selectedStyle: string;
  onStyleChange: (style: string) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyle,
  onStyleChange
}) => {
  const styles = [
    { id: 'viral', name: 'Viral', description: 'High engagement, trendy' },
    { id: 'professional', name: 'Professional', description: 'Clean, business-like' },
    { id: 'artistic', name: 'Artistic', description: 'Creative, expressive' },
    { id: 'educational', name: 'Educational', description: 'Clear, informative' }
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {styles.map(style => (
        <button
          key={style.id}
          onClick={() => onStyleChange(style.id)}
          className={`
            p-3 rounded-lg border-2 transition-all duration-200 text-left
            ${selectedStyle === style.id
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
            }
          `}
        >
          <div className="font-medium text-sm">{style.name}</div>
          <div className="text-xs text-gray-500">{style.description}</div>
        </button>
      ))}
    </div>
  );
};

// Video preview component
export interface VideoPreviewProps {
  videoUrl: string;
  thumbnailUrl?: string;
  metadata?: {
    duration: number;
    platforms: string[];
    viralScore: number;
  };
  onOptimize?: () => void;
  onDownload?: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  thumbnailUrl,
  metadata,
  onOptimize,
  onDownload
}) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="aspect-video bg-gray-100 relative">
      {videoUrl ? (
        <video
          src={videoUrl}
          poster={thumbnailUrl}
          controls
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <span>Video preview will appear here</span>
        </div>
      )}
    </div>

    {metadata && (
      <div className="p-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Duration:</span>
            <div className="font-medium">{metadata.duration}s</div>
          </div>
          <div>
            <span className="text-gray-500">Platforms:</span>
            <div className="font-medium">{metadata.platforms.length}</div>
          </div>
          <div>
            <span className="text-gray-500">Viral Score:</span>
            <div className="font-medium">{(metadata.viralScore * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
    )}

    {(onOptimize || onDownload) && (
      <div className="p-4 border-t bg-gray-50 flex gap-2">
        {onOptimize && (
          <button
            onClick={onOptimize}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Optimize
          </button>
        )}
        {onDownload && (
          <button
            onClick={onDownload}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Download
          </button>
        )}
      </div>
    )}
  </div>
);

// Comprehensive video generation form
export interface VideoGeneratorProps {
  onVideoGenerated: (result: VideoProcessingResult) => void;
  defaultOptions?: Partial<VideoProcessingOptions>;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  onVideoGenerated,
  defaultOptions = {}
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok']);
  const [selectedStyle, setSelectedStyle] = useState('viral');
  const [duration, setDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('Ready');

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setProgress(0);
    setCurrentStage('Initializing...');

    try {
      // Simulate progress updates
      const progressStages = [
        { stage: 'Analyzing prompt...', progress: 20 },
        { stage: 'Generating content...', progress: 50 },
        { stage: 'Applying effects...', progress: 70 },
        { stage: 'Optimizing for platforms...', progress: 90 },
        { stage: 'Finalizing...', progress: 100 }
      ];

      for (const { stage, progress: stageProgress } of progressStages) {
        setCurrentStage(stage);
        setProgress(stageProgress);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const options: VideoProcessingOptions = {
        ...defaultOptions,
        platform: selectedPlatforms,
        style: selectedStyle as any,
        duration,
        viralOptimization: true
      };

      const result = await videoProcessing.generateFromText(prompt, options);
      onVideoGenerated(result);
    } catch (error) {
      console.error('Video generation failed:', error);
      setCurrentStage('Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedPlatforms, selectedStyle, duration, defaultOptions, onVideoGenerated]);

  return (
    <div className="space-y-6">
      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Description
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the video you want to create..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Platform Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Platforms
        </label>
        <PlatformSelector
          selectedPlatforms={selectedPlatforms}
          onPlatformsChange={setSelectedPlatforms}
        />
      </div>

      {/* Style Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Style
        </label>
        <StyleSelector
          selectedStyle={selectedStyle}
          onStyleChange={setSelectedStyle}
        />
      </div>

      {/* Duration Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration: {duration} seconds
        </label>
        <input
          type="range"
          min="15"
          max="180"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Progress Display */}
      {isGenerating && (
        <VideoProgress
          progress={progress}
          stage={currentStage}
          showDetails={true}
        />
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        className={`
          w-full py-3 px-4 rounded-md font-medium transition-colors
          ${!prompt.trim() || isGenerating
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {isGenerating ? 'Generating...' : 'Generate Video'}
      </button>
    </div>
  );
};

// Quick action buttons for common video types
export const VideoQuickActions: React.FC<{
  onVideoGenerated: (result: VideoProcessingResult) => void;
}> = ({ onVideoGenerated }) => {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const quickActions = [
    {
      id: 'tiktok',
      title: 'TikTok Viral',
      description: 'Create trending TikTok content',
      icon: '🎵',
      action: async () => {
        const prompt = 'Create an engaging viral video that captures attention in the first 3 seconds';
        return VideoUtils.createTikTokVideo(prompt);
      }
    },
    {
      id: 'instagram',
      title: 'Instagram Reels',
      description: 'Professional Instagram content',
      icon: '📷',
      action: async () => {
        const prompt = 'Create polished, aesthetic content perfect for Instagram';
        return VideoUtils.createInstagramReels(prompt);
      }
    },
    {
      id: 'youtube',
      title: 'YouTube Shorts',
      description: 'Educational YouTube content',
      icon: '▶️',
      action: async () => {
        const prompt = 'Create informative and engaging educational content';
        return VideoUtils.createYouTubeShorts(prompt);
      }
    }
  ];

  const handleQuickAction = async (action: any, id: string) => {
    setIsGenerating(id);
    try {
      const result = await action();
      onVideoGenerated(result);
    } catch (error) {
      console.error('Quick action failed:', error);
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {quickActions.map(action => (
        <button
          key={action.id}
          onClick={() => handleQuickAction(action.action, action.id)}
          disabled={isGenerating !== null}
          className={`
            p-4 rounded-lg border-2 text-left transition-all duration-200
            ${isGenerating === action.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
            }
            ${isGenerating !== null && isGenerating !== action.id
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
            }
          `}
        >
          <div className="text-2xl mb-2">{action.icon}</div>
          <div className="font-medium">{action.title}</div>
          <div className="text-sm text-gray-500">{action.description}</div>
          {isGenerating === action.id && (
            <div className="text-xs text-blue-600 mt-2">Generating...</div>
          )}
        </button>
      ))}
    </div>
  );
};