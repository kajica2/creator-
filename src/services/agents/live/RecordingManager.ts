/**
 * Recording Manager Agent
 *
 * Manages session recording with multiple formats, quality settings,
 * automatic file management, and integration with Supabase storage.
 */

import { EventEmitter } from 'events';
import {
  RecordingSession,
  VideoResolution,
  LivePerformanceConfig,
  LiveMixerMessage
} from '../../../../types';
import { MemoryManager } from '../MemoryManager';
import { ClaudeFlowIntegration } from '../ClaudeFlowIntegration';
import { SupabaseIntegration } from '../SupabaseIntegration';

interface RecordingBuffer {
  chunks: Blob[];
  duration: number;
  size: number;
}

interface StorageConfig {
  maxFileSize: number; // MB
  maxDuration: number; // seconds
  autoUpload: boolean;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  retentionDays: number;
}

export class RecordingManager extends EventEmitter {
  private activeRecordings: Map<string, MediaRecorder> = new Map();
  private recordingBuffers: Map<string, RecordingBuffer> = new Map();
  private storageConfig: StorageConfig;
  private memoryManager: MemoryManager;
  private claudeFlow: ClaudeFlowIntegration;
  private supabase: SupabaseIntegration;

  constructor(
    private config: LivePerformanceConfig,
    memoryManager: MemoryManager,
    claudeFlow: ClaudeFlowIntegration,
    supabase: SupabaseIntegration
  ) {
    super();
    this.memoryManager = memoryManager;
    this.claudeFlow = claudeFlow;
    this.supabase = supabase;

    this.storageConfig = {
      maxFileSize: 1000, // 1GB default
      maxDuration: 3600 * 4, // 4 hours default
      autoUpload: true,
      compressionLevel: 'medium',
      retentionDays: 30
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Register with memory manager
      await this.memoryManager.store('recording-manager-status', {
        initialized: true,
        timestamp: Date.now(),
        activeRecordings: 0,
        totalSessions: 0
      });

      // Hook into Claude Flow
      await this.claudeFlow.executeHook('pre-task', {
        description: 'Recording manager initialized and ready for session recording'
      });

      // Setup cleanup interval
      this.setupCleanupInterval();

      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Start recording session
   */
  async startRecording(
    sessionName: string,
    sourceStream: MediaStream,
    options: {
      format?: 'webm' | 'mp4' | 'wav' | 'mp3';
      quality?: 'low' | 'medium' | 'high' | 'lossless';
      resolution?: VideoResolution;
    } = {}
  ): Promise<string> {
    const sessionId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Create recording configuration
      const format = options.format || this.config.recordingFormat;
      const quality = options.quality || 'high';

      const recordingConfig = this.getRecordingConfig(format, quality, options.resolution);

      // Check if format is supported
      if (!MediaRecorder.isTypeSupported(recordingConfig.mimeType)) {
        throw new Error(`Recording format ${format} not supported`);
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(sourceStream, {
        mimeType: recordingConfig.mimeType,
        ...recordingConfig.options
      });

      // Initialize recording buffer
      const buffer: RecordingBuffer = {
        chunks: [],
        duration: 0,
        size: 0
      };

      // Setup event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          buffer.chunks.push(event.data);
          buffer.size += event.data.size;

          // Check file size limit
          if (buffer.size > this.storageConfig.maxFileSize * 1024 * 1024) {
            this.handleFileSizeLimit(sessionId);
          }
        }
      };

      mediaRecorder.onstart = async () => {
        const session: RecordingSession = {
          id: sessionId,
          name: sessionName,
          startTime: Date.now(),
          duration: 0,
          format,
          quality,
          size: 0,
          filePath: '',
          metadata: {
            sampleRate: this.config.sampleRate,
            channels: this.config.channels,
            bitrate: recordingConfig.bitrate,
            resolution: options.resolution
          },
          status: 'recording'
        };

        await this.memoryManager.store(`recording-session-${sessionId}`, session);
        this.emit('recordingStarted', session);

        // Notify coordination system
        await this.sendMessage({
          type: 'record',
          data: { action: 'started', sessionId, sessionName },
          priority: 'medium'
        });
      };

      mediaRecorder.onstop = async () => {
        await this.handleRecordingStop(sessionId);
      };

      mediaRecorder.onerror = async (error) => {
        await this.handleRecordingError(sessionId, error.error);
      };

      // Store references
      this.activeRecordings.set(sessionId, mediaRecorder);
      this.recordingBuffers.set(sessionId, buffer);

      // Start recording
      mediaRecorder.start(1000); // 1-second chunks

      // Setup duration monitoring
      this.setupDurationMonitoring(sessionId);

      return sessionId;

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop recording session
   */
  async stopRecording(sessionId: string): Promise<RecordingSession> {
    const mediaRecorder = this.activeRecordings.get(sessionId);
    if (!mediaRecorder) {
      throw new Error(`Recording session ${sessionId} not found`);
    }

    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }

    // Wait for processing to complete
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Recording stop timeout'));
      }, 10000);

      this.once(`recordingProcessed_${sessionId}`, (session) => {
        clearTimeout(timeout);
        resolve(session);
      });
    });
  }

  /**
   * Handle recording stop
   */
  private async handleRecordingStop(sessionId: string): Promise<void> {
    const buffer = this.recordingBuffers.get(sessionId);
    const session = await this.memoryManager.retrieve(`recording-session-${sessionId}`);

    if (!buffer || !session) {
      return;
    }

    try {
      // Update session status
      session.status = 'processing';
      session.endTime = Date.now();
      session.duration = (session.endTime - session.startTime) / 1000;
      session.size = buffer.size;

      await this.memoryManager.store(`recording-session-${sessionId}`, session);

      // Create final blob
      const finalBlob = new Blob(buffer.chunks, {
        type: this.getMimeType(session.format)
      });

      // Process and save recording
      const filePath = await this.saveRecording(sessionId, finalBlob, session);

      // Update session with file path
      session.filePath = filePath;
      session.status = 'completed';
      await this.memoryManager.store(`recording-session-${sessionId}`, session);

      // Upload to Supabase if enabled
      if (this.storageConfig.autoUpload) {
        await this.uploadToSupabase(sessionId, filePath, session);
      }

      // Cleanup
      this.activeRecordings.delete(sessionId);
      this.recordingBuffers.delete(sessionId);

      // Notify coordination system
      await this.sendMessage({
        type: 'record',
        data: {
          action: 'completed',
          sessionId,
          filePath,
          duration: session.duration,
          size: session.size
        },
        priority: 'medium'
      });

      this.emit('recordingCompleted', session);
      this.emit(`recordingProcessed_${sessionId}`, session);

    } catch (error) {
      await this.handleRecordingError(sessionId, error);
    }
  }

  /**
   * Handle recording error
   */
  private async handleRecordingError(sessionId: string, error: any): Promise<void> {
    const session = await this.memoryManager.retrieve(`recording-session-${sessionId}`);
    if (session) {
      session.status = 'error';
      await this.memoryManager.store(`recording-session-${sessionId}`, session);
    }

    // Cleanup
    this.activeRecordings.delete(sessionId);
    this.recordingBuffers.delete(sessionId);

    this.emit('recordingError', { sessionId, error });
  }

  /**
   * Get recording configuration based on format and quality
   */
  private getRecordingConfig(
    format: 'webm' | 'mp4' | 'wav' | 'mp3',
    quality: 'low' | 'medium' | 'high' | 'lossless',
    resolution?: VideoResolution
  ): {
    mimeType: string;
    options: MediaRecorderOptions;
    bitrate: number;
  } {
    const qualitySettings = {
      low: { videoBitrate: 1000000, audioBitrate: 64000 },
      medium: { videoBitrate: 2500000, audioBitrate: 128000 },
      high: { videoBitrate: 5000000, audioBitrate: 256000 },
      lossless: { videoBitrate: 10000000, audioBitrate: 512000 }
    };

    const settings = qualitySettings[quality];

    switch (format) {
      case 'webm':
        return {
          mimeType: 'video/webm;codecs=vp9,opus',
          options: {
            videoBitsPerSecond: settings.videoBitrate,
            audioBitsPerSecond: settings.audioBitrate
          },
          bitrate: settings.videoBitrate
        };

      case 'mp4':
        return {
          mimeType: 'video/mp4;codecs=avc1,mp4a',
          options: {
            videoBitsPerSecond: settings.videoBitrate,
            audioBitsPerSecond: settings.audioBitrate
          },
          bitrate: settings.videoBitrate
        };

      case 'wav':
        return {
          mimeType: 'audio/wav',
          options: {
            audioBitsPerSecond: settings.audioBitrate
          },
          bitrate: settings.audioBitrate
        };

      case 'mp3':
        return {
          mimeType: 'audio/mpeg',
          options: {
            audioBitsPerSecond: settings.audioBitrate
          },
          bitrate: settings.audioBitrate
        };

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Save recording to local storage
   */
  private async saveRecording(
    sessionId: string,
    blob: Blob,
    session: RecordingSession
  ): Promise<string> {
    const timestamp = new Date(session.startTime).toISOString().replace(/[:.]/g, '-');
    const filename = `${session.name}_${timestamp}_${sessionId}.${session.format}`;
    const filePath = `recordings/${filename}`;

    // In a browser environment, we'll use IndexedDB for storage
    // In a Node.js environment, you'd save to the file system
    await this.saveToIndexedDB(filePath, blob);

    return filePath;
  }

  /**
   * Save blob to IndexedDB
   */
  private async saveToIndexedDB(filePath: string, blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RecordingStorage', 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('recordings')) {
          db.createObjectStore('recordings', { keyPath: 'filePath' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['recordings'], 'readwrite');
        const store = transaction.objectStore('recordings');

        const saveRequest = store.put({
          filePath,
          blob,
          timestamp: Date.now()
        });

        saveRequest.onsuccess = () => resolve();
        saveRequest.onerror = () => reject(saveRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Upload recording to Supabase storage
   */
  private async uploadToSupabase(
    sessionId: string,
    filePath: string,
    session: RecordingSession
  ): Promise<void> {
    try {
      // Get blob from IndexedDB
      const blob = await this.getFromIndexedDB(filePath);
      if (!blob) {
        throw new Error('Recording file not found');
      }

      // Upload to Supabase storage
      const uploadPath = `live-recordings/${session.startTime}/${filePath}`;
      const { data, error } = await this.supabase.getClient()
        .storage
        .from('recordings')
        .upload(uploadPath, blob, {
          contentType: this.getMimeType(session.format),
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Store recording metadata in database
      await this.supabase.getClient()
        .from('recording_sessions')
        .insert({
          session_id: sessionId,
          name: session.name,
          format: session.format,
          quality: session.quality,
          duration: session.duration,
          file_size: session.size,
          file_path: uploadPath,
          metadata: session.metadata,
          created_at: new Date(session.startTime).toISOString(),
          user_id: await this.supabase.getCurrentUserId()
        });

      this.emit('recordingUploaded', { sessionId, uploadPath });

    } catch (error) {
      this.emit('uploadError', { sessionId, error });
    }
  }

  /**
   * Get blob from IndexedDB
   */
  private async getFromIndexedDB(filePath: string): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RecordingStorage', 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['recordings'], 'readonly');
        const store = transaction.objectStore('recordings');

        const getRequest = store.get(filePath);

        getRequest.onsuccess = () => {
          const result = getRequest.result;
          resolve(result ? result.blob : null);
        };

        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Setup duration monitoring
   */
  private setupDurationMonitoring(sessionId: string): void {
    const interval = setInterval(async () => {
      const session = await this.memoryManager.retrieve(`recording-session-${sessionId}`);
      const mediaRecorder = this.activeRecordings.get(sessionId);

      if (!session || !mediaRecorder || mediaRecorder.state !== 'recording') {
        clearInterval(interval);
        return;
      }

      // Update duration
      session.duration = (Date.now() - session.startTime) / 1000;
      await this.memoryManager.store(`recording-session-${sessionId}`, session);

      // Check duration limit
      if (session.duration > this.storageConfig.maxDuration) {
        this.handleDurationLimit(sessionId);
        clearInterval(interval);
      }

      this.emit('recordingProgress', { sessionId, duration: session.duration });
    }, 1000);
  }

  /**
   * Handle file size limit
   */
  private async handleFileSizeLimit(sessionId: string): Promise<void> {
    await this.sendMessage({
      type: 'record',
      data: {
        action: 'size_limit_reached',
        sessionId,
        maxSize: this.storageConfig.maxFileSize
      },
      priority: 'high'
    });

    // Optionally stop recording
    if (this.storageConfig.maxFileSize > 0) {
      await this.stopRecording(sessionId);
    }
  }

  /**
   * Handle duration limit
   */
  private async handleDurationLimit(sessionId: string): Promise<void> {
    await this.sendMessage({
      type: 'record',
      data: {
        action: 'duration_limit_reached',
        sessionId,
        maxDuration: this.storageConfig.maxDuration
      },
      priority: 'high'
    });

    await this.stopRecording(sessionId);
  }

  /**
   * Get recording sessions
   */
  async getRecordingSessions(): Promise<RecordingSession[]> {
    const sessions: RecordingSession[] = [];

    // Get from memory (active sessions)
    const memoryKeys = await this.memoryManager.getKeys();
    for (const key of memoryKeys) {
      if (key.startsWith('recording-session-')) {
        const session = await this.memoryManager.retrieve(key);
        if (session) {
          sessions.push(session);
        }
      }
    }

    // Get from Supabase (completed sessions)
    try {
      const { data } = await this.supabase.getClient()
        .from('recording_sessions')
        .select('*')
        .eq('user_id', await this.supabase.getCurrentUserId())
        .order('created_at', { ascending: false });

      if (data) {
        const supabaseSessions = data.map(row => ({
          id: row.session_id,
          name: row.name,
          startTime: new Date(row.created_at).getTime(),
          endTime: new Date(row.created_at).getTime() + (row.duration * 1000),
          duration: row.duration,
          format: row.format,
          quality: row.quality,
          size: row.file_size,
          filePath: row.file_path,
          metadata: row.metadata,
          status: 'completed' as const
        }));

        sessions.push(...supabaseSessions);
      }
    } catch (error) {
      console.error('Error fetching recording sessions:', error);
    }

    return sessions;
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format: string): string {
    const mimeTypes = {
      webm: 'video/webm',
      mp4: 'video/mp4',
      wav: 'audio/wav',
      mp3: 'audio/mpeg'
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  /**
   * Setup cleanup interval for old recordings
   */
  private setupCleanupInterval(): void {
    setInterval(async () => {
      try {
        // Clean up old local recordings
        await this.cleanupOldRecordings();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  /**
   * Cleanup old recordings based on retention policy
   */
  private async cleanupOldRecordings(): Promise<void> {
    const cutoffTime = Date.now() - (this.storageConfig.retentionDays * 24 * 60 * 60 * 1000);

    // Clean up IndexedDB
    const request = indexedDB.open('RecordingStorage', 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['recordings'], 'readwrite');
      const store = transaction.objectStore('recordings');

      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const recordings = getAllRequest.result;
        recordings.forEach(recording => {
          if (recording.timestamp < cutoffTime) {
            store.delete(recording.filePath);
          }
        });
      };
    };
  }

  /**
   * Send message to coordination system
   */
  private async sendMessage(message: Omit<LiveMixerMessage, 'timestamp'>): Promise<void> {
    const fullMessage: LiveMixerMessage = {
      ...message,
      timestamp: Date.now()
    };

    await this.memoryManager.store(`recording-message-${Date.now()}`, fullMessage);

    // Notify Claude Flow for high priority messages
    if (message.priority === 'high' || message.priority === 'critical') {
      await this.claudeFlow.executeHook('notify', {
        message: `Recording manager: ${message.type} - ${JSON.stringify(message.data)}`
      });
    }

    this.emit('messageSent', fullMessage);
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    // Stop all active recordings
    for (const [sessionId] of this.activeRecordings) {
      try {
        await this.stopRecording(sessionId);
      } catch (error) {
        console.error(`Error stopping recording ${sessionId}:`, error);
      }
    }

    this.activeRecordings.clear();
    this.recordingBuffers.clear();

    await this.claudeFlow.executeHook('post-task', {
      taskId: 'recording-manager-session'
    });
  }
}