
import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioScheduledSourceNode | MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private mediaStream: MediaStream | null = null;

  private dataArray: Uint8Array = new Uint8Array();
  private animationFrameId: number | null = null;

  isInitialized: WritableSignal<boolean> = signal(false);
  isPlaying: WritableSignal<boolean> = signal(false);
  sourceType: WritableSignal<'file' | 'microphone' | null> = signal(null);

  // Audio analysis signals
  bass: WritableSignal<number> = signal(0);
  mids: WritableSignal<number> = signal(0);
  treble: WritableSignal<number> = signal(0);
  
  constructor() {}
  
  private async initialize(): Promise<void> {
    if (this.audioContext) return;
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      this.gainNode = this.audioContext.createGain();
      
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
      this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.compressor);
      this.compressor.connect(this.audioContext.destination);

      this.isInitialized.set(true);
    } catch (e) {
      console.error("Web Audio API is not supported in this browser", e);
      throw new Error("Web Audio API is not supported in this browser");
    }
  }

  async loadAudioFile(file: File): Promise<void> {
    await this.initialize();
    if (!this.audioContext) return;

    this.stop();
    this.sourceType.set('file');

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  async startMicrophone(): Promise<void> {
    await this.initialize();
    if (!this.audioContext) return;
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported by your browser.');
    }
    
    this.stop();
    this.sourceType.set('microphone');

    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  }

  play(): void {
    if (!this.audioContext || this.isPlaying()) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    if (this.sourceType() === 'file' && this.audioBuffer) {
        const bufferSource = this.audioContext.createBufferSource();
        bufferSource.buffer = this.audioBuffer;
        bufferSource.connect(this.analyser!);
        bufferSource.start();
        this.source = bufferSource;
        bufferSource.onended = () => this.stop();
    } else if (this.sourceType() === 'microphone' && this.mediaStream) {
        const streamSource = this.audioContext.createMediaStreamSource(this.mediaStream);
        streamSource.connect(this.analyser!);
        this.source = streamSource;
    } else {
        return; // No source to play
    }

    this.isPlaying.set(true);
    this.startAnalysisLoop();
  }

  pause(): void {
    if (!this.audioContext || !this.isPlaying()) return;
    this.audioContext.suspend();
    this.isPlaying.set(false);
    this.stopAnalysisLoop();
  }
  
  stop(): void {
    if (this.source && this.isPlaying()) {
        if (this.source instanceof AudioBufferSourceNode) {
            this.source.stop();
            this.source.disconnect();
        }
    }
    if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
    }
    this.source = null;
    this.isPlaying.set(false);
    this.stopAnalysisLoop();
  }

  private startAnalysisLoop(): void {
    if (this.animationFrameId) return;
    const analyze = () => {
      if (!this.analyser || !this.audioContext) return;
      
      this.analyser.getByteFrequencyData(this.dataArray);
      
      const freqBinCount = this.analyser.frequencyBinCount;
      const bassEnd = Math.floor(freqBinCount * (250 / (this.audioContext.sampleRate / 2)));
      const midEnd = Math.floor(freqBinCount * (4000 / (this.audioContext.sampleRate / 2)));

      let bassSum = 0;
      let midSum = 0;
      let trebleSum = 0;

      for (let i = 0; i < bassEnd; i++) {
        bassSum += this.dataArray[i];
      }
      for (let i = bassEnd; i < midEnd; i++) {
        midSum += this.dataArray[i];
      }
      for (let i = midEnd; i < freqBinCount; i++) {
        trebleSum += this.dataArray[i];
      }
      
      this.bass.set((bassSum / (bassEnd * 255)) * 100);
      this.mids.set((midSum / ((midEnd - bassEnd) * 255)) * 100);
      this.treble.set((trebleSum / ((freqBinCount - midEnd) * 255)) * 100);
      
      this.animationFrameId = requestAnimationFrame(analyze);
    };
    analyze();
  }

  private stopAnalysisLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
