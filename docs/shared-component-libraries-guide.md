# Shared Component Libraries Guide

This guide provides comprehensive documentation for using the shared component libraries in your applications.

## Overview

The shared component libraries have been organized into 5 main categories:

1. **Video Processing Library** - Video generation, editing, and optimization
2. **Audio Processing Library** - Audio recording, transcription, and effects
3. **Image Processing Library** - Image generation, editing, and optimization
4. **AI/ML Utilities Library** - AI content generation and prompt templates
5. **Platform Optimization Library** - Social media platform optimization

## Installation and Usage

### 1. Video Processing Library

#### Import the library:
```typescript
import { videoProcessing, VideoUtils } from '../src/shared/video/VideoProcessingLibrary';
import { VideoComponents } from '../src/shared/video/VideoComponents';
```

#### Key Features:
- **Text-to-Video Generation**: Create videos from text prompts
- **Platform Optimization**: Optimize videos for TikTok, YouTube, Instagram, etc.
- **Batch Processing**: Generate multiple video variations
- **Effects and Editing**: Apply filters, transitions, and effects

#### Basic Usage:
```typescript
// Generate a video from text
const videoResult = await videoProcessing.generateFromText("Create a sunset timelapse", {
  duration: 30,
  aspectRatio: "16:9",
  quality: "high",
  platform: "youtube"
});

// Quick video generation utility
const quickVideo = await VideoUtils.quickGenerate("Product showcase", "1920x1080");

// Platform-specific optimization
const optimizedVideo = await VideoUtils.optimizeForPlatform(videoUrl, "tiktok");
```

#### React Components:
```tsx
import { VideoGenerator, VideoEditor, PlatformOptimizer } from '../src/shared/video/VideoComponents';

<VideoGenerator
  onVideoGenerated={(video) => console.log('Generated:', video)}
  defaultOptions={{ quality: 'high', platform: 'youtube' }}
/>

<VideoEditor
  sourceVideo={videoUrl}
  onVideoEdited={(editedVideo) => console.log('Edited:', editedVideo)}
  availableEffects={['fade', 'zoom', 'blur']}
/>
```

### 2. Audio Processing Library

#### Import the library:
```typescript
import { audioProcessing, AudioUtils } from '../src/shared/audio/AudioProcessingLibrary';
import { AudioComponents } from '../src/shared/audio/AudioComponents';
```

#### Key Features:
- **Audio Recording**: Record from microphone with real-time level monitoring
- **Speech Transcription**: Convert audio to text with timestamps
- **Neural Melody Generation**: AI-powered music creation
- **Audio Effects**: Apply reverb, delay, compression, etc.
- **Format Conversion**: Convert between MP3, WAV, OGG, AAC

#### Basic Usage:
```typescript
// Start recording audio
const recording = await audioProcessing.startRecording({
  duration: 60,
  quality: 'high',
  format: 'mp3'
});

// Stop recording and get result
const audioResult = await recording.stop();
console.log('Recorded audio:', audioResult.audioUrl);

// Transcribe audio to text
const transcription = await audioProcessing.transcribeAudio(audioUrl);
console.log('Transcription:', transcription.text);

// Generate AI melody
const melody = await audioProcessing.generateNeuralMelody({
  temperature: 0.8,
  totalSteps: 120,
  minNote: 60,
  maxNote: 84
});

// Apply audio effects
const processedAudio = await audioProcessing.applyEffects(audioUrl, [
  { type: 'reverb', intensity: 0.5, parameters: { roomSize: 0.7 } },
  { type: 'compressor', intensity: 0.3, parameters: { threshold: -20 } }
]);
```

#### React Components:
```tsx
import {
  AudioRecorder,
  AudioPlayer,
  Waveform,
  AudioEffectsPanel,
  TranscriptionDisplay
} from '../src/shared/audio/AudioComponents';

<AudioRecorder
  onRecordingComplete={(audio) => console.log('Recorded:', audio)}
  maxDuration={300}
  showWaveform={true}
/>

<Waveform
  audioUrl={audioUrl}
  height={100}
  showPlayhead={true}
  onTimeUpdate={(time) => console.log('Current time:', time)}
/>

<AudioEffectsPanel
  audioUrl={audioUrl}
  onEffectsApplied={(processedAudio) => console.log('Processed:', processedAudio)}
  availableEffects={['reverb', 'delay', 'chorus', 'compressor']}
/>
```

### 3. Image Processing Library

#### Import the library:
```typescript
import { imageProcessing, ImageUtils } from '../src/shared/image/ImageProcessingLibrary';
```

#### Key Features:
- **Text-to-Image Generation**: Create images from text prompts
- **Batch Image Generation**: Generate multiple variations simultaneously
- **Image Editing**: Crop, resize, rotate, apply filters
- **Background Removal**: AI-powered background removal
- **Platform Optimization**: Optimize for social media platforms
- **Format Conversion**: Convert between JPG, PNG, WebP, GIF

#### Basic Usage:
```typescript
// Generate image from text
const imageResult = await imageProcessing.generateFromText("Cyberpunk cityscape at night", {
  width: 1024,
  height: 1024,
  quality: 'high',
  style: 'photorealistic'
});

// Generate multiple images
const batchImages = await imageProcessing.generateBatchImages("Nature landscape", {
  count: 4,
  variations: true,
  width: 512,
  height: 512
});

// Edit existing image
const editedImage = await imageProcessing.editImage(imageUrl, [
  { type: 'resize', parameters: { width: 800, height: 600 } },
  { type: 'filter', parameters: { filterName: 'vintage' } },
  { type: 'enhance', parameters: { denoise: true, sharpen: true } }
]);

// Remove background
const transparentImage = await imageProcessing.removeBackground(imageUrl);

// Optimize for platform
const optimizedImage = await imageProcessing.optimizeForPlatform(imageUrl, 'instagram');
```

#### Utility Functions:
```typescript
// Quick image generation
const quickImage = await ImageUtils.quickGenerate("Product photo", "1024x1024");

// Social media ready image
const socialImage = await ImageUtils.generateForSocial("Brand announcement", "twitter");

// Create thumbnail
const thumbnail = await ImageUtils.createThumbnail(imageUrl, 256);

// Enhance quality
const enhancedImage = await ImageUtils.enhanceQuality(imageUrl);

// Instagram story format
const storyImage = await ImageUtils.createInstagramStory("Behind the scenes content");
```

### 4. AI/ML Utilities Library

#### Import the library:
```typescript
import { aiUtilities, AIPromptTemplates } from '../src/shared/ai/AIUtilitiesLibrary';
```

#### Key Features:
- **Content Generation**: Generate stories, articles, social media posts
- **Prompt Templates**: Pre-built templates for different content types
- **Viral Content Optimization**: Analyze and optimize for virality
- **Multi-platform Adaptation**: Adapt content for different platforms
- **A/B Testing**: Generate content variations for testing

#### Basic Usage:
```typescript
// Generate content using prompt templates
const storyContent = await aiUtilities.generateContent(
  "A tale of adventure in space",
  'story',
  { length: 'medium', tone: 'exciting' }
);

// Optimize content for virality
const optimizedContent = await aiUtilities.optimizeForVirality(
  "Original social media post text",
  'twitter'
);
console.log('Viral score:', optimizedContent.viralScore);

// Generate hashtags
const hashtags = await aiUtilities.generateHashtags(
  "Tech startup launch announcement",
  { platform: 'instagram', count: 10, includeNiche: true }
);

// A/B test content variations
const variations = await aiUtilities.generateContentVariations(
  "Original post text",
  { count: 3, variationType: 'tone', platform: 'linkedin' }
);
```

#### Prompt Templates:
```typescript
// Use pre-built prompt templates
const templates = AIPromptTemplates.getTemplatesByCategory('social_media');

// Instagram post template
const instagramPrompt = AIPromptTemplates.formatTemplate('instagram_post', {
  topic: "Product launch",
  tone: "excited",
  includeHashtags: true
});

// Blog post template
const blogPrompt = AIPromptTemplates.formatTemplate('blog_post', {
  topic: "AI technology trends",
  length: "medium",
  target_audience: "tech professionals"
});

// Video script template
const videoScript = AIPromptTemplates.formatTemplate('video_script', {
  duration: "60 seconds",
  platform: "tiktok",
  hook: "Attention-grabbing opening"
});
```

### 5. Platform Optimization Library

#### Import the library:
```typescript
import { platformOptimization } from '../src/shared/platform/PlatformOptimizationLibrary';
```

#### Key Features:
- **Multi-platform Optimization**: Optimize content for all major platforms
- **Viral Content Analysis**: Analyze trending content patterns
- **Hashtag Optimization**: Generate platform-specific hashtags
- **Posting Schedule Optimization**: Find optimal posting times
- **Content Performance Prediction**: Predict content performance

#### Basic Usage:
```typescript
// Optimize content for specific platform
const tiktokOptimized = await platformOptimization.optimizeForPlatform('tiktok', {
  content: "Original video concept",
  type: 'video'
});

// Optimize for multiple platforms simultaneously
const multiPlatform = await platformOptimization.optimizeForMultiplePlatforms(
  ['tiktok', 'instagram', 'youtube'],
  { content: "Video content", type: 'video' }
);

// Analyze viral potential
const viralAnalysis = await platformOptimization.analyzeViralPotential(content, {
  platform: 'twitter',
  includeRecommendations: true
});

// Generate platform-specific hashtags
const hashtags = await platformOptimization.generateHashtags("AI technology", {
  platform: 'linkedin',
  count: 15,
  includeNiche: true
});

// Get optimal posting schedule
const schedule = await platformOptimization.getOptimalPostingSchedule('instagram', {
  timezone: 'EST',
  contentType: 'image'
});
```

## Best Practices

### 1. Error Handling
Always wrap library calls in try-catch blocks:

```typescript
try {
  const result = await imageProcessing.generateFromText(prompt);
  console.log('Generated:', result);
} catch (error) {
  console.error('Generation failed:', error);
  // Handle error appropriately
}
```

### 2. Performance Optimization
- Use batch operations when processing multiple items
- Implement loading states in React components
- Cache frequently used results
- Use appropriate quality settings based on use case

### 3. Memory Management
- Clean up audio/video contexts when components unmount
- Use AbortController for cancellable operations
- Dispose of large binary data appropriately

### 4. Platform-Specific Considerations
- Always check platform requirements before optimization
- Test content across different platforms
- Use platform-specific aspect ratios and formats
- Follow platform community guidelines

## Integration Examples

### Complete Content Creation Workflow
```typescript
// 1. Generate initial content idea
const contentIdea = await aiUtilities.generateContent(
  "Tech product launch",
  'social_media_post'
);

// 2. Create visual content
const productImage = await imageProcessing.generateFromText(
  `${contentIdea.content} visual representation`,
  { quality: 'high', style: 'modern' }
);

// 3. Optimize for multiple platforms
const optimizedContent = await platformOptimization.optimizeForMultiplePlatforms(
  ['instagram', 'twitter', 'linkedin'],
  { content: contentIdea.content, image: productImage.imageUrl }
);

// 4. Generate accompanying audio if needed
const backgroundMusic = await audioProcessing.generateNeuralMelody({
  temperature: 0.7,
  totalSteps: 240
});

console.log('Complete content package ready:', {
  content: optimizedContent,
  visuals: productImage,
  audio: backgroundMusic
});
```

### Real-time Audio Processing Pipeline
```typescript
// Start recording
const recording = await audioProcessing.startRecording();

// Monitor audio levels in real-time
const levelMonitor = setInterval(() => {
  const level = recording.getLevel();
  updateVolumeIndicator(level);
}, 100);

// Stop recording after 30 seconds
setTimeout(async () => {
  clearInterval(levelMonitor);
  const audioResult = await recording.stop();

  // Process the audio
  const [transcription, compressedAudio] = await Promise.all([
    audioProcessing.transcribeAudio(audioResult.audioUrl),
    audioProcessing.compressAudio(audioResult.audioUrl, {
      format: 'ogg',
      quality: 'medium'
    })
  ]);

  console.log('Audio processed:', {
    original: audioResult,
    transcription: transcription,
    compressed: compressedAudio
  });
}, 30000);
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure correct relative paths in imports
2. **Type Errors**: Import types from the main types file
3. **Performance Issues**: Use appropriate quality settings and batch operations
4. **Platform Restrictions**: Check platform-specific limitations and requirements

### Debug Mode
Enable debug mode for detailed logging:

```typescript
// Enable debug mode for detailed logging
aiUtilities.setDebugMode(true);
imageProcessing.setDebugMode(true);
```

This comprehensive guide should help you effectively use all shared component libraries across your applications. Each library is designed to work independently but can be combined for powerful content creation workflows.