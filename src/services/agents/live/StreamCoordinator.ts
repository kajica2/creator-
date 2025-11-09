/**
 * Stream Coordinator Agent
 *
 * Manages multi-platform streaming to Twitch, YouTube Live, Instagram Live,
 * Facebook Live, and custom RTMP endpoints with adaptive bitrate and failover.
 */

import { EventEmitter } from 'events';
import {
  StreamingPlatform,
  VideoResolution,
  LivePerformanceConfig,
  WebRTCConnection,
  LiveMixerMessage
} from '../../../../types';
import { MemoryManager } from '../MemoryManager';
import { ClaudeFlowIntegration } from '../ClaudeFlowIntegration';

interface StreamStats {
  bitrate: number;
  frameRate: number;
  droppedFrames: number;
  bandwidth: number;
  latency: number;
  viewers?: number;
}

interface AdaptiveBitrateConfig {
  enabled: boolean;
  minBitrate: number;
  maxBitrate: number;
  targetLatency: number;
  adaptationThreshold: number;
}

export class StreamCoordinator extends EventEmitter {
  private mediaRecorder: MediaRecorder | null = null;
  private streams: Map<string, RTMPStream> = new Map();
  private webrtcConnections: Map<string, WebRTCConnection> = new Map();
  private adaptiveBitrate: AdaptiveBitrateConfig;
  private isStreaming = false;
  private memoryManager: MemoryManager;
  private claudeFlow: ClaudeFlowIntegration;

  private platformConfigs = {
    twitch: {
      ingestUrl: 'rtmp://live.twitch.tv/live/',
      maxBitrate: 6000,
      recommendedBitrate: 3500,
      supportedResolutions: [
        { width: 1920, height: 1080, fps: 60 },
        { width: 1920, height: 1080, fps: 30 },
        { width: 1280, height: 720, fps: 60 },
        { width: 1280, height: 720, fps: 30 }
      ]
    },
    youtube: {
      ingestUrl: 'rtmp://a.rtmp.youtube.com/live2/',
      maxBitrate: 51000,
      recommendedBitrate: 4500,
      supportedResolutions: [
        { width: 3840, height: 2160, fps: 60 },
        { width: 1920, height: 1080, fps: 60 },
        { width: 1280, height: 720, fps: 60 }
      ]
    },
    instagram: {
      ingestUrl: 'rtmp://live-upload.instagram.com/rtmp/',
      maxBitrate: 4000,
      recommendedBitrate: 2500,
      supportedResolutions: [
        { width: 1080, height: 1920, fps: 30 }, // Vertical
        { width: 1920, height: 1080, fps: 30 }, // Horizontal
        { width: 1080, height: 1080, fps: 30 }  // Square
      ]
    },
    facebook: {
      ingestUrl: 'rtmp://live-api-s.facebook.com:80/rtmp/',
      maxBitrate: 4000,
      recommendedBitrate: 2500,
      supportedResolutions: [
        { width: 1920, height: 1080, fps: 30 },
        { width: 1280, height: 720, fps: 30 }
      ]
    }
  };

  constructor(
    private config: LivePerformanceConfig,
    memoryManager: MemoryManager,
    claudeFlow: ClaudeFlowIntegration
  ) {
    super();
    this.memoryManager = memoryManager;
    this.claudeFlow = claudeFlow;

    this.adaptiveBitrate = {
      enabled: true,
      minBitrate: 1000,
      maxBitrate: 6000,
      targetLatency: 2000,
      adaptationThreshold: 0.1
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Register with memory manager
      await this.memoryManager.store('stream-coordinator-status', {
        initialized: true,
        timestamp: Date.now(),
        activePlatforms: [],
        isStreaming: false
      });

      // Hook into Claude Flow
      await this.claudeFlow.executeHook('pre-task', {
        description: 'Stream coordinator initialized and ready for multi-platform streaming'
      });

      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Add streaming platform configuration
   */
  async addPlatform(platform: Omit<StreamingPlatform, 'isLive' | 'status' | 'viewerCount'>): Promise<string> {
    const config = this.platformConfigs[platform.name];
    if (!config && platform.name !== 'custom') {
      throw new Error(`Unsupported platform: ${platform.name}`);
    }

    const fullPlatform: StreamingPlatform = {
      ...platform,
      isLive: false,
      status: 'offline',
      streamUrl: platform.name !== 'custom' ?
        config.ingestUrl + platform.streamKey :
        platform.streamUrl
    };

    // Validate stream key and URL
    if (!platform.streamKey || !fullPlatform.streamUrl) {
      throw new Error('Stream key and URL are required');
    }

    // Store platform configuration
    await this.memoryManager.store(`stream-platform-${platform.id}`, fullPlatform);

    this.emit('platformAdded', platform.id);
    return platform.id;
  }

  /**
   * Start streaming to specified platforms
   */
  async startStreaming(platformIds: string[], sourceStream: MediaStream): Promise<void> {
    if (this.isStreaming) {
      throw new Error('Already streaming');
    }

    try {
      // Start streams for each platform
      const streamPromises = platformIds.map(async platformId => {
        const platform = await this.memoryManager.retrieve(`stream-platform-${platformId}`);
        if (!platform) {
          throw new Error(`Platform ${platformId} not found`);
        }

        return this.startPlatformStream(platform, sourceStream);
      });

      await Promise.all(streamPromises);

      this.isStreaming = true;

      // Update status in memory
      await this.memoryManager.store('stream-coordinator-status', {
        initialized: true,
        timestamp: Date.now(),
        activePlatforms: platformIds,
        isStreaming: true
      });

      // Notify coordination system
      await this.sendMessage({
        type: 'stream',
        data: { action: 'started', platforms: platformIds },
        priority: 'high'
      });

      this.emit('streamingStarted', platformIds);

    } catch (error) {
      this.isStreaming = false;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Start stream for individual platform
   */
  private async startPlatformStream(platform: StreamingPlatform, sourceStream: MediaStream): Promise<void> {
    try {
      // Create RTMP stream
      const rtmpStream = new RTMPStream(platform, this.adaptiveBitrate);

      // Setup encoding based on platform requirements
      const encoder = this.createEncoder(platform, sourceStream);

      // Connect encoder to RTMP stream
      await rtmpStream.connect(encoder);

      // Store stream reference
      this.streams.set(platform.id, rtmpStream);

      // Update platform status
      platform.status = 'connecting';
      await this.memoryManager.store(`stream-platform-${platform.id}`, platform);

      // Setup event handlers
      rtmpStream.on('connected', async () => {
        platform.status = 'live';
        platform.isLive = true;
        await this.memoryManager.store(`stream-platform-${platform.id}`, platform);
        this.emit('platformConnected', platform.id);
      });

      rtmpStream.on('disconnected', async () => {
        platform.status = 'offline';
        platform.isLive = false;
        await this.memoryManager.store(`stream-platform-${platform.id}`, platform);
        this.emit('platformDisconnected', platform.id);
      });

      rtmpStream.on('error', async (error) => {
        platform.status = 'error';
        platform.error = error.message;
        await this.memoryManager.store(`stream-platform-${platform.id}`, platform);
        this.emit('platformError', { platformId: platform.id, error });
      });

      rtmpStream.on('stats', (stats: StreamStats) => {
        this.handleStreamStats(platform.id, stats);
      });

      // Start the stream
      await rtmpStream.start();

    } catch (error) {
      platform.status = 'error';
      platform.error = error.message;
      await this.memoryManager.store(`stream-platform-${platform.id}`, platform);
      throw error;
    }
  }

  /**
   * Create video encoder for platform
   */
  private createEncoder(platform: StreamingPlatform, sourceStream: MediaStream): MediaRecorder {
    const config = this.platformConfigs[platform.name];
    const maxBitrate = config ? config.maxBitrate : platform.bitrate;

    const options: MediaRecorderOptions = {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: Math.min(platform.bitrate * 1000, maxBitrate * 1000),
      audioBitsPerSecond: 128000
    };

    // Try VP9 if supported
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
      options.mimeType = 'video/webm;codecs=vp9,opus';
    }

    return new MediaRecorder(sourceStream, options);
  }

  /**
   * Handle incoming stream statistics
   */
  private async handleStreamStats(platformId: string, stats: StreamStats): Promise<void> {
    // Store stats in memory
    await this.memoryManager.store(`stream-stats-${platformId}`, {
      ...stats,
      timestamp: Date.now()
    });

    // Adaptive bitrate logic
    if (this.adaptiveBitrate.enabled) {
      await this.adjustBitrate(platformId, stats);
    }

    // Check for issues
    if (stats.droppedFrames > 100 || stats.latency > 5000) {
      await this.sendMessage({
        type: 'stream',
        data: {
          action: 'quality_warning',
          platformId,
          stats
        },
        priority: 'high'
      });
    }

    this.emit('streamStats', { platformId, stats });
  }

  /**
   * Adjust bitrate based on network conditions
   */
  private async adjustBitrate(platformId: string, stats: StreamStats): Promise<void> {
    const platform = await this.memoryManager.retrieve(`stream-platform-${platformId}`);
    if (!platform) return;

    const rtmpStream = this.streams.get(platformId);
    if (!rtmpStream) return;

    let newBitrate = platform.bitrate;

    // Increase bitrate if network can handle it
    if (stats.latency < this.adaptiveBitrate.targetLatency * 0.8 &&
        stats.droppedFrames < 10) {
      newBitrate = Math.min(
        platform.bitrate * 1.1,
        this.adaptiveBitrate.maxBitrate
      );
    }
    // Decrease bitrate if network is struggling
    else if (stats.latency > this.adaptiveBitrate.targetLatency * 1.2 ||
             stats.droppedFrames > 50) {
      newBitrate = Math.max(
        platform.bitrate * 0.9,
        this.adaptiveBitrate.minBitrate
      );
    }

    // Apply change if significant
    if (Math.abs(newBitrate - platform.bitrate) > platform.bitrate * this.adaptiveBitrate.adaptationThreshold) {
      platform.bitrate = newBitrate;
      await this.memoryManager.store(`stream-platform-${platformId}`, platform);
      await rtmpStream.updateBitrate(newBitrate);

      this.emit('bitrateAdjusted', { platformId, oldBitrate: platform.bitrate, newBitrate });
    }
  }

  /**
   * Stop streaming on all platforms
   */
  async stopStreaming(): Promise<void> {
    if (!this.isStreaming) {
      return;
    }

    try {
      // Stop all platform streams
      const stopPromises = Array.from(this.streams.entries()).map(async ([platformId, stream]) => {
        await stream.stop();
        this.streams.delete(platformId);

        // Update platform status
        const platform = await this.memoryManager.retrieve(`stream-platform-${platformId}`);
        if (platform) {
          platform.isLive = false;
          platform.status = 'offline';
          await this.memoryManager.store(`stream-platform-${platformId}`, platform);
        }
      });

      await Promise.all(stopPromises);

      this.isStreaming = false;

      // Update status
      await this.memoryManager.store('stream-coordinator-status', {
        initialized: true,
        timestamp: Date.now(),
        activePlatforms: [],
        isStreaming: false
      });

      // Notify coordination system
      await this.sendMessage({
        type: 'stream',
        data: { action: 'stopped' },
        priority: 'high'
      });

      this.emit('streamingStopped');

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get streaming statistics for all platforms
   */
  async getStreamingStats(): Promise<Record<string, StreamStats>> {
    const stats: Record<string, StreamStats> = {};

    for (const [platformId] of this.streams) {
      const platformStats = await this.memoryManager.retrieve(`stream-stats-${platformId}`);
      if (platformStats) {
        stats[platformId] = platformStats;
      }
    }

    return stats;
  }

  /**
   * Setup WebRTC connection for low-latency streaming
   */
  async setupWebRTCConnection(peerId: string, offer?: RTCSessionDescriptionInit): Promise<WebRTCConnection> {
    const connection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    const dataChannel = connection.createDataChannel('control', {
      ordered: true
    });

    const webrtcConnection: WebRTCConnection = {
      id: peerId,
      peerId,
      connection,
      dataChannel,
      localStream: new MediaStream(),
      remoteStream: new MediaStream(),
      status: 'connecting',
      latency: 0
    };

    // Handle connection state changes
    connection.onconnectionstatechange = () => {
      webrtcConnection.status = connection.connectionState as any;
      this.emit('webrtcStateChanged', { peerId, state: connection.connectionState });
    };

    // Handle incoming stream
    connection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        webrtcConnection.remoteStream.addTrack(track);
      });
      this.emit('webrtcStreamReceived', { peerId, stream: event.streams[0] });
    };

    // Store connection
    this.webrtcConnections.set(peerId, webrtcConnection);

    // Handle offer if provided
    if (offer) {
      await connection.setRemoteDescription(offer);
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
    }

    return webrtcConnection;
  }

  /**
   * Send message to coordination system
   */
  private async sendMessage(message: Omit<LiveMixerMessage, 'timestamp'>): Promise<void> {
    const fullMessage: LiveMixerMessage = {
      ...message,
      timestamp: Date.now()
    };

    await this.memoryManager.store(`stream-message-${Date.now()}`, fullMessage);

    // Notify Claude Flow for high priority messages
    if (message.priority === 'high' || message.priority === 'critical') {
      await this.claudeFlow.executeHook('notify', {
        message: `Stream coordinator: ${message.type} - ${JSON.stringify(message.data)}`
      });
    }

    this.emit('messageSent', fullMessage);
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    if (this.isStreaming) {
      await this.stopStreaming();
    }

    // Close WebRTC connections
    this.webrtcConnections.forEach(conn => {
      conn.connection.close();
    });
    this.webrtcConnections.clear();

    await this.claudeFlow.executeHook('post-task', {
      taskId: 'stream-coordinator-session'
    });
  }
}

/**
 * RTMP Stream handler for individual platform
 */
class RTMPStream extends EventEmitter {
  private mediaRecorder: MediaRecorder | null = null;
  private websocket: WebSocket | null = null;
  private isConnected = false;

  constructor(
    private platform: StreamingPlatform,
    private adaptiveConfig: AdaptiveBitrateConfig
  ) {
    super();
  }

  async connect(encoder: MediaRecorder): Promise<void> {
    this.mediaRecorder = encoder;

    // Setup encoder event handlers
    encoder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.websocket) {
        this.websocket.send(event.data);
      }
    };

    encoder.onstart = () => {
      this.isConnected = true;
      this.emit('connected');
    };

    encoder.onerror = (error) => {
      this.emit('error', error);
    };

    encoder.onstop = () => {
      this.isConnected = false;
      this.emit('disconnected');
    };
  }

  async start(): Promise<void> {
    if (!this.mediaRecorder) {
      throw new Error('No encoder connected');
    }

    // For this demo, we'll simulate RTMP connection with WebSocket
    // In production, you'd use a proper RTMP library or service
    try {
      this.mediaRecorder.start(100); // 100ms chunks for low latency
      this.simulateStats();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.websocket) {
      this.websocket.close();
    }

    this.isConnected = false;
    this.emit('disconnected');
  }

  async updateBitrate(newBitrate: number): Promise<void> {
    // In a real implementation, this would dynamically adjust the encoder
    // For now, we'll just emit an event
    this.emit('bitrateUpdated', { oldBitrate: this.platform.bitrate, newBitrate });
  }

  private simulateStats(): void {
    // Simulate streaming statistics
    const interval = setInterval(() => {
      if (!this.isConnected) {
        clearInterval(interval);
        return;
      }

      const stats = {
        bitrate: this.platform.bitrate,
        frameRate: this.platform.resolution.fps,
        droppedFrames: Math.random() * 50,
        bandwidth: this.platform.bitrate * 1.2,
        latency: 1000 + Math.random() * 2000,
        viewers: Math.floor(Math.random() * 1000)
      };

      this.emit('stats', stats);
    }, 1000);
  }
}