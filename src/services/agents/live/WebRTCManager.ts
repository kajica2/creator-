/**
 * WebRTC Manager Agent
 *
 * Manages low-latency peer-to-peer connections for live streaming,
 * real-time collaboration, and interactive broadcasting.
 */

import { EventEmitter } from 'events';
import {
  WebRTCConnection,
  LivePerformanceConfig,
  LiveMixerMessage
} from '../../../../types';
import { MemoryManager } from '../MemoryManager';
import { ClaudeFlowIntegration } from '../ClaudeFlowIntegration';

interface PeerConnectionConfig {
  iceServers: RTCIceServer[];
  iceTransportPolicy: RTCIceTransportPolicy;
  bundlePolicy: RTCBundlePolicy;
  rtcpMuxPolicy: RTCRtcpMuxPolicy;
}

interface DataChannelConfig {
  ordered: boolean;
  maxRetransmits?: number;
  maxPacketLifeTime?: number;
  protocol?: string;
}

interface StreamingChannel {
  id: string;
  peerId: string;
  type: 'audio' | 'video' | 'screen' | 'data';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  enabled: boolean;
  bitrate: number;
  latency: number;
}

export class WebRTCManager extends EventEmitter {
  private connections: Map<string, WebRTCConnection> = new Map();
  private streamingChannels: Map<string, StreamingChannel> = new Map();
  private localStreams: Map<string, MediaStream> = new Map();
  private signaling: SignalingChannel;
  private memoryManager: MemoryManager;
  private claudeFlow: ClaudeFlowIntegration;

  private defaultPeerConfig: PeerConnectionConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ],
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };

  constructor(
    private config: LivePerformanceConfig,
    memoryManager: MemoryManager,
    claudeFlow: ClaudeFlowIntegration,
    signalingUrl?: string
  ) {
    super();
    this.memoryManager = memoryManager;
    this.claudeFlow = claudeFlow;
    this.signaling = new SignalingChannel(signalingUrl);
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Setup signaling
      await this.signaling.connect();
      this.setupSignalingHandlers();

      // Register with memory manager
      await this.memoryManager.store('webrtc-manager-status', {
        initialized: true,
        timestamp: Date.now(),
        connections: 0,
        channels: 0
      });

      // Hook into Claude Flow
      await this.claudeFlow.executeHook('pre-task', {
        description: 'WebRTC manager initialized for low-latency peer connections'
      });

      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create peer connection
   */
  async createConnection(
    peerId: string,
    options: {
      iceServers?: RTCIceServer[];
      offerOptions?: RTCOfferOptions;
      dataChannelConfig?: DataChannelConfig;
    } = {}
  ): Promise<WebRTCConnection> {
    try {
      const connectionConfig: RTCConfiguration = {
        ...this.defaultPeerConfig,
        iceServers: options.iceServers || this.defaultPeerConfig.iceServers
      };

      const peerConnection = new RTCPeerConnection(connectionConfig);

      // Create data channel
      const dataChannelConfig: DataChannelConfig = {
        ordered: true,
        ...options.dataChannelConfig
      };

      const dataChannel = peerConnection.createDataChannel('control', dataChannelConfig);

      const connection: WebRTCConnection = {
        id: peerId,
        peerId,
        connection: peerConnection,
        dataChannel,
        localStream: new MediaStream(),
        remoteStream: new MediaStream(),
        status: 'connecting',
        latency: 0
      };

      // Setup connection event handlers
      this.setupConnectionHandlers(connection);

      // Store connection
      this.connections.set(peerId, connection);

      // Store in memory
      await this.memoryManager.store(`webrtc-connection-${peerId}`, {
        peerId,
        status: 'connecting',
        created: Date.now()
      });

      this.emit('connectionCreated', connection);
      return connection;

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(connection: WebRTCConnection): void {
    const { peerConnection, dataChannel } = connection;

    // Connection state changes
    peerConnection.onconnectionstatechange = () => {
      connection.status = peerConnection.connectionState as any;
      this.emit('connectionStateChanged', {
        peerId: connection.peerId,
        state: peerConnection.connectionState
      });

      // Update memory
      this.memoryManager.store(`webrtc-connection-${connection.peerId}`, {
        peerId: connection.peerId,
        status: connection.status,
        updated: Date.now()
      });
    };

    // ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.sendIceCandidate(connection.peerId, event.candidate);
      }
    };

    // Remote stream
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        connection.remoteStream.addTrack(track);
      });
      this.emit('remoteStream', {
        peerId: connection.peerId,
        stream: event.streams[0]
      });
    };

    // Data channel
    dataChannel.onopen = () => {
      this.emit('dataChannelOpen', connection.peerId);
    };

    dataChannel.onmessage = (event) => {
      this.handleDataChannelMessage(connection.peerId, event.data);
    };

    dataChannel.onerror = (error) => {
      this.emit('dataChannelError', { peerId: connection.peerId, error });
    };

    // Ice connection state
    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === 'connected') {
        this.startLatencyMonitoring(connection);
      }
    };

    // Incoming data channel
    peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (msgEvent) => {
        this.handleDataChannelMessage(connection.peerId, msgEvent.data);
      };
    };
  }

  /**
   * Add local stream to connection
   */
  async addStream(peerId: string, stream: MediaStream, channelType: 'audio' | 'video' | 'screen' = 'video'): Promise<void> {
    const connection = this.connections.get(peerId);
    if (!connection) {
      throw new Error(`Connection not found: ${peerId}`);
    }

    // Add tracks to connection
    stream.getTracks().forEach(track => {
      connection.connection.addTrack(track, stream);
      connection.localStream.addTrack(track);
    });

    // Create streaming channel
    const channelId = `${peerId}_${channelType}_${Date.now()}`;
    const streamingChannel: StreamingChannel = {
      id: channelId,
      peerId,
      type: channelType,
      quality: 'high',
      enabled: true,
      bitrate: this.getBitrateForQuality('high', channelType),
      latency: 0
    };

    this.streamingChannels.set(channelId, streamingChannel);
    this.localStreams.set(channelId, stream);

    // Configure encoding parameters
    await this.configureEncoding(connection.connection, streamingChannel);

    this.emit('streamAdded', { peerId, channelId, stream });
  }

  /**
   * Configure encoding parameters for optimal streaming
   */
  private async configureEncoding(peerConnection: RTCPeerConnection, channel: StreamingChannel): Promise<void> {
    const senders = peerConnection.getSenders();

    for (const sender of senders) {
      if (!sender.track) continue;

      const params = sender.getParameters();
      if (!params.encodings) params.encodings = [{}];

      if (channel.type === 'video' || channel.type === 'screen') {
        // Video encoding parameters
        params.encodings[0].maxBitrate = channel.bitrate * 1000;
        params.encodings[0].maxFramerate = channel.quality === 'ultra' ? 60 : 30;
        params.encodings[0].degradationPreference = 'maintain-framerate';
        params.encodings[0].scaleResolutionDownBy = channel.quality === 'low' ? 2 : 1;
      } else if (channel.type === 'audio') {
        // Audio encoding parameters
        params.encodings[0].maxBitrate = Math.min(channel.bitrate * 1000, 128000);
      }

      await sender.setParameters(params);
    }
  }

  /**
   * Create offer for peer connection
   */
  async createOffer(peerId: string, options?: RTCOfferOptions): Promise<RTCSessionDescription> {
    const connection = this.connections.get(peerId);
    if (!connection) {
      throw new Error(`Connection not found: ${peerId}`);
    }

    try {
      const offer = await connection.connection.createOffer(options);
      await connection.connection.setLocalDescription(offer);

      // Send offer via signaling
      this.signaling.sendOffer(peerId, offer);

      return offer;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create answer for peer connection
   */
  async createAnswer(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescription> {
    const connection = this.connections.get(peerId);
    if (!connection) {
      throw new Error(`Connection not found: ${peerId}`);
    }

    try {
      await connection.connection.setRemoteDescription(offer);
      const answer = await connection.connection.createAnswer();
      await connection.connection.setLocalDescription(answer);

      // Send answer via signaling
      this.signaling.sendAnswer(peerId, answer);

      return answer;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Handle remote answer
   */
  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const connection = this.connections.get(peerId);
    if (!connection) {
      throw new Error(`Connection not found: ${peerId}`);
    }

    try {
      await connection.connection.setRemoteDescription(answer);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Handle ICE candidate
   */
  async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const connection = this.connections.get(peerId);
    if (!connection) {
      throw new Error(`Connection not found: ${peerId}`);
    }

    try {
      await connection.connection.addIceCandidate(candidate);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Send data via data channel
   */
  async sendData(peerId: string, data: any): Promise<void> {
    const connection = this.connections.get(peerId);
    if (!connection || connection.dataChannel.readyState !== 'open') {
      throw new Error(`Data channel not ready for peer: ${peerId}`);
    }

    const message = JSON.stringify(data);
    connection.dataChannel.send(message);
  }

  /**
   * Handle data channel messages
   */
  private handleDataChannelMessage(peerId: string, data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'latency_ping':
          this.handleLatencyPing(peerId, message.timestamp);
          break;

        case 'latency_pong':
          this.handleLatencyPong(peerId, message.timestamp);
          break;

        case 'quality_change':
          this.handleQualityChange(peerId, message.quality);
          break;

        case 'sync_time':
          this.handleTimeSync(peerId, message);
          break;

        default:
          this.emit('dataMessage', { peerId, message });
      }
    } catch (error) {
      console.error('Error parsing data channel message:', error);
    }
  }

  /**
   * Start latency monitoring
   */
  private startLatencyMonitoring(connection: WebRTCConnection): void {
    const measureLatency = () => {
      if (connection.dataChannel.readyState === 'open') {
        const timestamp = Date.now();
        this.sendData(connection.peerId, {
          type: 'latency_ping',
          timestamp
        });
      }
    };

    // Measure latency every 5 seconds
    setInterval(measureLatency, 5000);
  }

  /**
   * Handle latency ping
   */
  private async handleLatencyPing(peerId: string, timestamp: number): Promise<void> {
    await this.sendData(peerId, {
      type: 'latency_pong',
      timestamp
    });
  }

  /**
   * Handle latency pong
   */
  private handleLatencyPong(peerId: string, timestamp: number): void {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.latency = Date.now() - timestamp;
      this.emit('latencyUpdate', { peerId, latency: connection.latency });
    }
  }

  /**
   * Handle quality change request
   */
  private async handleQualityChange(peerId: string, quality: string): Promise<void> {
    const channels = Array.from(this.streamingChannels.values()).filter(c => c.peerId === peerId);

    for (const channel of channels) {
      channel.quality = quality as 'low' | 'medium' | 'high' | 'ultra';
      channel.bitrate = this.getBitrateForQuality(channel.quality, channel.type);

      const connection = this.connections.get(peerId);
      if (connection) {
        await this.configureEncoding(connection.connection, channel);
      }
    }
  }

  /**
   * Handle time synchronization
   */
  private handleTimeSync(peerId: string, message: any): void {
    // Implement time synchronization for coordinated streaming
    this.emit('timeSync', { peerId, message });
  }

  /**
   * Get bitrate for quality level
   */
  private getBitrateForQuality(quality: string, type: string): number {
    const bitrateMap = {
      audio: { low: 64, medium: 128, high: 256, ultra: 320 },
      video: { low: 500, medium: 1500, high: 3000, ultra: 6000 },
      screen: { low: 1000, medium: 2000, high: 4000, ultra: 8000 }
    };

    return bitrateMap[type]?.[quality] || bitrateMap.video.medium;
  }

  /**
   * Adjust stream quality based on network conditions
   */
  async adjustStreamQuality(peerId: string, quality: 'low' | 'medium' | 'high' | 'ultra'): Promise<void> {
    const channels = Array.from(this.streamingChannels.values()).filter(c => c.peerId === peerId);

    for (const channel of channels) {
      channel.quality = quality;
      channel.bitrate = this.getBitrateForQuality(quality, channel.type);

      const connection = this.connections.get(peerId);
      if (connection) {
        await this.configureEncoding(connection.connection, channel);
      }
    }

    // Notify peer of quality change
    await this.sendData(peerId, {
      type: 'quality_change',
      quality
    });

    this.emit('qualityAdjusted', { peerId, quality });
  }

  /**
   * Setup signaling handlers
   */
  private setupSignalingHandlers(): void {
    this.signaling.on('offer', (data) => {
      this.emit('offerReceived', data);
    });

    this.signaling.on('answer', (data) => {
      this.handleAnswer(data.peerId, data.answer);
    });

    this.signaling.on('iceCandidate', (data) => {
      this.handleIceCandidate(data.peerId, data.candidate);
    });

    this.signaling.on('peerConnected', (peerId) => {
      this.emit('peerConnected', peerId);
    });

    this.signaling.on('peerDisconnected', (peerId) => {
      this.handlePeerDisconnected(peerId);
    });
  }

  /**
   * Handle peer disconnection
   */
  private async handlePeerDisconnected(peerId: string): Promise<void> {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.connection.close();
      this.connections.delete(peerId);
    }

    // Remove associated channels
    const channelsToRemove = Array.from(this.streamingChannels.entries())
      .filter(([_, channel]) => channel.peerId === peerId)
      .map(([id]) => id);

    channelsToRemove.forEach(channelId => {
      this.streamingChannels.delete(channelId);
      this.localStreams.delete(channelId);
    });

    await this.memoryManager.remove(`webrtc-connection-${peerId}`);
    this.emit('peerDisconnected', peerId);
  }

  /**
   * Get connection statistics
   */
  async getConnectionStats(peerId: string): Promise<RTCStatsReport | null> {
    const connection = this.connections.get(peerId);
    if (!connection) {
      return null;
    }

    return await connection.connection.getStats();
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    // Close all connections
    this.connections.forEach((connection, peerId) => {
      connection.connection.close();
    });

    this.connections.clear();
    this.streamingChannels.clear();
    this.localStreams.clear();

    // Disconnect signaling
    this.signaling.disconnect();

    await this.claudeFlow.executeHook('post-task', {
      taskId: 'webrtc-manager-session'
    });
  }
}

/**
 * Signaling channel for WebRTC coordination
 */
class SignalingChannel extends EventEmitter {
  private websocket: WebSocket | null = null;
  private isConnected = false;

  constructor(private url?: string) {
    super();
  }

  async connect(): Promise<void> {
    if (!this.url) {
      // Use default signaling server or create a simple implementation
      console.warn('No signaling URL provided, using mock signaling');
      this.isConnected = true;
      return;
    }

    return new Promise((resolve, reject) => {
      this.websocket = new WebSocket(this.url!);

      this.websocket.onopen = () => {
        this.isConnected = true;
        resolve();
      };

      this.websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing signaling message:', error);
        }
      };

      this.websocket.onerror = (error) => {
        reject(error);
      };

      this.websocket.onclose = () => {
        this.isConnected = false;
        this.emit('disconnected');
      };
    });
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'offer':
        this.emit('offer', { peerId: message.peerId, offer: message.offer });
        break;
      case 'answer':
        this.emit('answer', { peerId: message.peerId, answer: message.answer });
        break;
      case 'ice-candidate':
        this.emit('iceCandidate', { peerId: message.peerId, candidate: message.candidate });
        break;
      case 'peer-connected':
        this.emit('peerConnected', message.peerId);
        break;
      case 'peer-disconnected':
        this.emit('peerDisconnected', message.peerId);
        break;
    }
  }

  sendOffer(peerId: string, offer: RTCSessionDescription): void {
    this.send({
      type: 'offer',
      peerId,
      offer
    });
  }

  sendAnswer(peerId: string, answer: RTCSessionDescription): void {
    this.send({
      type: 'answer',
      peerId,
      answer
    });
  }

  sendIceCandidate(peerId: string, candidate: RTCIceCandidate): void {
    this.send({
      type: 'ice-candidate',
      peerId,
      candidate
    });
  }

  private send(message: any): void {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
    }
  }
}