/**
 * MotionGraphics Agent
 * Creates animated graphics, overlays, and visual effects for viral video content
 */

import {
  MotionGraphicsInput,
  VideoOverlay,
  VideoAgentTask,
  OverlayAnimation,
  TextStyle
} from './types';
import { VIDEO_AGENT_CONFIG, VIRAL_TEMPLATES } from './config';
import { memoryManager } from '../MemoryManager';
import { communicationProtocol } from '../CommunicationProtocol';
import { claudeFlowIntegration } from '../ClaudeFlowIntegration';

export class MotionGraphics {
  private agentId: string;
  private isInitialized: boolean = false;
  private activeJobs: Map<string, VideoAgentTask> = new Map();
  private memoryKey: string = 'motion-graphics';

  constructor(agentId: string = 'motion-graphics-001') {
    this.agentId = agentId;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log(`✨ Initializing MotionGraphics Agent ${this.agentId}...`);

      // Initialize memory store
      await memoryManager.createStore(this.memoryKey, {
        templates: this.getMotionGraphicsTemplates(),
        animations: this.getAnimationLibrary(),
        styles: this.getStyleLibrary(),
        performance: {
          totalCreated: 0,
          averageRenderTime: 0,
          popularTemplates: {},
          viralSuccessRate: 0
        }
      });

      // Register with communication protocol
      await communicationProtocol.registerAgent(this.agentId, 'motion_graphics', {
        capabilities: [
          'animated-text',
          'intro-outro-creation',
          'lower-thirds',
          'call-to-action-overlays',
          'transition-graphics',
          'logo-animations',
          'particle-effects',
          'viral-elements'
        ],
        status: 'ready',
        maxConcurrentTasks: VIDEO_AGENT_CONFIG.general.maxConcurrentTasks
      });

      // Register Claude Flow hooks
      await claudeFlowIntegration.registerHooks(this.agentId, {
        preTask: this.handlePreTask.bind(this),
        postTask: this.handlePostTask.bind(this),
        onError: this.handleError.bind(this)
      });

      this.isInitialized = true;
      console.log(`✅ MotionGraphics Agent ${this.agentId} initialized successfully`);

    } catch (error) {
      console.error(`❌ Failed to initialize MotionGraphics Agent ${this.agentId}:`, error);
      throw error;
    }
  }

  async createMotionGraphics(input: MotionGraphicsInput): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('MotionGraphics agent not initialized');
    }

    const taskId = `motion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`✨ Starting motion graphics creation task ${taskId}`);

    try {
      // Create task
      const task: VideoAgentTask = {
        id: taskId,
        agentType: 'motion_graphics',
        status: 'pending',
        priority: 'medium',
        input,
        progress: 0,
        createdAt: new Date(),
        metadata: {
          requiredResources: ['gpu', 'animation_engine'],
          dependencies: [],
          retryCount: 0,
          maxRetries: VIDEO_AGENT_CONFIG.general.retryAttempts
        }
      };

      this.activeJobs.set(taskId, task);

      // Execute Claude Flow pre-task hooks
      await claudeFlowIntegration.executeHook('preTask', this.agentId, {
        taskId,
        operation: 'create-motion-graphics',
        input
      });

      task.status = 'in_progress';
      task.startedAt = new Date();
      await this.updateProgress(taskId, 10);

      // Select template and style
      const template = await this.selectTemplate(input);
      await this.updateProgress(taskId, 20);

      // Generate visual design
      const design = await this.generateDesign(input, template);
      await this.updateProgress(taskId, 40);

      // Create animations
      const animations = await this.createAnimations(input, design);
      await this.updateProgress(taskId, 70);

      // Render final graphics
      const result = await this.renderMotionGraphics(input, design, animations);
      await this.updateProgress(taskId, 90);

      // Apply viral optimizations
      const optimizedResult = await this.applyViralOptimizations(result, input);
      await this.updateProgress(taskId, 100);

      // Complete task
      task.status = 'completed';
      task.completedAt = new Date();
      task.output = optimizedResult;

      // Execute Claude Flow post-task hooks
      await claudeFlowIntegration.executeHook('postTask', this.agentId, {
        taskId,
        operation: 'create-motion-graphics',
        result: optimizedResult,
        performance: {
          duration: task.completedAt.getTime() - task.startedAt!.getTime(),
          success: true
        }
      });

      console.log(`✅ Motion graphics creation task ${taskId} completed successfully`);
      return optimizedResult.url;

    } catch (error) {
      await this.handleTaskError(taskId, error);
      throw error;
    } finally {
      this.activeJobs.delete(taskId);
    }
  }

  private async selectTemplate(input: MotionGraphicsInput): Promise<any> {
    const templates = await memoryManager.retrieve(`${this.memoryKey}/templates`);
    const typeTemplates = templates[input.type] || [];

    // Filter by style
    const styleFiltered = typeTemplates.filter((template: any) =>
      template.styles.includes(input.style) || template.styles.includes('universal')
    );

    if (styleFiltered.length === 0) {
      console.warn(`⚠️ No templates found for type ${input.type} and style ${input.style}`);
      return this.getDefaultTemplate(input.type);
    }

    // Select most popular template or random if viral optimization is desired
    const selectedTemplate = input.style === 'viral' ?
      styleFiltered[Math.floor(Math.random() * styleFiltered.length)] :
      styleFiltered.reduce((best: any, current: any) =>
        current.popularity > best.popularity ? current : best
      );

    console.log(`📋 Selected template: ${selectedTemplate.name} for ${input.type}`);
    return selectedTemplate;
  }

  private async generateDesign(input: MotionGraphicsInput, template: any): Promise<any> {
    console.log('🎨 Generating visual design...');

    const design = {
      id: `design-${Date.now()}`,
      template: template.name,
      colors: this.generateColorScheme(input),
      typography: this.generateTypography(input),
      layout: this.generateLayout(input, template),
      elements: this.generateElements(input, template),
      timing: this.generateTiming(input)
    };

    // Enhance design with viral elements
    if (input.style === 'viral') {
      design.viralElements = await this.addViralElements(design, input);
    }

    return design;
  }

  private generateColorScheme(input: MotionGraphicsInput): any {
    const colorSchemes = VIRAL_TEMPLATES.visual_patterns.color_schemes;
    let scheme = colorSchemes.energetic; // Default

    // Select scheme based on style
    switch (input.style) {
      case 'professional':
        scheme = colorSchemes.professional;
        break;
      case 'viral':
      case 'energetic':
        scheme = colorSchemes.energetic;
        break;
      case 'minimalist':
        scheme = colorSchemes.calming;
        break;
      default:
        scheme = colorSchemes.trendy;
    }

    // Override with brand colors if provided
    if (input.content.brand?.colors && input.content.brand.colors.length > 0) {
      scheme = [...input.content.brand.colors];
    }

    // Override with content colors if provided
    if (input.content.colors && input.content.colors.length > 0) {
      scheme = [...input.content.colors];
    }

    return {
      primary: scheme[0],
      secondary: scheme[1] || scheme[0],
      accent: scheme[2] || scheme[0],
      background: scheme[3] || '#000000',
      text: this.getContrastColor(scheme[0])
    };
  }

  private generateTypography(input: MotionGraphicsInput): any {
    const typography = {
      primary: {
        family: input.content.brand?.font || 'Inter',
        weight: 'bold',
        size: this.calculateFontSize(input),
        lineHeight: 1.2
      },
      secondary: {
        family: input.content.brand?.font || 'Inter',
        weight: 'medium',
        size: this.calculateFontSize(input) * 0.7,
        lineHeight: 1.3
      }
    };

    // Style-specific adjustments
    switch (input.style) {
      case 'viral':
        typography.primary.weight = 'black';
        typography.primary.transform = 'uppercase';
        break;
      case 'minimalist':
        typography.primary.weight = 'light';
        typography.secondary.weight = 'light';
        break;
      case 'professional':
        typography.primary.weight = 'semibold';
        break;
    }

    return typography;
  }

  private calculateFontSize(input: MotionGraphicsInput): number {
    const baseSize = Math.min(input.targetDimensions.width, input.targetDimensions.height) / 20;

    // Adjust based on type
    switch (input.type) {
      case 'intro':
      case 'outro':
        return baseSize * 1.5;
      case 'lower_third':
        return baseSize * 0.8;
      case 'call_to_action':
        return baseSize * 1.2;
      default:
        return baseSize;
    }
  }

  private generateLayout(input: MotionGraphicsInput, template: any): any {
    const { width, height } = input.targetDimensions;

    const layout = {
      canvas: { width, height },
      safeZone: {
        x: width * 0.05,
        y: height * 0.05,
        width: width * 0.9,
        height: height * 0.9
      },
      regions: {}
    };

    // Generate layout regions based on type
    switch (input.type) {
      case 'intro':
      case 'outro':
        layout.regions = {
          main: { x: 0, y: height * 0.3, width, height: height * 0.4 },
          logo: { x: width * 0.1, y: height * 0.1, width: width * 0.8, height: height * 0.15 }
        };
        break;

      case 'lower_third':
        layout.regions = {
          main: { x: width * 0.05, y: height * 0.7, width: width * 0.9, height: height * 0.25 }
        };
        break;

      case 'call_to_action':
        layout.regions = {
          main: { x: width * 0.1, y: height * 0.4, width: width * 0.8, height: height * 0.2 }
        };
        break;

      default:
        layout.regions = {
          main: { x: width * 0.1, y: height * 0.4, width: width * 0.8, height: height * 0.2 }
        };
    }

    return layout;
  }

  private generateElements(input: MotionGraphicsInput, template: any): any[] {
    const elements = [];

    // Text elements
    if (input.content.text) {
      elements.push({
        type: 'text',
        content: input.content.text,
        style: this.generateTextStyle(input),
        position: 'main'
      });
    }

    // Logo element
    if (input.content.brand?.logo) {
      elements.push({
        type: 'image',
        content: input.content.brand.logo,
        position: 'logo',
        scale: 0.8
      });
    }

    // Decorative elements based on style
    switch (input.style) {
      case 'viral':
        elements.push(
          { type: 'particle', content: { type: 'sparkle', count: 20 } },
          { type: 'shape', content: { type: 'burst', color: 'accent' } }
        );
        break;

      case 'energetic':
        elements.push(
          { type: 'shape', content: { type: 'geometric', animated: true } },
          { type: 'gradient', content: { type: 'radial', animated: true } }
        );
        break;

      case 'professional':
        elements.push(
          { type: 'line', content: { type: 'underline', color: 'accent' } }
        );
        break;
    }

    return elements;
  }

  private generateTiming(input: MotionGraphicsInput): any {
    const totalDuration = input.duration;
    const timing = VIRAL_TEMPLATES.timing_patterns;

    return {
      total: totalDuration,
      intro: Math.min(totalDuration * 0.2, timing.hook_duration),
      main: totalDuration * 0.6,
      outro: Math.min(totalDuration * 0.2, 2),
      transitions: {
        fadeIn: 0.3,
        fadeOut: 0.3,
        scaleIn: 0.4,
        slideIn: 0.5
      }
    };
  }

  private async addViralElements(design: any, input: MotionGraphicsInput): Promise<any> {
    const viralElements = {
      emojis: this.addViralEmojis(input.type),
      effects: this.addViralEffects(),
      animations: this.addViralAnimations(),
      sounds: this.suggestViralSounds(input.type)
    };

    // Add trending visual elements
    if (input.type === 'intro') {
      viralElements.hooks = VIRAL_TEMPLATES.trending_hooks.slice(0, 3);
    }

    return viralElements;
  }

  private addViralEmojis(type: string): string[] {
    const emojiSets = {
      intro: ['🔥', '⚡', '✨', '🚀', '💯'],
      outro: ['👍', '💖', '🔔', '➡️', '👆'],
      call_to_action: ['👆', '🔥', '💥', '🎯', '⚡'],
      lower_third: ['📍', '⭐', '🏆', '💎', '🔴']
    };

    return emojiSets[type as keyof typeof emojiSets] || emojiSets.intro;
  }

  private addViralEffects(): any[] {
    return [
      { type: 'pulse', intensity: 0.8 },
      { type: 'glow', color: 'accent', intensity: 0.6 },
      { type: 'shake', intensity: 0.3, duration: 0.2 },
      { type: 'zoom', scale: 1.1, duration: 0.5 }
    ];
  }

  private addViralAnimations(): any[] {
    return [
      { type: 'bounce', easing: 'elastic', duration: 0.8 },
      { type: 'slide', direction: 'up', distance: '20px' },
      { type: 'fade', opacity: [0, 1], duration: 0.5 },
      { type: 'scale', scale: [0.8, 1.2, 1], duration: 0.6 }
    ];
  }

  private suggestViralSounds(type: string): string[] {
    const soundSets = {
      intro: ['whoosh', 'impact', 'rise'],
      outro: ['chime', 'success', 'notification'],
      call_to_action: ['click', 'pop', 'alert'],
      transition: ['swipe', 'zoom', 'glitch']
    };

    return soundSets[type as keyof typeof soundSets] || soundSets.intro;
  }

  private async createAnimations(input: MotionGraphicsInput, design: any): Promise<any> {
    console.log('🎬 Creating animations...');

    const animations = {
      entrance: this.createEntranceAnimation(input, design),
      emphasis: this.createEmphasisAnimation(input, design),
      exit: this.createExitAnimation(input, design)
    };

    // Add viral-specific animations
    if (input.style === 'viral' && design.viralElements) {
      animations.viral = this.createViralAnimations(design.viralElements);
    }

    return animations;
  }

  private createEntranceAnimation(input: MotionGraphicsInput, design: any): any {
    const animationType = input.animation.type;
    const timing = design.timing;

    switch (animationType) {
      case 'fade_in':
        return {
          type: 'fade',
          duration: timing.transitions.fadeIn,
          easing: input.animation.timing,
          keyframes: [
            { time: 0, opacity: 0 },
            { time: 1, opacity: 1 }
          ]
        };

      case 'slide_in':
        return {
          type: 'slide',
          duration: timing.transitions.slideIn,
          easing: input.animation.timing,
          keyframes: [
            { time: 0, transform: 'translateY(50px)', opacity: 0 },
            { time: 1, transform: 'translateY(0)', opacity: 1 }
          ]
        };

      case 'scale':
        return {
          type: 'scale',
          duration: timing.transitions.scaleIn,
          easing: input.animation.timing,
          keyframes: [
            { time: 0, transform: 'scale(0.8)', opacity: 0 },
            { time: 1, transform: 'scale(1)', opacity: 1 }
          ]
        };

      default:
        return this.createEntranceAnimation(
          { ...input, animation: { ...input.animation, type: 'fade_in' } },
          design
        );
    }
  }

  private createEmphasisAnimation(input: MotionGraphicsInput, design: any): any {
    return {
      type: 'pulse',
      duration: 0.6,
      delay: design.timing.intro,
      easing: 'ease-in-out',
      keyframes: [
        { time: 0, transform: 'scale(1)' },
        { time: 0.5, transform: 'scale(1.05)' },
        { time: 1, transform: 'scale(1)' }
      ]
    };
  }

  private createExitAnimation(input: MotionGraphicsInput, design: any): any {
    return {
      type: 'fade_out',
      duration: design.timing.outro,
      delay: input.duration - design.timing.outro,
      easing: 'ease-in',
      keyframes: [
        { time: 0, opacity: 1 },
        { time: 1, opacity: 0 }
      ]
    };
  }

  private createViralAnimations(viralElements: any): any[] {
    return viralElements.animations.map((anim: any, index: number) => ({
      ...anim,
      delay: index * 0.2,
      element: `viral-element-${index}`
    }));
  }

  private async renderMotionGraphics(input: MotionGraphicsInput, design: any, animations: any): Promise<any> {
    console.log('🖥️ Rendering motion graphics...');

    // Simulate rendering process
    const renderingSteps = [
      'Preparing canvas',
      'Rendering elements',
      'Applying animations',
      'Compositing layers',
      'Encoding output'
    ];

    for (const step of renderingSteps) {
      console.log(`  📊 ${step}...`);
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    const result = {
      id: `motion-${Date.now()}`,
      type: input.type,
      url: `https://storage.googleapis.com/motion-graphics/${input.type}/${Date.now()}.mp4`,
      format: 'mp4',
      duration: input.duration,
      dimensions: input.targetDimensions,
      metadata: {
        design,
        animations,
        renderSettings: {
          quality: 'high',
          framerate: 60,
          codec: 'h264',
          transparency: input.type !== 'intro' && input.type !== 'outro'
        },
        viralScore: await this.calculateViralScore(design, input),
        renderTime: Date.now() % 5000
      }
    };

    // Store in memory
    await memoryManager.store(`${this.memoryKey}/rendered/${result.id}`, result);

    return result;
  }

  private async applyViralOptimizations(result: any, input: MotionGraphicsInput): Promise<any> {
    console.log('🔥 Applying viral optimizations...');

    const optimizations = {
      hookOptimization: input.type === 'intro',
      emotionalImpact: this.calculateEmotionalImpact(result.metadata.design),
      shareability: this.calculateShareability(input),
      platformOptimization: this.optimizeForPlatforms(result, input.targetDimensions)
    };

    return {
      ...result,
      optimizations,
      variants: await this.generateVariants(result, input)
    };
  }

  private calculateEmotionalImpact(design: any): number {
    let impact = 0.5; // Base score

    // Color impact
    const colors = design.colors;
    if (colors.primary.includes('ff') || colors.accent.includes('ff')) impact += 0.1; // Red/orange boost
    if (colors.primary.includes('00ff') || colors.accent.includes('00ff')) impact += 0.15; // Green boost

    // Viral elements boost
    if (design.viralElements) {
      impact += design.viralElements.emojis.length * 0.05;
      impact += design.viralElements.effects.length * 0.03;
    }

    return Math.min(impact, 1.0);
  }

  private calculateShareability(input: MotionGraphicsInput): number {
    let shareability = 0.5;

    // Type-specific boosts
    switch (input.type) {
      case 'call_to_action': shareability += 0.2; break;
      case 'intro': shareability += 0.15; break;
      case 'viral': shareability += 0.3; break;
    }

    // Style boosts
    if (input.style === 'viral') shareability += 0.2;
    if (input.style === 'energetic') shareability += 0.1;

    return Math.min(shareability, 1.0);
  }

  private optimizeForPlatforms(result: any, targetDimensions: any): any {
    const platforms = this.detectPlatforms(targetDimensions);

    return platforms.reduce((optimizations: any, platform: string) => {
      optimizations[platform] = {
        textSize: this.optimizeTextForPlatform(platform, result),
        placement: this.optimizePlacementForPlatform(platform),
        timing: this.optimizeTimingForPlatform(platform, result.duration)
      };
      return optimizations;
    }, {});
  }

  private detectPlatforms(dimensions: any): string[] {
    const aspectRatio = dimensions.width / dimensions.height;

    if (aspectRatio < 1) return ['tiktok', 'instagram-reels', 'youtube-shorts'];
    if (aspectRatio > 1.5) return ['youtube', 'facebook', 'twitter'];
    return ['instagram', 'facebook', 'linkedin'];
  }

  private optimizeTextForPlatform(platform: string, result: any): any {
    const baseFontSize = result.metadata.design.typography.primary.size;

    const adjustments = {
      'tiktok': 1.1, // Slightly larger for mobile
      'instagram-reels': 1.05,
      'youtube-shorts': 1.0,
      'youtube': 0.9,
      'facebook': 0.95
    };

    return {
      size: baseFontSize * (adjustments[platform as keyof typeof adjustments] || 1.0),
      weight: platform.includes('tik') ? 'black' : 'bold'
    };
  }

  private optimizePlacementForPlatform(platform: string): any {
    // Platform-specific safe zones
    const safeZones = {
      'tiktok': { top: 0.15, bottom: 0.25 }, // Account for UI elements
      'instagram-reels': { top: 0.1, bottom: 0.2 },
      'youtube-shorts': { top: 0.05, bottom: 0.15 }
    };

    return safeZones[platform as keyof typeof safeZones] || { top: 0.1, bottom: 0.1 };
  }

  private optimizeTimingForPlatform(platform: string, duration: number): any {
    const platformTiming = {
      'tiktok': { hookTime: 1.5, maxDuration: 15 },
      'instagram-reels': { hookTime: 2, maxDuration: 30 },
      'youtube-shorts': { hookTime: 3, maxDuration: 60 }
    };

    return platformTiming[platform as keyof typeof platformTiming] ||
           { hookTime: 2, maxDuration: duration };
  }

  private async generateVariants(result: any, input: MotionGraphicsInput): Promise<any[]> {
    const variants = [];

    // Color variants
    const colorSchemes = VIRAL_TEMPLATES.visual_patterns.color_schemes;
    for (const [schemeName, colors] of Object.entries(colorSchemes)) {
      if (schemeName !== input.style) {
        variants.push({
          type: 'color',
          name: schemeName,
          url: `${result.url.replace('.mp4', '')}-${schemeName}.mp4`,
          preview: colors[0]
        });
      }
    }

    // Text variants (if applicable)
    if (input.content.text) {
      const textVariants = [
        'BOLD CAPS VERSION',
        'minimal lowercase',
        'Title Case Version'
      ];

      textVariants.forEach((text, index) => {
        variants.push({
          type: 'text',
          name: `variant-${index + 1}`,
          url: `${result.url.replace('.mp4', '')}-text-${index}.mp4`,
          preview: text
        });
      });
    }

    return variants.slice(0, 5); // Limit to 5 variants
  }

  private async calculateViralScore(design: any, input: MotionGraphicsInput): Promise<number> {
    let score = 0.5;

    // Style factor
    if (input.style === 'viral') score += 0.2;
    else if (input.style === 'energetic') score += 0.15;

    // Type factor
    if (input.type === 'call_to_action') score += 0.15;
    else if (input.type === 'intro') score += 0.1;

    // Design elements
    if (design.viralElements) {
      score += design.viralElements.emojis.length * 0.02;
      score += design.viralElements.effects.length * 0.03;
    }

    // Animation factor
    if (input.animation.intensity > 0.7) score += 0.1;

    return Math.min(score, 1.0);
  }

  private generateTextStyle(input: MotionGraphicsInput): TextStyle {
    const colorScheme = this.generateColorScheme(input);
    const typography = this.generateTypography(input);

    return {
      fontFamily: typography.primary.family,
      fontSize: typography.primary.size,
      color: colorScheme.text,
      backgroundColor: input.style === 'viral' ? colorScheme.accent : undefined,
      border: input.style === 'professional' ? {
        width: 2,
        color: colorScheme.accent,
        style: 'solid'
      } : undefined,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        blur: 4,
        color: 'rgba(0,0,0,0.5)'
      }
    };
  }

  private getContrastColor(backgroundColor: string): string {
    // Simple contrast calculation
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 128 ? '#000000' : '#ffffff';
  }

  private getDefaultTemplate(type: string): any {
    return {
      name: `default-${type}`,
      styles: ['universal'],
      popularity: 0.5,
      elements: ['text'],
      animations: ['fade_in']
    };
  }

  private getMotionGraphicsTemplates(): any {
    return {
      intro: [
        {
          name: 'viral-burst',
          styles: ['viral', 'energetic'],
          popularity: 0.9,
          elements: ['text', 'particle', 'burst'],
          duration: 3
        },
        {
          name: 'clean-fade',
          styles: ['professional', 'minimalist'],
          popularity: 0.7,
          elements: ['text', 'line'],
          duration: 2
        }
      ],
      outro: [
        {
          name: 'subscribe-glow',
          styles: ['viral', 'energetic'],
          popularity: 0.95,
          elements: ['text', 'glow', 'pulse'],
          duration: 4
        }
      ],
      call_to_action: [
        {
          name: 'tap-pulse',
          styles: ['viral'],
          popularity: 0.85,
          elements: ['text', 'pulse', 'arrow'],
          duration: 2
        }
      ],
      lower_third: [
        {
          name: 'slide-in',
          styles: ['professional'],
          popularity: 0.8,
          elements: ['text', 'background'],
          duration: 5
        }
      ]
    };
  }

  private getAnimationLibrary(): any {
    return {
      entrance: ['fade_in', 'slide_in', 'scale', 'bounce'],
      emphasis: ['pulse', 'glow', 'shake', 'zoom'],
      exit: ['fade_out', 'slide_out', 'scale_down']
    };
  }

  private getStyleLibrary(): any {
    return {
      viral: {
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
        fonts: ['Impact', 'Bebas Neue', 'Oswald'],
        animations: ['bounce', 'pulse', 'shake']
      },
      professional: {
        colors: ['#2C3E50', '#3498DB', '#E74C3C'],
        fonts: ['Inter', 'Roboto', 'Open Sans'],
        animations: ['fade', 'slide']
      },
      minimalist: {
        colors: ['#000000', '#FFFFFF', '#F5F5F5'],
        fonts: ['Helvetica', 'Arial', 'System'],
        animations: ['fade', 'scale']
      }
    };
  }

  private async updateProgress(taskId: string, progress: number): Promise<void> {
    const task = this.activeJobs.get(taskId);
    if (task) {
      task.progress = progress;

      await communicationProtocol.broadcast({
        type: 'progress_update',
        agentId: this.agentId,
        data: { taskId, progress },
        timestamp: Date.now()
      });
    }
  }

  private async handleTaskError(taskId: string, error: any): Promise<void> {
    const task = this.activeJobs.get(taskId);
    if (task) {
      task.status = 'error';
      task.error = error.message;
      task.completedAt = new Date();

      await claudeFlowIntegration.executeHook('onError', this.agentId, {
        taskId,
        error: error.message,
        context: task
      });

      console.error(`❌ Motion graphics task ${taskId} failed:`, error);
    }
  }

  // Claude Flow hook handlers
  private async handlePreTask(context: any): Promise<void> {
    console.log(`🔄 Pre-task hook: ${context.operation} for task ${context.taskId}`);
  }

  private async handlePostTask(context: any): Promise<void> {
    console.log(`✅ Post-task hook: ${context.operation} completed for task ${context.taskId}`);
  }

  private async handleError(context: any): Promise<void> {
    console.error(`🚨 Error hook: ${context.error} for task ${context.taskId}`);
  }

  // Public API methods
  async getStatus(): Promise<any> {
    return {
      agentId: this.agentId,
      isInitialized: this.isInitialized,
      activeJobs: this.activeJobs.size,
      capabilities: [
        'animated-text',
        'intro-outro-creation',
        'viral-elements'
      ]
    };
  }

  async getTemplates(): Promise<any> {
    return await memoryManager.retrieve(`${this.memoryKey}/templates`);
  }

  async shutdown(): Promise<void> {
    console.log(`🛑 Shutting down MotionGraphics Agent ${this.agentId}...`);
    this.activeJobs.clear();
    this.isInitialized = false;
    console.log(`✅ MotionGraphics Agent ${this.agentId} shutdown complete`);
  }
}

// Export singleton instance
export const motionGraphics = new MotionGraphics();
export default motionGraphics;