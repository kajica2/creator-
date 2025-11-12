# Shared Component Libraries

This document provides a quick overview of the shared component libraries and how they improve code organization and reusability across the application ecosystem.

## Architecture Overview

```
src/shared/
├── video/
│   ├── VideoProcessingLibrary.ts    # Video generation, editing, optimization
│   └── VideoComponents.tsx          # React components for video UI
├── audio/
│   ├── AudioProcessingLibrary.ts    # Audio recording, transcription, effects
│   └── AudioComponents.tsx          # React components for audio UI
├── image/
│   └── ImageProcessingLibrary.ts    # Image generation, editing, optimization
├── ai/
│   └── AIUtilitiesLibrary.ts        # AI content generation, prompt templates
└── platform/
    └── PlatformOptimizationLibrary.ts # Social media platform optimization
```

## Quick Start

### Import and Use Video Processing
```typescript
import { videoProcessing, VideoUtils } from '../src/shared/video/VideoProcessingLibrary';

// Generate a video
const video = await VideoUtils.quickGenerate("Product demo", "1920x1080");

// Optimize for TikTok
const tiktokVideo = await VideoUtils.optimizeForPlatform(videoUrl, "tiktok");
```

### Import and Use Audio Processing
```typescript
import { audioProcessing, AudioUtils } from '../src/shared/audio/AudioProcessingLibrary';

// Record audio
const recording = await AudioUtils.recordAudio(30);

// Transcribe audio
const transcription = await AudioUtils.quickTranscribe(audioUrl);
```

### Import and Use Image Processing
```typescript
import { imageProcessing, ImageUtils } from '../src/shared/image/ImageProcessingLibrary';

// Generate image
const image = await ImageUtils.quickGenerate("Sunset landscape", "1024x1024");

// Create social media image
const socialImage = await ImageUtils.generateForSocial("Brand post", "instagram");
```

### Import and Use AI Utilities
```typescript
import { aiUtilities, AIPromptTemplates } from '../src/shared/ai/AIUtilitiesLibrary';

// Generate content
const content = await aiUtilities.generateContent("Tech news", 'article');

// Optimize for virality
const viral = await aiUtilities.optimizeForVirality(content, 'twitter');
```

### Import and Use Platform Optimization
```typescript
import { platformOptimization } from '../src/shared/platform/PlatformOptimizationLibrary';

// Optimize for multiple platforms
const multiPlatform = await platformOptimization.optimizeForMultiplePlatforms(
  ['instagram', 'tiktok', 'youtube'],
  { content: "Video content", type: 'video' }
);
```

## Application Categories

### Content Generation Apps
- **AI Story Generator** → Uses AI Utilities + Platform Optimization
- **AI Lyrics Generator** → Uses AI Utilities + Audio Processing
- **AI Concept Generator** → Uses AI Utilities + Image Processing
- **AI Website Generator** → Uses AI Utilities + Platform Optimization

### Visual Content Apps
- **Text-to-Image Generator** → Uses Image Processing + AI Utilities
- **Image Editor** → Uses Image Processing + Platform Optimization
- **Batch Image Generator** → Uses Image Processing + AI Utilities

### Audio & Media Apps
- **Audio Transcriber** → Uses Audio Processing + AI Utilities
- **Audio Agents** → Uses Audio Processing + AI Utilities
- **Synaptic Symphony** → Uses Audio Processing + AI Utilities

### System & Management Apps
- **Media Library** → Uses All Libraries for file management
- **Gallery** → Uses Image/Video Processing for optimization

## Benefits

### 1. **Code Reusability**
- Shared functions eliminate code duplication
- Consistent APIs across applications
- Centralized maintenance and updates

### 2. **Performance Optimization**
- Singleton pattern for efficient resource management
- Cached operations and optimized algorithms
- Batch processing capabilities

### 3. **Type Safety**
- Comprehensive TypeScript interfaces
- Consistent error handling patterns
- Predictable return types

### 4. **Scalability**
- Easy to add new features to libraries
- Simple to create new applications using existing libraries
- Modular architecture supports growth

### 5. **Maintainability**
- Single source of truth for each domain
- Easier debugging and testing
- Simplified dependency management

## Library Features Summary

| Library | Key Features | React Components | Utility Functions |
|---------|-------------|------------------|------------------|
| **Video** | Generation, Editing, Platform optimization | VideoGenerator, VideoEditor, PlatformSelector | quickGenerate, optimizeForPlatform |
| **Audio** | Recording, Transcription, Effects, Neural melodies | AudioRecorder, AudioPlayer, Waveform, EffectsPanel | recordAudio, quickTranscribe, addReverb |
| **Image** | Generation, Editing, Background removal, Format conversion | - | quickGenerate, generateForSocial, createThumbnail |
| **AI/ML** | Content generation, Prompt templates, Virality optimization | - | generateContent, optimizeForVirality, generateHashtags |
| **Platform** | Multi-platform optimization, Viral analysis, Hashtag generation | - | optimizeForPlatform, analyzeViralPotential |

## Migration Guide

### Before (Duplicated Code)
```typescript
// Each component had its own image generation logic
const generateImage = async (prompt: string) => {
  // Custom implementation in each component
  // Different error handling
  // Inconsistent parameters
};
```

### After (Shared Library)
```typescript
import { ImageUtils } from '../src/shared/image/ImageProcessingLibrary';

// Consistent, optimized, and well-tested implementation
const image = await ImageUtils.quickGenerate(prompt, "1024x1024");
```

## Next Steps

1. **Read the Full Guide**: Check `shared-component-libraries-guide.md` for detailed usage examples
2. **Update Your Components**: Import shared libraries instead of custom implementations
3. **Test Integration**: Ensure existing functionality works with shared libraries
4. **Optimize Performance**: Use batch operations and caching where appropriate

## Support

For issues or questions about the shared libraries:
- Check the comprehensive guide: `docs/shared-component-libraries-guide.md`
- Review existing component implementations for examples
- Test changes in development environment before production use