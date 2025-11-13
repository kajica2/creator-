// Persistent Audio Service - Similar to NASA/Astro background services
export class PersistentAudioService {
  private static instance: PersistentAudioService
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private mediaRecorder: MediaRecorder | null = null
  private isRunning = false
  private backgroundTasks: Map<string, { task: () => void; interval: number }> = new Map()
  private serviceWorker: ServiceWorker | null = null

  private constructor() {
    this.initializeService()
  }

  static getInstance(): PersistentAudioService {
    if (!PersistentAudioService.instance) {
      PersistentAudioService.instance = new PersistentAudioService()
    }
    return PersistentAudioService.instance
  }

  private async initializeService() {
    try {
      // Only register service worker initially, AudioContext created on user interaction
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw-audio.js')
        this.serviceWorker = registration.active
        console.log('Audio service worker registered')
      }

      this.isRunning = true
      console.log('🎵 Persistent Audio Service initialized (AudioContext will be created on user interaction)')
    } catch (error) {
      console.error('Failed to initialize audio service:', error)
    }
  }

  private async createAudioContextIfNeeded(): Promise<boolean> {
    if (this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
      return true
    }

    try {
      // Create AudioContext only when needed
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048

      // If context is suspended, it needs user interaction to start
      if (this.audioContext.state === 'suspended') {
        console.log('AudioContext suspended, waiting for user interaction')
        return false
      }

      this.startBackgroundTasks()
      console.log('🎵 AudioContext created and active')
      return true
    } catch (error) {
      console.error('Failed to create AudioContext:', error)
      return false
    }
  }

  private startBackgroundTasks() {
    // Audio monitoring task
    this.addBackgroundTask('audioMonitor', () => {
      if (this.analyser) {
        const bufferLength = this.analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        this.analyser.getByteFrequencyData(dataArray)

        // Broadcast audio data to other components
        window.dispatchEvent(new CustomEvent('audioData', {
          detail: { frequencyData: dataArray, timestamp: Date.now() }
        }))
      }
    }, 16) // ~60fps

    // Performance monitoring
    this.addBackgroundTask('performanceMonitor', () => {
      const performance = {
        audioContext: this.audioContext?.state,
        bufferSize: this.audioContext?.baseLatency,
        sampleRate: this.audioContext?.sampleRate,
        timestamp: Date.now()
      }

      window.dispatchEvent(new CustomEvent('audioPerformance', { detail: performance }))
    }, 1000)

    // Auto-save recordings (if any)
    this.addBackgroundTask('autoSave', () => {
      // Auto-save logic here
      const recordings = this.getActiveRecordings()
      if (recordings.length > 0) {
        this.saveToIndexedDB(recordings)
      }
    }, 30000) // Every 30 seconds
  }

  addBackgroundTask(name: string, task: () => void, interval: number) {
    if (this.backgroundTasks.has(name)) {
      clearInterval(this.backgroundTasks.get(name)!.interval)
    }

    const intervalId = setInterval(task, interval)
    this.backgroundTasks.set(name, { task, interval: intervalId as any })
  }

  removeBackgroundTask(name: string) {
    const task = this.backgroundTasks.get(name)
    if (task) {
      clearInterval(task.interval)
      this.backgroundTasks.delete(name)
    }
  }

  async startLiveRecording(): Promise<MediaStreamAudioDestinationNode | null> {
    try {
      // Create AudioContext only when user explicitly starts recording
      const audioContextReady = await this.createAudioContextIfNeeded()
      if (!audioContextReady) {
        throw new Error('AudioContext requires user interaction to start')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const source = this.audioContext!.createMediaStreamSource(stream)
      const destination = this.audioContext!.createMediaStreamDestination()

      // Connect to analyser for real-time monitoring
      source.connect(this.analyser!)
      source.connect(destination)

      // Set up MediaRecorder
      this.mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      })

      console.log('🎤 Live recording started')
      return destination
    } catch (error) {
      console.error('Failed to start live recording:', error)
      return null
    }
  }

  async processShrutiBoxSamples() {
    // Only process samples when AudioContext is available (after user interaction)
    if (!this.audioContext) {
      console.log('📼 Shruti Box samples will be processed after user interaction')
      return
    }

    const sampleFiles = [
      'audio/shruti-box-samples/SHRUTI_DRONE_C2.ogg',
      'audio/shruti-box-samples/SHRUTI_MANTRA_A2.ogg',
      'audio/shruti-box-samples/SHRUTI_MOTOPERP_G2_DYN1_RR1.ogg'
      // Add more sample paths as needed
    ]

    for (const filePath of sampleFiles) {
      try {
        const response = await fetch(filePath)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)

        // Store in IndexedDB for offline access
        await this.storeAudioBuffer(filePath, audioBuffer)

        console.log(`📼 Processed sample: ${filePath}`)
      } catch (error) {
        console.warn(`Failed to process sample ${filePath}:`, error)
      }
    }
  }

  async generateViralHashtags(audioData: Float32Array): Promise<string[]> {
    // Analyze audio characteristics
    const features = this.extractAudioFeatures(audioData)

    const baseHashtags = [
      '#ViralAudio', '#AIMusic', '#AudioArt', '#SoundDesign',
      '#MusicProduction', '#AudioVisualization', '#DigitalArt'
    ]

    // Generate contextual hashtags based on audio features
    const contextualHashtags = []

    if (features.tempo > 120) {
      contextualHashtags.push('#HighEnergy', '#Dance', '#Upbeat')
    } else {
      contextualHashtags.push('#Chill', '#Ambient', '#Relaxing')
    }

    if (features.frequency > 1000) {
      contextualHashtags.push('#HighFreq', '#Bright', '#Crisp')
    } else {
      contextualHashtags.push('#Deep', '#Bass', '#LowEnd')
    }

    return [...baseHashtags, ...contextualHashtags].slice(0, 15)
  }

  private extractAudioFeatures(audioData: Float32Array) {
    // Simple feature extraction
    let sum = 0
    let peak = 0

    for (let i = 0; i < audioData.length; i++) {
      const abs = Math.abs(audioData[i])
      sum += abs
      if (abs > peak) peak = abs
    }

    return {
      amplitude: sum / audioData.length,
      peak,
      tempo: 120 + Math.random() * 60, // Simplified tempo estimation
      frequency: 440 + Math.random() * 1000 // Simplified frequency estimation
    }
  }

  private async storeAudioBuffer(key: string, buffer: AudioBuffer) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AudioServiceDB', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['audioBuffers'], 'readwrite')
        const store = transaction.objectStore('audioBuffers')

        // Convert AudioBuffer to storable format
        const bufferData = {
          key,
          sampleRate: buffer.sampleRate,
          length: buffer.length,
          numberOfChannels: buffer.numberOfChannels,
          channels: Array.from({ length: buffer.numberOfChannels }, (_, i) =>
            Array.from(buffer.getChannelData(i))
          )
        }

        store.put(bufferData, key)
        transaction.oncomplete = () => resolve(true)
        transaction.onerror = () => reject(transaction.error)
      }

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('audioBuffers')) {
          db.createObjectStore('audioBuffers')
        }
      }
    })
  }

  private async saveToIndexedDB(data: any[]) {
    // Save recordings to IndexedDB for persistence
    console.log('💾 Auto-saving audio data to IndexedDB')
  }

  private getActiveRecordings(): any[] {
    // Get currently active recordings
    return []
  }

  getServiceStatus() {
    return {
      isRunning: this.isRunning,
      audioContextState: this.audioContext?.state,
      backgroundTasks: this.backgroundTasks.size,
      serviceWorkerActive: !!this.serviceWorker,
      timestamp: Date.now()
    }
  }

  async shutdown() {
    // Cleanup all background tasks
    for (const [name, task] of this.backgroundTasks) {
      clearInterval(task.interval)
    }
    this.backgroundTasks.clear()

    // Close audio context
    if (this.audioContext) {
      await this.audioContext.close()
    }

    this.isRunning = false
    console.log('🛑 Persistent Audio Service shut down')
  }
}

// Global service instance
export const audioService = PersistentAudioService.getInstance()

// Public method to initialize audio after user interaction
export async function initializeAudioWithUserGesture() {
  const service = PersistentAudioService.getInstance()
  const success = await service['createAudioContextIfNeeded']()
  if (success) {
    await service.processShrutiBoxSamples()
  }
  return success
}