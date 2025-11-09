# Daily Agent Routine System Documentation

## Overview

The Daily Agent Routine System is a comprehensive framework for managing AI agents that handle content generation, analysis, and coordination in the viral hashtag & image AI project. The system implements the SPARC methodology with Claude-Flow integration for enhanced coordination and parallel execution.

## Architecture

### Core Components

#### 1. Agent Types and Groups

The system organizes agents into specialized groups:

**Video Generation Group (`video-generation`)**
- `video-generator`: Creates videos from text prompts and images
- `video-editor`: Edits and processes video content
- `video-effects`: Applies special effects and filters

**Audio Generation Group (`audio-generation`)**
- `audio-composer`: Generates background music and compositions
- `sound-effects`: Creates sound effects and audio enhancements
- `voice-synthesizer`: Text-to-speech and voice generation

**Live Audio/Video Mixer Group (`live-mixer`)**
- `live-mixer`: Real-time audio/video mixing
- `stream-coordinator`: Manages live streaming workflows
- `recording-manager`: Handles recording and storage

**Content Analysis Group (`content-analysis`)**
- `content-analyzer`: Analyzes content for viral potential
- `trend-monitor`: Tracks social media trends
- `quality-checker`: Ensures content quality standards

### 2. Coordination Patterns

The system supports multiple coordination patterns:

- **Pipeline**: Sequential processing (video generation workflow)
- **Mesh**: Peer-to-peer coordination (audio generation)
- **Hierarchical**: Command structure (live streaming)
- **Consensus**: Collaborative decision-making (quality assurance)
- **Adaptive**: Dynamic coordination based on workload

### 3. Memory Management

Cross-agent memory sharing with scopes:
- **Private**: Agent-specific data
- **Group**: Shared within agent groups
- **Global**: System-wide accessible
- **Session**: Temporary session data

## Daily Routines

### Morning Content Generation Cycle (6:00 AM)
1. **Trend Analysis** - Analyze trending hashtags and content
2. **Content Ideas** - Generate viral content concepts
3. **Video Batch** - Create 5 short-form videos (parallel)
4. **Audio Batch** - Generate background music (parallel)

### Evening Live Streaming Preparation (6:00 PM)
1. **Stream Setup** - Configure streaming infrastructure
2. **Audio Mixer Prep** - Setup live audio mixing (parallel)
3. **Background Audio** - Create ambient streaming audio (parallel)

### Nightly Quality Assurance Check (11:00 PM)
1. **Content Review** - Review day's generated content
2. **Performance Analysis** - Analyze metrics and engagement (parallel)
3. **System Optimization** - Tune system performance

## Communication Protocol

### Message Types

```typescript
// Direct messaging between specific agents
await communicationProtocol.sendMessage(
  'video-gen-001',
  'video-edit-001',
  'task-assignment',
  { task: videoEditTask },
  'direct'
);

// Broadcast to all agents in group
await communicationProtocol.sendMessage(
  'coordinator',
  '*',
  'status-update',
  { systemStatus: 'maintenance' },
  'broadcast'
);

// Publish-subscribe for topic-based messaging
await communicationProtocol.subscribe('audio-comp-001', 'trend-updates');
await communicationProtocol.sendMessage(
  'trend-monitor-001',
  [],
  'status-update',
  { topic: 'trend-updates', data: newTrends },
  'pubsub'
);
```

### Coordination Sessions

```typescript
// Start video generation pipeline
await communicationProtocol.startCoordination(
  'video-pipeline-session-1',
  'pipeline',
  ['video-gen-001', 'video-edit-001', 'video-fx-001'],
  'Generate and process viral video content'
);

// Request consensus for quality standards
const consensusResult = await communicationProtocol.requestConsensus(
  'quality-consensus-1',
  {
    id: 'quality-proposal-1',
    title: 'Update Quality Standards',
    description: 'Increase minimum quality score to 0.85',
    data: { minQualityScore: 0.85 }
  },
  ['content-analyzer-001', 'quality-checker-001'],
  0.7 // 70% approval threshold
);
```

## Integration with Existing Components

### Supabase Integration

The system integrates seamlessly with existing Supabase tables:

```typescript
// Agent status tracking
await supabase.from('agent_status').upsert({
  agent_id: 'video-gen-001',
  status: 'busy',
  current_task: 'task_123',
  performance: agentMetrics
});

// Generated content storage
await supabase.from('content_generated').insert({
  content_id: 'video_456',
  type: 'video',
  agent_id: 'video-gen-001',
  url: '/generated/video_456.mp4',
  quality_score: 0.92,
  viral_potential: 0.88
});
```

### Component Integration

**AudioTranscriber Integration**
```typescript
// Audio analysis for content generation
const audioAnalysis = await audioTranscriber.analyze({
  audioUrl: generatedAudio.url,
  agentId: 'audio-comp-001',
  capabilities: ['transcribe', 'enhance']
});
```

**TextToImageGenerator Integration**
```typescript
// Image generation for video content
const imageData = await textToImageGenerator.generate({
  prompt: contentIdea.description,
  style: 'viral-social-media',
  agentId: 'video-gen-001'
});
```

**BatchImageGenerator Integration**
```typescript
// Batch processing for multiple content pieces
const batchResults = await batchImageGenerator.processBatch({
  images: contentIdeas.map(idea => idea.imagePrompt),
  agentId: 'video-gen-001',
  concurrency: 5
});
```

## Claude-Flow Integration

### Hooks System

Each agent implements Claude-Flow hooks for enhanced coordination:

```typescript
// Pre-task hook
await claudeFlowIntegration.executeHook('pre-task', agentId, {
  task: currentTask,
  agent: agentInstance
});

// Post-edit hook for file changes
await claudeFlowIntegration.executeHook('post-edit', agentId, {
  file: '/path/to/modified/file.ts',
  operation: 'update'
});

// Session management
await claudeFlowIntegration.executeHook('session-restore', agentId, {
  sessionId: `swarm-${agentId}`
});
```

### Neural Pattern Training

```typescript
// Train patterns based on successful task execution
await claudeFlowIntegration.trainNeuralPatterns(agentId, {
  task: completedTask,
  result: taskResult,
  performance: performanceMetrics
});
```

## API Usage Examples

### Initialize the System

```typescript
import { agentCoordinator } from './src/services/agents/AgentCoordinator';
import { memoryManager } from './src/services/agents/MemoryManager';
import { communicationProtocol } from './src/services/agents/CommunicationProtocol';
import { claudeFlowIntegration } from './src/services/agents/ClaudeFlowIntegration';
import { supabaseIntegration } from './src/services/agents/SupabaseIntegration';

// Initialize all components
await Promise.all([
  agentCoordinator.initialize(),
  memoryManager.initialize(),
  communicationProtocol.initialize(),
  claudeFlowIntegration.initialize(),
  supabaseIntegration.initialize()
]);
```

### Create and Assign Tasks

```typescript
// Create a video generation task
const taskId = await agentCoordinator.createTask({
  type: 'video-create',
  priority: 'high',
  payload: {
    type: 'text-to-video',
    data: {
      prompt: 'Create a viral TikTok video about AI trends',
      duration: 30,
      resolution: '1080x1920',
      style: 'trending'
    },
    resources: [
      { type: 'gpu', amount: 1, unit: 'core', critical: true }
    ]
  },
  deadline: new Date(Date.now() + 600000), // 10 minutes
  createdBy: 'user-interface'
});

console.log(`Task created: ${taskId}`);
```

### Monitor Agent Performance

```typescript
// Get agent status
const agents = await agentCoordinator.getAgentStatus();
console.log(`Active agents: ${agents.length}`);

// Get specific agent performance
const videoAgent = await agentCoordinator.getAgentStatus('video-gen-001');
console.log(`Success rate: ${videoAgent.performance.successRate}`);

// Analyze system performance
const performanceAnalysis = await claudeFlowIntegration.analyzePerformance();
console.log('Performance recommendations:', performanceAnalysis.recommendations);
```

### Memory Operations

```typescript
// Store coordination data
await memoryManager.storeCoordinationData(
  'video-generation',
  {
    currentPipeline: 'viral-content-batch-1',
    queuedTasks: 5,
    estimatedCompletion: new Date(Date.now() + 1800000)
  },
  'video-gen-001',
  'video-generation'
);

// Retrieve shared context
const pipelineData = await memoryManager.getCoordinationData(
  'video-generation',
  'video-gen-001',
  'video-generation'
);
```

### Integration Data Flow

```typescript
// Store integration result for cross-component coordination
await memoryManager.storeIntegrationData(
  'TextToImageGenerator',
  'generate',
  {
    imageUrl: '/generated/image_123.png',
    prompt: 'AI trends visualization',
    metadata: { style: 'viral', quality: 0.94 }
  },
  'video-gen-001'
);

// Retrieve integration data for downstream processing
const imageResults = await memoryManager.getIntegrationData(
  'TextToImageGenerator',
  'generate'
);
```

## Configuration

### Agent Configuration

```typescript
// config/agents/daily-routine.ts
export const agentConfig = {
  videoGeneration: {
    coordinationPattern: 'pipeline',
    scaling: {
      enabled: true,
      minAgents: 2,
      maxAgents: 6,
      scaleUpThreshold: 0.8
    },
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 1000,
      exponential: true
    }
  },
  audioGeneration: {
    coordinationPattern: 'mesh',
    loadBalancing: 'round-robin'
  },
  liveMixer: {
    coordinationPattern: 'hierarchical',
    scaling: { enabled: false } // Fixed capacity for real-time operations
  }
};
```

### Routine Scheduling

```typescript
// Morning content generation (6 AM daily)
export const morningRoutine = {
  schedule: '0 6 * * *', // Cron expression
  tasks: [
    {
      id: 'trend-analysis',
      agentType: 'content-analyzer',
      timeout: 300000, // 5 minutes
      parallel: false
    },
    {
      id: 'video-batch',
      agentType: 'video-generator',
      timeout: 1800000, // 30 minutes
      parallel: true
    }
  ]
};
```

## Monitoring and Metrics

### System Health Dashboard

```typescript
// Get comprehensive system status
const systemStatus = {
  agents: await agentCoordinator.getAgentStatus(),
  tasks: await agentCoordinator.getTaskStatus(),
  memory: await memoryManager.getMemoryStats(),
  communication: await communicationProtocol.getMessageStats(),
  swarm: await claudeFlowIntegration.getSwarmStatus()
};
```

### Performance Metrics

```typescript
// Track key performance indicators
const metrics = {
  taskCompletionRate: systemStatus.agents.reduce((sum, a) =>
    sum + a.performance.successRate, 0) / systemStatus.agents.length,

  averageTaskTime: systemStatus.agents.reduce((sum, a) =>
    sum + a.performance.averageTime, 0) / systemStatus.agents.length,

  systemUtilization: systemStatus.agents.filter(a =>
    a.status === 'busy').length / systemStatus.agents.length,

  memoryUsage: systemStatus.memory.totalSize,
  messageQueueSize: systemStatus.communication.totalQueued
};
```

## Best Practices

### 1. Agent Design
- Keep agents focused on single responsibilities
- Implement proper error handling and retry logic
- Use appropriate coordination patterns for different workflows
- Design for scalability and fault tolerance

### 2. Memory Management
- Use appropriate memory scopes for data sharing
- Implement cleanup policies for temporary data
- Monitor memory usage and implement alerts
- Use persistent storage for critical coordination data

### 3. Communication
- Choose appropriate protocols for different message types
- Implement proper message validation and error handling
- Use timeouts and TTL for message reliability
- Monitor communication patterns and bottlenecks

### 4. Integration
- Follow integration contracts with existing components
- Implement proper error boundaries
- Use Claude-Flow hooks for coordination enhancement
- Maintain data consistency across integrations

## Troubleshooting

### Common Issues

**Agent Not Responding**
```typescript
// Check agent status
const agent = await agentCoordinator.getAgentStatus('agent-id');
if (agent.status === 'error') {
  // Restart agent or reassign tasks
  await agentCoordinator.restartAgent('agent-id');
}
```

**Memory Leaks**
```typescript
// Clear old memory entries
const clearedCount = await memoryManager.clearMemory({
  olderThan: new Date(Date.now() - 86400000), // 24 hours ago
  keyPattern: /temp\/.*/
});
```

**Communication Bottlenecks**
```typescript
// Clean up expired messages
const expiredCount = await communicationProtocol.cleanupExpiredMessages();

// Monitor queue sizes
const stats = await communicationProtocol.getMessageStats();
if (stats.totalQueued > 1000) {
  // Consider scaling up agents or optimizing message flow
}
```

## Future Enhancements

1. **Machine Learning Integration**: Use performance data for predictive scaling
2. **Advanced Coordination**: Implement Byzantine fault tolerance for critical operations
3. **Real-time Monitoring**: WebSocket-based live monitoring dashboard
4. **Cost Optimization**: Dynamic resource allocation based on workload
5. **Multi-tenant Support**: Isolated agent groups for different users/projects

## Security Considerations

1. **Agent Authentication**: Secure token-based agent identification
2. **Memory Access Control**: Role-based access to memory stores
3. **Message Encryption**: Secure communication between agents
4. **Audit Logging**: Track all agent actions and decisions
5. **Resource Isolation**: Prevent agents from interfering with each other

This documentation provides a comprehensive guide to the Daily Agent Routine System, covering architecture, usage, and best practices for managing AI agents in a coordinated, scalable manner.