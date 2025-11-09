import {
  Agent,
  AgentTask,
  AgentEvent,
  AgentEventType,
  TaskPriority,
  CoordinationPattern
} from '../../types/agents';
import { memoryManager } from './MemoryManager';
import { agentCoordinator } from './AgentCoordinator';
import { claudeFlowIntegration } from './ClaudeFlowIntegration';

/**
 * CommunicationProtocol defines how agents communicate and coordinate with each other
 * Implements various coordination patterns and messaging strategies
 */
export class CommunicationProtocol {
  private static instance: CommunicationProtocol;
  private messageQueue: Map<string, AgentMessage[]> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // topic -> agentIds
  private coordinationSessions: Map<string, CoordinationSession> = new Map();
  private protocolHandlers: Map<string, ProtocolHandler> = new Map();

  public static getInstance(): CommunicationProtocol {
    if (!CommunicationProtocol.instance) {
      CommunicationProtocol.instance = new CommunicationProtocol();
    }
    return CommunicationProtocol.instance;
  }

  /**
   * Initialize communication protocol
   */
  public async initialize(): Promise<void> {
    console.log('Initializing Communication Protocol...');

    // Register protocol handlers
    this.registerProtocolHandlers();

    // Initialize message queues
    this.initializeMessageQueues();

    // Setup coordination patterns
    this.setupCoordinationPatterns();

    // Start message processing
    this.startMessageProcessing();

    console.log('Communication Protocol initialized successfully');
  }

  /**
   * Register different protocol handlers
   */
  private registerProtocolHandlers(): void {
    // Direct messaging
    this.protocolHandlers.set('direct', {
      send: this.sendDirectMessage.bind(this),
      receive: this.receiveDirectMessage.bind(this),
      validate: this.validateDirectMessage.bind(this)
    });

    // Broadcast messaging
    this.protocolHandlers.set('broadcast', {
      send: this.sendBroadcastMessage.bind(this),
      receive: this.receiveBroadcastMessage.bind(this),
      validate: this.validateBroadcastMessage.bind(this)
    });

    // Publish-Subscribe messaging
    this.protocolHandlers.set('pubsub', {
      send: this.sendPubSubMessage.bind(this),
      receive: this.receivePubSubMessage.bind(this),
      validate: this.validatePubSubMessage.bind(this)
    });

    // Consensus messaging
    this.protocolHandlers.set('consensus', {
      send: this.sendConsensusMessage.bind(this),
      receive: this.receiveConsensusMessage.bind(this),
      validate: this.validateConsensusMessage.bind(this)
    });

    // Pipeline messaging
    this.protocolHandlers.set('pipeline', {
      send: this.sendPipelineMessage.bind(this),
      receive: this.receivePipelineMessage.bind(this),
      validate: this.validatePipelineMessage.bind(this)
    });
  }

  /**
   * Initialize message queues for all active agents
   */
  private initializeMessageQueues(): void {
    // This would be populated with actual agent IDs
    const agentIds = [
      'video-gen-001', 'video-edit-001', 'video-fx-001',
      'audio-comp-001', 'sound-fx-001', 'voice-synth-001',
      'live-mixer-001', 'stream-coord-001', 'rec-mgr-001',
      'content-analyzer-001', 'trend-monitor-001', 'quality-checker-001'
    ];

    for (const agentId of agentIds) {
      this.messageQueue.set(agentId, []);
    }
  }

  /**
   * Setup coordination patterns
   */
  private setupCoordinationPatterns(): void {
    // Video generation pipeline coordination
    this.setupPipelineCoordination([
      'video-gen-001', 'video-edit-001', 'video-fx-001'
    ], 'video-generation-pipeline');

    // Audio generation mesh coordination
    this.setupMeshCoordination([
      'audio-comp-001', 'sound-fx-001', 'voice-synth-001'
    ], 'audio-generation-mesh');

    // Live mixer hierarchical coordination
    this.setupHierarchicalCoordination([
      'stream-coord-001', 'live-mixer-001', 'rec-mgr-001'
    ], 'live-mixer-hierarchy');

    // Analysis consensus coordination
    this.setupConsensusCoordination([
      'content-analyzer-001', 'trend-monitor-001', 'quality-checker-001'
    ], 'analysis-consensus');
  }

  /**
   * Send message between agents
   */
  public async sendMessage(
    fromAgentId: string,
    toAgentId: string | string[],
    messageType: MessageType,
    payload: any,
    protocol: string = 'direct'
  ): Promise<void> {
    const message: AgentMessage = {
      id: this.generateMessageId(),
      fromAgentId,
      toAgentId: Array.isArray(toAgentId) ? toAgentId : [toAgentId],
      type: messageType,
      payload,
      protocol,
      timestamp: new Date(),
      priority: this.determinePriority(messageType),
      correlationId: this.generateCorrelationId(),
      ttl: this.calculateTTL(messageType)
    };

    const handler = this.protocolHandlers.get(protocol);
    if (!handler) {
      throw new Error(`Unknown protocol: ${protocol}`);
    }

    // Validate message
    if (!handler.validate(message)) {
      throw new Error(`Message validation failed for protocol: ${protocol}`);
    }

    // Send message
    await handler.send(message);

    // Store in memory for coordination tracking
    await memoryManager.store(
      `communication/sent/${message.id}`,
      message,
      fromAgentId,
      'global'
    );

    console.log(`Message sent: ${messageType} from ${fromAgentId} to ${toAgentId}`);
  }

  /**
   * Subscribe to message topic
   */
  public async subscribe(agentId: string, topic: string): Promise<void> {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }

    this.subscriptions.get(topic)!.add(agentId);

    await memoryManager.store(
      `communication/subscription/${agentId}/${topic}`,
      { agentId, topic, timestamp: new Date() },
      agentId,
      'private'
    );

    console.log(`Agent ${agentId} subscribed to topic: ${topic}`);
  }

  /**
   * Unsubscribe from message topic
   */
  public async unsubscribe(agentId: string, topic: string): Promise<void> {
    const subscribers = this.subscriptions.get(topic);
    if (subscribers) {
      subscribers.delete(agentId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(topic);
      }
    }

    console.log(`Agent ${agentId} unsubscribed from topic: ${topic}`);
  }

  /**
   * Start coordination session
   */
  public async startCoordination(
    sessionId: string,
    pattern: CoordinationPattern,
    participants: string[],
    objective: string,
    metadata?: any
  ): Promise<CoordinationSession> {
    const session: CoordinationSession = {
      id: sessionId,
      pattern,
      participants,
      objective,
      status: 'active',
      startTime: new Date(),
      messages: [],
      decisions: [],
      metadata: metadata || {}
    };

    this.coordinationSessions.set(sessionId, session);

    // Notify all participants
    for (const participantId of participants) {
      await this.sendMessage(
        'coordinator',
        participantId,
        'coordination-start',
        {
          sessionId,
          pattern,
          objective,
          participants
        },
        'direct'
      );
    }

    // Store session in memory
    await memoryManager.store(
      `coordination/session/${sessionId}`,
      session,
      'coordinator',
      'global'
    );

    // Trigger Claude-Flow coordination
    await claudeFlowIntegration.triggerCoordination(
      pattern,
      participants,
      { objective, sessionId }
    );

    console.log(`Coordination session started: ${sessionId} with pattern: ${pattern}`);
    return session;
  }

  /**
   * Request consensus from agents
   */
  public async requestConsensus(
    sessionId: string,
    proposal: ConsensusProposal,
    participants: string[],
    threshold: number = 0.7
  ): Promise<ConsensusResult> {
    const consensusRequest: ConsensusRequest = {
      id: this.generateMessageId(),
      sessionId,
      proposal,
      threshold,
      deadline: new Date(Date.now() + 30000), // 30 seconds
      votes: new Map(),
      status: 'pending'
    };

    // Send consensus request to all participants
    for (const participantId of participants) {
      await this.sendMessage(
        'coordinator',
        participantId,
        'consensus-request',
        consensusRequest,
        'consensus'
      );
    }

    // Wait for responses (simplified - would use proper async handling)
    return new Promise((resolve) => {
      const checkConsensus = setInterval(async () => {
        const result = await this.checkConsensusResult(consensusRequest);
        if (result.status !== 'pending') {
          clearInterval(checkConsensus);
          resolve(result);
        }
      }, 1000);

      // Timeout after deadline
      setTimeout(() => {
        clearInterval(checkConsensus);
        resolve({
          proposal: proposal.id,
          status: 'timeout',
          votes: consensusRequest.votes,
          decision: 'rejected',
          timestamp: new Date()
        });
      }, 35000);
    });
  }

  /**
   * Protocol-specific message handlers
   */
  private async sendDirectMessage(message: AgentMessage): Promise<void> {
    for (const recipientId of message.toAgentId) {
      if (!this.messageQueue.has(recipientId)) {
        this.messageQueue.set(recipientId, []);
      }

      this.messageQueue.get(recipientId)!.push(message);
    }
  }

  private async receiveDirectMessage(agentId: string): Promise<AgentMessage[]> {
    const messages = this.messageQueue.get(agentId) || [];
    this.messageQueue.set(agentId, []);
    return messages;
  }

  private validateDirectMessage(message: AgentMessage): boolean {
    return message.toAgentId.length === 1;
  }

  private async sendBroadcastMessage(message: AgentMessage): Promise<void> {
    for (const [agentId, queue] of this.messageQueue.entries()) {
      if (agentId !== message.fromAgentId) {
        queue.push(message);
      }
    }
  }

  private async receiveBroadcastMessage(agentId: string): Promise<AgentMessage[]> {
    const messages = this.messageQueue.get(agentId) || [];
    const broadcastMessages = messages.filter(m => m.protocol === 'broadcast');
    this.messageQueue.set(agentId, messages.filter(m => m.protocol !== 'broadcast'));
    return broadcastMessages;
  }

  private validateBroadcastMessage(message: AgentMessage): boolean {
    return message.toAgentId.length === 0 || message.toAgentId.includes('*');
  }

  private async sendPubSubMessage(message: AgentMessage): Promise<void> {
    const topic = message.payload.topic;
    if (!topic) return;

    const subscribers = this.subscriptions.get(topic);
    if (!subscribers) return;

    for (const subscriberId of subscribers) {
      if (!this.messageQueue.has(subscriberId)) {
        this.messageQueue.set(subscriberId, []);
      }

      this.messageQueue.get(subscriberId)!.push(message);
    }
  }

  private async receivePubSubMessage(agentId: string): Promise<AgentMessage[]> {
    const messages = this.messageQueue.get(agentId) || [];
    const pubsubMessages = messages.filter(m => m.protocol === 'pubsub');
    this.messageQueue.set(agentId, messages.filter(m => m.protocol !== 'pubsub'));
    return pubsubMessages;
  }

  private validatePubSubMessage(message: AgentMessage): boolean {
    return message.payload && message.payload.topic;
  }

  private async sendConsensusMessage(message: AgentMessage): Promise<void> {
    // Store consensus message for processing
    await memoryManager.store(
      `consensus/${message.payload.sessionId}/${message.id}`,
      message,
      message.fromAgentId,
      'global'
    );

    // Route to participants
    for (const recipientId of message.toAgentId) {
      if (!this.messageQueue.has(recipientId)) {
        this.messageQueue.set(recipientId, []);
      }

      this.messageQueue.get(recipientId)!.push(message);
    }
  }

  private async receiveConsensusMessage(agentId: string): Promise<AgentMessage[]> {
    const messages = this.messageQueue.get(agentId) || [];
    const consensusMessages = messages.filter(m => m.protocol === 'consensus');
    this.messageQueue.set(agentId, messages.filter(m => m.protocol !== 'consensus'));
    return consensusMessages;
  }

  private validateConsensusMessage(message: AgentMessage): boolean {
    return message.payload && (message.payload.sessionId || message.payload.vote !== undefined);
  }

  private async sendPipelineMessage(message: AgentMessage): Promise<void> {
    // Pipeline messages are sent in sequence
    const pipelineId = message.payload.pipelineId;
    const stage = message.payload.stage;

    // Store pipeline state
    await memoryManager.store(
      `pipeline/${pipelineId}/stage/${stage}`,
      {
        message,
        timestamp: new Date(),
        status: 'processing'
      },
      message.fromAgentId,
      'global'
    );

    // Send to next stage agent
    for (const recipientId of message.toAgentId) {
      if (!this.messageQueue.has(recipientId)) {
        this.messageQueue.set(recipientId, []);
      }

      this.messageQueue.get(recipientId)!.push(message);
    }
  }

  private async receivePipelineMessage(agentId: string): Promise<AgentMessage[]> {
    const messages = this.messageQueue.get(agentId) || [];
    const pipelineMessages = messages.filter(m => m.protocol === 'pipeline');
    this.messageQueue.set(agentId, messages.filter(m => m.protocol !== 'pipeline'));
    return pipelineMessages;
  }

  private validatePipelineMessage(message: AgentMessage): boolean {
    return message.payload && message.payload.pipelineId && message.payload.stage !== undefined;
  }

  /**
   * Coordination pattern setup methods
   */
  private async setupPipelineCoordination(agentIds: string[], pipelineId: string): Promise<void> {
    const session = await this.startCoordination(
      pipelineId,
      'pipeline',
      agentIds,
      'Sequential processing pipeline'
    );

    // Setup pipeline stages
    for (let i = 0; i < agentIds.length; i++) {
      await memoryManager.store(
        `pipeline/${pipelineId}/agent/${agentIds[i]}/stage`,
        i,
        'coordinator',
        'global'
      );
    }
  }

  private async setupMeshCoordination(agentIds: string[], meshId: string): Promise<void> {
    const session = await this.startCoordination(
      meshId,
      'mesh',
      agentIds,
      'Mesh network coordination'
    );

    // Subscribe all agents to mesh topics
    for (const agentId of agentIds) {
      await this.subscribe(agentId, `mesh.${meshId}.coordination`);
      await this.subscribe(agentId, `mesh.${meshId}.resource-sharing`);
    }
  }

  private async setupHierarchicalCoordination(agentIds: string[], hierarchyId: string): Promise<void> {
    const session = await this.startCoordination(
      hierarchyId,
      'hierarchical',
      agentIds,
      'Hierarchical coordination'
    );

    // Setup hierarchy with first agent as coordinator
    const coordinatorId = agentIds[0];
    const subordinates = agentIds.slice(1);

    await memoryManager.store(
      `hierarchy/${hierarchyId}/coordinator`,
      coordinatorId,
      'coordinator',
      'global'
    );

    await memoryManager.store(
      `hierarchy/${hierarchyId}/subordinates`,
      subordinates,
      'coordinator',
      'global'
    );
  }

  private async setupConsensusCoordination(agentIds: string[], consensusId: string): Promise<void> {
    const session = await this.startCoordination(
      consensusId,
      'consensus',
      agentIds,
      'Consensus-based decision making'
    );

    // Setup voting configuration
    await memoryManager.store(
      `consensus/${consensusId}/threshold`,
      0.7, // 70% agreement required
      'coordinator',
      'global'
    );

    await memoryManager.store(
      `consensus/${consensusId}/participants`,
      agentIds,
      'coordinator',
      'global'
    );
  }

  /**
   * Message processing
   */
  private startMessageProcessing(): void {
    setInterval(() => {
      this.processMessages();
    }, 1000); // Process messages every second
  }

  private async processMessages(): Promise<void> {
    for (const [agentId] of this.messageQueue.entries()) {
      await this.processAgentMessages(agentId);
    }
  }

  private async processAgentMessages(agentId: string): Promise<void> {
    const messages = this.messageQueue.get(agentId) || [];
    if (messages.length === 0) return;

    // Sort by priority and timestamp
    messages.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    // Process messages
    for (const message of messages) {
      try {
        await this.handleMessage(agentId, message);
      } catch (error) {
        console.error(`Failed to process message for ${agentId}:`, error);
      }
    }

    // Clear processed messages
    this.messageQueue.set(agentId, []);
  }

  private async handleMessage(agentId: string, message: AgentMessage): Promise<void> {
    console.log(`Processing message for ${agentId}: ${message.type}`);

    // Store received message in memory
    await memoryManager.store(
      `communication/received/${agentId}/${message.id}`,
      message,
      agentId,
      'private'
    );

    // Handle message based on type
    switch (message.type) {
      case 'task-assignment':
        await this.handleTaskAssignment(agentId, message);
        break;
      case 'task-result':
        await this.handleTaskResult(agentId, message);
        break;
      case 'coordination-start':
        await this.handleCoordinationStart(agentId, message);
        break;
      case 'consensus-request':
        await this.handleConsensusRequest(agentId, message);
        break;
      case 'resource-request':
        await this.handleResourceRequest(agentId, message);
        break;
      case 'status-update':
        await this.handleStatusUpdate(agentId, message);
        break;
      case 'pipeline-data':
        await this.handlePipelineData(agentId, message);
        break;
      default:
        console.log(`Unhandled message type: ${message.type}`);
    }
  }

  private async handleTaskAssignment(agentId: string, message: AgentMessage): Promise<void> {
    // Forward to agent coordinator
    const task = message.payload.task;
    if (task) {
      await agentCoordinator.assignTask(task);
    }
  }

  private async handleTaskResult(agentId: string, message: AgentMessage): Promise<void> {
    // Store task result and notify interested parties
    const result = message.payload.result;
    const taskId = message.payload.taskId;

    await memoryManager.store(
      `task/${taskId}/result`,
      result,
      agentId,
      'global'
    );
  }

  private async handleCoordinationStart(agentId: string, message: AgentMessage): Promise<void> {
    // Agent joins coordination session
    const sessionId = message.payload.sessionId;

    await memoryManager.store(
      `coordination/participant/${agentId}/${sessionId}`,
      {
        joined: new Date(),
        status: 'active'
      },
      agentId,
      'global'
    );
  }

  private async handleConsensusRequest(agentId: string, message: AgentMessage): Promise<void> {
    // Process consensus request and generate vote
    const request = message.payload as ConsensusRequest;
    const vote = await this.generateAgentVote(agentId, request);

    // Send vote back
    await this.sendMessage(
      agentId,
      'coordinator',
      'consensus-vote',
      {
        requestId: request.id,
        vote,
        agentId,
        timestamp: new Date()
      },
      'consensus'
    );
  }

  private async handleResourceRequest(agentId: string, message: AgentMessage): Promise<void> {
    // Handle resource allocation requests
    const resourceType = message.payload.resourceType;
    const amount = message.payload.amount;

    console.log(`Resource request from ${agentId}: ${amount} ${resourceType}`);
  }

  private async handleStatusUpdate(agentId: string, message: AgentMessage): Promise<void> {
    // Update agent status
    const status = message.payload.status;

    await memoryManager.store(
      `agent/${agentId}/status`,
      {
        status,
        timestamp: new Date(),
        source: message.fromAgentId
      },
      agentId,
      'global'
    );
  }

  private async handlePipelineData(agentId: string, message: AgentMessage): Promise<void> {
    // Process pipeline data and forward to next stage if needed
    const pipelineId = message.payload.pipelineId;
    const stage = message.payload.stage;
    const data = message.payload.data;

    // Store stage data
    await memoryManager.store(
      `pipeline/${pipelineId}/data/stage/${stage}`,
      data,
      agentId,
      'global'
    );

    // Check if this is the final stage
    const nextStage = stage + 1;
    const nextAgent = await this.getNextPipelineAgent(pipelineId, nextStage);

    if (nextAgent) {
      await this.sendMessage(
        agentId,
        nextAgent,
        'pipeline-data',
        {
          pipelineId,
          stage: nextStage,
          data,
          previousStage: stage
        },
        'pipeline'
      );
    }
  }

  /**
   * Utility methods
   */
  private async generateAgentVote(agentId: string, request: ConsensusRequest): Promise<AgentVote> {
    // Simplified voting logic - in reality, this would involve agent decision-making
    const random = Math.random();

    return {
      agentId,
      decision: random > 0.3 ? 'approve' : 'reject',
      confidence: random,
      reasoning: random > 0.3 ? 'Proposal looks good' : 'Concerns about implementation',
      timestamp: new Date()
    };
  }

  private async checkConsensusResult(request: ConsensusRequest): Promise<ConsensusResult> {
    const totalVotes = request.votes.size;
    const approvals = Array.from(request.votes.values()).filter(v => v.decision === 'approve').length;

    const approvalRatio = totalVotes > 0 ? approvals / totalVotes : 0;

    if (Date.now() > request.deadline.getTime()) {
      return {
        proposal: request.proposal.id,
        status: 'timeout',
        votes: request.votes,
        decision: 'rejected',
        timestamp: new Date()
      };
    }

    if (approvalRatio >= request.threshold) {
      return {
        proposal: request.proposal.id,
        status: 'completed',
        votes: request.votes,
        decision: 'approved',
        timestamp: new Date()
      };
    }

    return {
      proposal: request.proposal.id,
      status: 'pending',
      votes: request.votes,
      decision: 'pending',
      timestamp: new Date()
    };
  }

  private async getNextPipelineAgent(pipelineId: string, stage: number): Promise<string | null> {
    // Get pipeline configuration from memory
    const pipelineConfig = await memoryManager.retrieve(
      `pipeline/${pipelineId}/config`,
      'coordinator',
      'global'
    );

    if (!pipelineConfig || !pipelineConfig.stages || stage >= pipelineConfig.stages.length) {
      return null;
    }

    return pipelineConfig.stages[stage];
  }

  private generateMessageId(): string {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateCorrelationId(): string {
    return 'corr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private determinePriority(messageType: MessageType): TaskPriority {
    const priorityMap: Record<MessageType, TaskPriority> = {
      'task-assignment': 'high',
      'task-result': 'medium',
      'coordination-start': 'high',
      'consensus-request': 'medium',
      'consensus-vote': 'medium',
      'resource-request': 'low',
      'status-update': 'low',
      'pipeline-data': 'high',
      'error-notification': 'critical',
      'shutdown-signal': 'critical'
    };

    return priorityMap[messageType] || 'medium';
  }

  private calculateTTL(messageType: MessageType): number {
    // Time-to-live in milliseconds
    const ttlMap: Record<MessageType, number> = {
      'task-assignment': 300000, // 5 minutes
      'task-result': 600000, // 10 minutes
      'coordination-start': 60000, // 1 minute
      'consensus-request': 30000, // 30 seconds
      'consensus-vote': 30000, // 30 seconds
      'resource-request': 120000, // 2 minutes
      'status-update': 60000, // 1 minute
      'pipeline-data': 180000, // 3 minutes
      'error-notification': 60000, // 1 minute
      'shutdown-signal': 10000 // 10 seconds
    };

    return ttlMap[messageType] || 300000; // Default 5 minutes
  }

  /**
   * Public API methods
   */
  public async getMessageStats(): Promise<any> {
    const stats = {
      totalQueued: 0,
      queuesByAgent: {} as any,
      activeSubscriptions: this.subscriptions.size,
      activeSessions: this.coordinationSessions.size,
      protocolUsage: {} as any
    };

    for (const [agentId, messages] of this.messageQueue.entries()) {
      stats.totalQueued += messages.length;
      stats.queuesByAgent[agentId] = messages.length;

      // Count protocol usage
      for (const message of messages) {
        stats.protocolUsage[message.protocol] = (stats.protocolUsage[message.protocol] || 0) + 1;
      }
    }

    return stats;
  }

  public async getCoordinationStatus(sessionId?: string): Promise<any> {
    if (sessionId) {
      return this.coordinationSessions.get(sessionId) || null;
    }

    return Object.fromEntries(this.coordinationSessions);
  }

  public async cleanupExpiredMessages(): Promise<number> {
    let cleanedCount = 0;
    const now = Date.now();

    for (const [agentId, messages] of this.messageQueue.entries()) {
      const validMessages = messages.filter(msg => {
        const isExpired = (now - msg.timestamp.getTime()) > msg.ttl;
        if (isExpired) cleanedCount++;
        return !isExpired;
      });

      this.messageQueue.set(agentId, validMessages);
    }

    return cleanedCount;
  }
}

// Type definitions for communication protocol
export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string[];
  type: MessageType;
  payload: any;
  protocol: string;
  timestamp: Date;
  priority: TaskPriority;
  correlationId: string;
  ttl: number;
}

export type MessageType =
  | 'task-assignment'
  | 'task-result'
  | 'coordination-start'
  | 'consensus-request'
  | 'consensus-vote'
  | 'resource-request'
  | 'status-update'
  | 'pipeline-data'
  | 'error-notification'
  | 'shutdown-signal';

export interface CoordinationSession {
  id: string;
  pattern: CoordinationPattern;
  participants: string[];
  objective: string;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  messages: AgentMessage[];
  decisions: any[];
  metadata: Record<string, any>;
}

export interface ConsensusProposal {
  id: string;
  title: string;
  description: string;
  data: any;
  requiredVotes: number;
  deadline: Date;
}

export interface ConsensusRequest {
  id: string;
  sessionId: string;
  proposal: ConsensusProposal;
  threshold: number;
  deadline: Date;
  votes: Map<string, AgentVote>;
  status: 'pending' | 'completed' | 'timeout';
}

export interface AgentVote {
  agentId: string;
  decision: 'approve' | 'reject' | 'abstain';
  confidence: number;
  reasoning?: string;
  timestamp: Date;
}

export interface ConsensusResult {
  proposal: string;
  status: 'completed' | 'timeout' | 'pending';
  votes: Map<string, AgentVote>;
  decision: 'approved' | 'rejected' | 'pending';
  timestamp: Date;
}

export interface ProtocolHandler {
  send: (message: AgentMessage) => Promise<void>;
  receive: (agentId: string) => Promise<AgentMessage[]>;
  validate: (message: AgentMessage) => boolean;
}

export const communicationProtocol = CommunicationProtocol.getInstance();