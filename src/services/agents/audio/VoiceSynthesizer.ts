import * as Tone from 'tone';
import {
  BaseAudioAgent,
  AudioAgentType,
  AgentStatus,
  VoiceConfig,
  TextToSpeechRequest,
  VoiceOutput,
  AudioFormat,
  AudioAgentCallbacks,
  AudioAgentError
} from './types';

export class VoiceSynthesizer implements BaseAudioAgent {
  public readonly id: string;
  public readonly type: AudioAgentType = 'voice-synthesizer';
  public status: AgentStatus = 'idle';
  public readonly capabilities: string[] = [
    'text_to_speech',
    'voice_synthesis',
    'vocal_effects',
    'speech_processing',
    'phoneme_generation',
    'prosody_control',
    'language_support',
    'emotion_synthesis'
  ];
  public metadata: Record<string, any> = {};

  private speechSynthesis?: SpeechSynthesis;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private callbacks: AudioAgentCallbacks;
  private voicePresets: Map<string, VoiceConfig> = new Map();
  private generatedVoices: Map<string, VoiceOutput> = new Map();

  // Voice processing nodes
  private voiceProcessor?: Tone.ToneAudioNode;
  private pitchShifter?: Tone.PitchShift;
  private vocoder?: Tone.ToneAudioNode;

  constructor(callbacks: AudioAgentCallbacks = {}) {
    this.id = `voice-synth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.callbacks = callbacks;
    this.metadata = {
      createdAt: new Date(),
      version: '1.0.0',
      speechSynthesisSupported: false,
      voicesLoaded: false,
      presetsCount: 0
    };

    this.initializeVoicePresets();
  }

  public async initialize(): Promise<void> {
    try {
      this.status = 'initializing';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      // Initialize Tone.js context
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Check for Speech Synthesis API support
      this.speechSynthesis = window.speechSynthesis;
      this.metadata.speechSynthesisSupported = !!this.speechSynthesis;

      if (this.speechSynthesis) {
        await this.loadAvailableVoices();
        await this.initializeVoiceProcessing();
      } else {
        console.warn('Speech Synthesis API not supported, using fallback synthesis');
        await this.initializeFallbackSynthesis();
      }

      this.metadata.voicesLoaded = this.availableVoices.length > 0;
      this.metadata.presetsCount = this.voicePresets.size;
      this.status = 'ready';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      console.log(`🎤 VoiceSynthesizer ${this.id} initialized with ${this.availableVoices.length} voices`);
    } catch (error) {
      this.status = 'error';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);
      throw new AudioAgentError(
        `Failed to initialize VoiceSynthesizer: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        this.type,
        'INIT_FAILED'
      );
    }
  }

  private initializeVoicePresets(): void {
    // English voices
    this.voicePresets.set('narrator-male', {
      voice: 'male',
      language: 'en-US',
      pitch: 0,
      speed: 1,
      emotion: 'neutral'
    });

    this.voicePresets.set('narrator-female', {
      voice: 'female',
      language: 'en-US',
      pitch: 0.2,
      speed: 1,
      emotion: 'neutral'
    });

    this.voicePresets.set('child-voice', {
      voice: 'child',
      language: 'en-US',
      pitch: 0.8,
      speed: 1.1,
      emotion: 'happy'
    });

    // Character voices
    this.voicePresets.set('robotic', {
      voice: 'robotic',
      language: 'en-US',
      pitch: -0.3,
      speed: 0.9,
      emotion: 'neutral'
    });

    this.voicePresets.set('ethereal', {
      voice: 'ethereal',
      language: 'en-US',
      pitch: 0.5,
      speed: 0.8,
      emotion: 'calm'
    });

    // Emotional variants
    this.voicePresets.set('excited-announcer', {
      voice: 'male',
      language: 'en-US',
      pitch: 0.3,
      speed: 1.2,
      emotion: 'excited'
    });

    this.voicePresets.set('calm-meditation', {
      voice: 'female',
      language: 'en-US',
      pitch: -0.1,
      speed: 0.7,
      emotion: 'calm'
    });

    // Multilingual presets
    this.voicePresets.set('spanish-female', {
      voice: 'female',
      language: 'es-ES',
      pitch: 0.1,
      speed: 1,
      emotion: 'neutral'
    });

    this.voicePresets.set('french-male', {
      voice: 'male',
      language: 'fr-FR',
      pitch: 0,
      speed: 1,
      emotion: 'neutral'
    });

    this.voicePresets.set('japanese-female', {
      voice: 'female',
      language: 'ja-JP',
      pitch: 0.4,
      speed: 1,
      emotion: 'neutral'
    });
  }

  private async loadAvailableVoices(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.speechSynthesis) {
        resolve();
        return;
      }

      const loadVoices = () => {
        this.availableVoices = this.speechSynthesis!.getVoices();
        if (this.availableVoices.length > 0) {
          resolve();
        } else {
          // Voices might not be loaded yet, wait and try again
          setTimeout(loadVoices, 100);
        }
      };

      // Listen for voices changed event
      this.speechSynthesis.onvoiceschanged = loadVoices;

      // Try to load voices immediately
      loadVoices();
    });
  }

  private async initializeVoiceProcessing(): Promise<void> {
    // Initialize voice processing effects
    this.pitchShifter = new Tone.PitchShift({
      pitch: 0,
      windowSize: 0.1,
      overlap: 50,
      delayTime: 0
    });

    // Create basic voice processor chain
    this.voiceProcessor = new Tone.Gain(1);
  }

  private async initializeFallbackSynthesis(): Promise<void> {
    // Initialize basic oscillator-based speech synthesis for fallback
    console.log('Setting up fallback voice synthesis using Tone.js oscillators');
  }

  public async synthesizeSpeech(request: TextToSpeechRequest): Promise<VoiceOutput> {
    if (this.status !== 'ready') {
      throw new AudioAgentError('VoiceSynthesizer not ready', this.id, this.type, 'NOT_READY');
    }

    try {
      this.status = 'processing';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      const voiceId = `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      let audioBuffer: ArrayBuffer;

      if (this.speechSynthesis && this.availableVoices.length > 0) {
        audioBuffer = await this.synthesizeWithWebAPI(request);
      } else {
        audioBuffer = await this.synthesizeWithFallback(request);
      }

      const voiceOutput: VoiceOutput = {
        id: voiceId,
        text: request.text,
        audioBuffer,
        duration: this.estimateDuration(request.text, request.voice.speed),
        voiceConfig: request.voice,
        metadata: {
          generatedAt: new Date(),
          language: request.voice.language,
          wordCount: request.text.split(/\s+/).length
        }
      };

      this.generatedVoices.set(voiceId, voiceOutput);
      this.status = 'ready';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);
      this.callbacks.onVoiceGenerated?.(voiceOutput);

      console.log(`🎤 Generated voice: ${request.text.substring(0, 50)}...`);
      return voiceOutput;
    } catch (error) {
      this.status = 'error';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);
      throw new AudioAgentError(
        `Voice synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        this.type,
        'SYNTHESIS_FAILED'
      );
    }
  }

  private async synthesizeWithWebAPI(request: TextToSpeechRequest): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.speechSynthesis) {
          throw new Error('Speech synthesis not available');
        }

        // Find the best matching voice
        const voice = this.findBestVoice(request.voice);

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(request.text);

        if (voice) {
          utterance.voice = voice;
        }

        // Configure voice parameters
        utterance.pitch = this.mapPitchValue(request.voice.pitch);
        utterance.rate = request.voice.speed;
        utterance.volume = 1.0;

        // Set up audio capture
        this.captureUtteranceAudio(utterance)
          .then(resolve)
          .catch(reject);

        // Speak the utterance
        this.speechSynthesis.speak(utterance);

      } catch (error) {
        reject(error);
      }
    });
  }

  private async captureUtteranceAudio(utterance: SpeechSynthesisUtterance): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      // This is a simplified approach - in a real implementation,
      // you would need to capture the audio output from the speech synthesis
      // For now, we'll create a placeholder audio buffer

      setTimeout(() => {
        // Create a simple tone as placeholder
        this.createPlaceholderAudio(utterance.text.length * 100)
          .then(resolve)
          .catch(reject);
      }, utterance.text.length * 50); // Approximate speech duration
    });
  }

  private async createPlaceholderAudio(duration: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      try {
        const oscillator = new Tone.Oscillator(220, 'sine');
        const recorder = new Tone.Recorder();

        oscillator.connect(recorder);

        const durationSeconds = Math.min(duration / 1000, 10); // Cap at 10 seconds

        recorder.start().then(() => {
          oscillator.start();
          oscillator.stop(Tone.now() + durationSeconds);

          setTimeout(async () => {
            try {
              const recording = await recorder.stop();
              const arrayBuffer = await recording.arrayBuffer();

              oscillator.dispose();
              recorder.dispose();

              resolve(arrayBuffer);
            } catch (error) {
              reject(error);
            }
          }, (durationSeconds * 1000) + 100);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async synthesizeWithFallback(request: TextToSpeechRequest): Promise<ArrayBuffer> {
    // Fallback synthesis using Tone.js oscillators
    // This creates a simple "robot voice" effect
    return this.createRoboticVoice(request.text, request.voice);
  }

  private async createRoboticVoice(text: string, voice: VoiceConfig): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      try {
        const words = text.split(/\s+/);
        const totalDuration = words.length * 0.3; // 300ms per word

        const oscillator = new Tone.Oscillator();
        const filter = new Tone.Filter(1000, 'bandpass');
        const distortion = new Tone.Distortion(0.2);
        const recorder = new Tone.Recorder();

        // Create robotic voice effect chain
        oscillator.chain(filter, distortion, recorder);

        // Configure oscillator based on voice settings
        const baseFreq = voice.voice === 'male' ? 120 :
                        voice.voice === 'female' ? 220 :
                        voice.voice === 'child' ? 300 : 180;

        oscillator.frequency.value = baseFreq * (1 + voice.pitch * 0.5);
        oscillator.type = 'square'; // Robot-like timbre

        recorder.start().then(() => {
          oscillator.start();

          // Modulate frequency to simulate speech patterns
          this.modulateRoboticSpeech(oscillator, words, voice);

          setTimeout(async () => {
            try {
              const recording = await recorder.stop();
              const arrayBuffer = await recording.arrayBuffer();

              oscillator.dispose();
              filter.dispose();
              distortion.dispose();
              recorder.dispose();

              resolve(arrayBuffer);
            } catch (error) {
              reject(error);
            }
          }, totalDuration * 1000 + 100);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private modulateRoboticSpeech(oscillator: Tone.Oscillator, words: string[], voice: VoiceConfig): void {
    const baseFreq = oscillator.frequency.value;
    const wordDuration = 0.3 / voice.speed;

    words.forEach((word, index) => {
      const startTime = index * wordDuration;

      // Modulate frequency based on word characteristics
      const wordFreq = baseFreq + (word.length * 10) + (Math.random() * 50 - 25);

      oscillator.frequency.setValueAtTime(wordFreq, Tone.now() + startTime);

      // Add brief pauses between words
      if (index < words.length - 1) {
        oscillator.frequency.setValueAtTime(0, Tone.now() + startTime + wordDuration * 0.8);
      }
    });
  }

  private findBestVoice(voiceConfig: VoiceConfig): SpeechSynthesisVoice | null {
    if (!this.availableVoices.length) return null;

    // Find voice by language first
    let candidates = this.availableVoices.filter(v =>
      v.lang.startsWith(voiceConfig.language.split('-')[0])
    );

    if (candidates.length === 0) {
      candidates = this.availableVoices.filter(v => v.lang.startsWith('en'));
    }

    if (candidates.length === 0) {
      candidates = this.availableVoices;
    }

    // Try to match voice type (male/female)
    if (voiceConfig.voice === 'male') {
      const maleVoice = candidates.find(v =>
        v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('man') ||
        v.name.toLowerCase().includes('david') ||
        v.name.toLowerCase().includes('alex')
      );
      if (maleVoice) return maleVoice;
    } else if (voiceConfig.voice === 'female') {
      const femaleVoice = candidates.find(v =>
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('woman') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('karen')
      );
      if (femaleVoice) return femaleVoice;
    }

    // Return first available candidate
    return candidates[0] || null;
  }

  private mapPitchValue(pitch: number): number {
    // Map from -1...1 range to 0...2 range for Web Speech API
    return Math.max(0, Math.min(2, 1 + pitch));
  }

  private estimateDuration(text: string, speed: number): number {
    // Rough estimation: ~150 words per minute at normal speed
    const wordsPerMinute = 150 * speed;
    const wordCount = text.split(/\s+/).length;
    return (wordCount / wordsPerMinute) * 60; // Duration in seconds
  }

  public async processVoiceWithEffects(
    voiceOutput: VoiceOutput,
    effects: string[]
  ): Promise<VoiceOutput> {
    // Apply additional effects to generated voice
    // This could include reverb, delay, pitch shifting, etc.

    const processedId = `${voiceOutput.id}-processed`;
    const processedBuffer = await this.applyVoiceEffects(voiceOutput.audioBuffer, effects);

    const processedVoice: VoiceOutput = {
      ...voiceOutput,
      id: processedId,
      audioBuffer: processedBuffer,
      metadata: {
        ...voiceOutput.metadata,
        effectsApplied: effects,
        processedAt: new Date()
      }
    };

    this.generatedVoices.set(processedId, processedVoice);
    return processedVoice;
  }

  private async applyVoiceEffects(audioBuffer: ArrayBuffer, effects: string[]): Promise<ArrayBuffer> {
    // Simplified effect processing
    return audioBuffer; // Placeholder - would implement actual audio processing
  }

  public getPreset(presetName: string): VoiceConfig | undefined {
    return this.voicePresets.get(presetName);
  }

  public getAllPresets(): Map<string, VoiceConfig> {
    return new Map(this.voicePresets);
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return [...this.availableVoices];
  }

  public getAvailableLanguages(): string[] {
    return Array.from(new Set(this.availableVoices.map(v => v.lang)));
  }

  public createCustomVoicePreset(name: string, config: VoiceConfig): void {
    this.voicePresets.set(name, config);
    this.metadata.presetsCount = this.voicePresets.size;
  }

  public getGeneratedVoice(id: string): VoiceOutput | undefined {
    return this.generatedVoices.get(id);
  }

  public getAllGeneratedVoices(): VoiceOutput[] {
    return Array.from(this.generatedVoices.values());
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  public dispose(): void {
    this.status = 'disposed';

    // Stop any ongoing speech synthesis
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }

    // Dispose Tone.js nodes
    if (this.pitchShifter) {
      this.pitchShifter.dispose();
    }

    if (this.voiceProcessor) {
      this.voiceProcessor.dispose();
    }

    if (this.vocoder) {
      this.vocoder.dispose();
    }

    this.availableVoices = [];
    this.voicePresets.clear();
    this.generatedVoices.clear();

    this.callbacks.onAgentStatusChange?.(this.id, this.status);
    console.log(`🎤 VoiceSynthesizer ${this.id} disposed`);
  }
}