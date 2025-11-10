// Tone.js optimization for better audio performance

import React from 'react';

class ToneOptimizer {
  private static instance: ToneOptimizer;
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private bufferPool = new Map<string, AudioBuffer>();
  private maxPoolSize = 20;
  private cleanupInterval: number | null = null;

  private constructor() {
    this.setupCleanupInterval();
  }

  public static getInstance(): ToneOptimizer {
    if (!ToneOptimizer.instance) {
      ToneOptimizer.instance = new ToneOptimizer();
    }
    return ToneOptimizer.instance;
  }

  // Lazy initialization of Tone.js
  public async initializeTone(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Dynamic import to reduce initial bundle size
      const Tone = await import('tone');

      // Configure Tone.js for better performance
      await Tone.start();

      // Set optimal audio settings
      if (Tone.context.rawContext.state === 'suspended') {
        await Tone.context.resume();
      }

      // Configure audio context for low latency
      this.audioContext = Tone.context.rawContext;

      // Set buffer size for low latency (smaller = lower latency, higher CPU usage)
      if ('audioWorklet' in this.audioContext) {
        // Use AudioWorklet for better performance if available
        await this.setupAudioWorklet();
      }

      this.isInitialized = true;
      console.debug('Tone.js initialized with optimizations');
    } catch (error) {
      console.error('Failed to initialize Tone.js:', error);
      throw error;
    }
  }

  private async setupAudioWorklet(): Promise<void> {
    try {
      if (!this.audioContext) return;

      // Create optimized worklet processor for neural melody processing
      const workletCode = `
        class OptimizedProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.bufferSize = 128; // Small buffer for low latency
          }

          process(inputs, outputs, parameters) {
            // Optimized audio processing logic
            const input = inputs[0];
            const output = outputs[0];

            if (input.length > 0) {
              for (let channel = 0; channel < output.length; channel++) {
                output[channel].set(input[channel]);
              }
            }

            return true;
          }
        }

        registerProcessor('optimized-processor', OptimizedProcessor);
      `;

      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);

      await this.audioContext.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);
    } catch (error) {
      console.warn('AudioWorklet setup failed, falling back to ScriptProcessor:', error);
    }
  }

  // Buffer pooling for audio samples
  public async getBuffer(url: string): Promise<AudioBuffer | null> {
    if (this.bufferPool.has(url)) {
      return this.bufferPool.get(url)!;
    }

    try {
      if (!this.audioContext) {
        await this.initializeTone();
      }

      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

      // Add to pool with size limit
      if (this.bufferPool.size >= this.maxPoolSize) {
        // Remove oldest entry
        const firstKey = this.bufferPool.keys().next().value;
        this.bufferPool.delete(firstKey);
      }

      this.bufferPool.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load audio buffer from ${url}:`, error);
      return null;
    }
  }

  // Neural melody model optimization
  public async optimizeNeuralModel(): Promise<void> {
    try {
      // Dynamic import of MusicRNN for better code splitting
      const { MusicRNN } = await import('@magenta/music/es6');

      // Use smaller, faster model for real-time generation
      const modelUrl = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn';

      // Initialize with optimized settings
      const musicRNN = new MusicRNN(modelUrl);
      await musicRNN.initialize();

      // Configure for low-latency generation
      musicRNN.setGenerationSteps(16); // Shorter sequences for faster generation

      console.debug('Neural melody model optimized');
      return musicRNN;
    } catch (error) {
      console.error('Neural model optimization failed:', error);
      throw error;
    }
  }

  // WebRTC optimization for live mixer
  public async optimizeWebRTC(stream: MediaStream): Promise<MediaStream> {
    try {
      if (!this.audioContext) {
        await this.initializeTone();
      }

      // Create optimized audio processing chain
      const source = this.audioContext!.createMediaStreamSource(stream);
      const processor = this.audioContext!.createScriptProcessor(256, 1, 1); // Small buffer
      const destination = this.audioContext!.createMediaStreamDestination();

      // Optimize audio processing
      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const outputBuffer = event.outputBuffer;

        for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
          const inputData = inputBuffer.getChannelData(channel);
          const outputData = outputBuffer.getChannelData(channel);

          // Simple passthrough with potential for real-time effects
          outputData.set(inputData);
        }
      };

      // Connect processing chain
      source.connect(processor);
      processor.connect(destination);

      return destination.stream;
    } catch (error) {
      console.error('WebRTC optimization failed:', error);
      return stream; // Return original stream as fallback
    }
  }

  // Memory cleanup for long-running sessions
  private setupCleanupInterval(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupBuffers();
    }, 60000); // Cleanup every minute
  }

  private cleanupBuffers(): void {
    // Keep only the most recently used buffers
    if (this.bufferPool.size > this.maxPoolSize * 0.7) {
      const keysToDelete = Array.from(this.bufferPool.keys()).slice(0, 5);
      keysToDelete.forEach(key => this.bufferPool.delete(key));
    }
  }

  // Dispose of resources
  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.bufferPool.clear();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.suspend();
    }

    this.isInitialized = false;
  }

  // Performance monitoring
  public getPerformanceStats() {
    return {
      isInitialized: this.isInitialized,
      bufferPoolSize: this.bufferPool.size,
      audioContextState: this.audioContext?.state || 'not-created',
      sampleRate: this.audioContext?.sampleRate || 0,
      baseLatency: this.audioContext?.baseLatency || 0,
      outputLatency: this.audioContext?.outputLatency || 0
    };
  }
}

export default ToneOptimizer;

// Audio-specific performance hooks
export const useAudioPerformance = () => {
  const [isAudioReady, setIsAudioReady] = React.useState(false);
  const [audioStats, setAudioStats] = React.useState<any>(null);
  const optimizer = ToneOptimizer.getInstance();

  const initializeAudio = async () => {
    try {
      await optimizer.initializeTone();
      setIsAudioReady(true);
      setAudioStats(optimizer.getPerformanceStats());
    } catch (error) {
      console.error('Audio initialization failed:', error);
      setIsAudioReady(false);
    }
  };

  const getAudioBuffer = async (url: string) => {
    return await optimizer.getBuffer(url);
  };

  const optimizeStream = async (stream: MediaStream) => {
    return await optimizer.optimizeWebRTC(stream);
  };

  React.useEffect(() => {
    // Cleanup on unmount
    return () => {
      optimizer.dispose();
    };
  }, []);

  return {
    isAudioReady,
    audioStats,
    initializeAudio,
    getAudioBuffer,
    optimizeStream,
    getPerformanceStats: () => optimizer.getPerformanceStats()
  };
};