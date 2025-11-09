export interface AgentTask {
  id: string;
  type: AgentTaskType;
  priority: TaskPriority;
  payload: TaskPayload;
  dependencies: string[];
  scheduledAt: Date;
  deadline?: Date;
  retryCount: number;
  maxRetries: number;
  status: TaskStatus;
  createdBy: string;
  assignedTo?: string;
  result?: TaskResult;
  metadata: Record<string, any>;
}

export interface AgentGroup {
  id: string;
  name: string;
  type: AgentGroupType;
  agents: Agent[];
  coordinationPattern: CoordinationPattern;
  sharedMemory: MemoryStore;
  status: AgentGroupStatus;
  configuration: AgentGroupConfig;
  metrics: AgentGroupMetrics;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  capabilities: AgentCapability[];
  status: AgentStatus;
  currentTask?: string;
  performance: AgentPerformance;
  memoryAccess: MemoryAccess;
  configuration: AgentConfig;
  hooks: AgentHooks;
}

export interface DailyRoutine {
  id: string;
  name: string;
  schedule: CronExpression;
  agentGroups: string[];
  taskSequence: RoutineTask[];
  dependencies: string[];
  isActive: boolean;
  configuration: RoutineConfig;
  metrics: RoutineMetrics;
}

export type AgentType =
  | 'video-generator'
  | 'video-editor'
  | 'video-effects'
  | 'audio-composer'
  | 'sound-effects'
  | 'voice-synthesizer'
  | 'live-mixer'
  | 'stream-coordinator'
  | 'recording-manager'
  | 'content-analyzer'
  | 'trend-monitor'
  | 'quality-checker';

export type AgentGroupType =
  | 'video-generation'
  | 'audio-generation'
  | 'live-mixer'
  | 'content-analysis'
  | 'monitoring'
  | 'quality-assurance';

export type AgentTaskType =
  | 'video-create'
  | 'video-edit'
  | 'audio-create'
  | 'audio-mix'
  | 'live-stream'
  | 'content-analyze'
  | 'trend-detect'
  | 'quality-check'
  | 'data-sync';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
export type AgentStatus = 'idle' | 'busy' | 'offline' | 'error' | 'maintenance';
export type AgentGroupStatus = 'active' | 'paused' | 'offline' | 'syncing';
export type CoordinationPattern = 'hierarchical' | 'mesh' | 'pipeline' | 'consensus' | 'adaptive';

export interface TaskPayload {
  type: string;
  data: any;
  context?: Record<string, any>;
  resources?: ResourceRequirement[];
}

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  metrics?: TaskMetrics;
  artifacts?: string[];
}

export interface AgentCapability {
  name: string;
  type: CapabilityType;
  version: string;
  requirements: string[];
  performance: PerformanceMetrics;
}

export type CapabilityType =
  | 'generation'
  | 'processing'
  | 'analysis'
  | 'coordination'
  | 'storage'
  | 'communication';

export interface MemoryStore {
  sessionId: string;
  shared: Record<string, any>;
  private: Map<string, Record<string, any>>;
  persistent: Record<string, any>;
  metadata: MemoryMetadata;
}

export interface MemoryAccess {
  canRead: string[];
  canWrite: string[];
  canDelete: string[];
  scope: MemoryScope;
}

export type MemoryScope = 'private' | 'group' | 'global' | 'session';

export interface AgentHooks {
  preTask: HookFunction[];
  postTask: HookFunction[];
  onError: HookFunction[];
  onComplete: HookFunction[];
  sessionRestore: HookFunction[];
  sessionEnd: HookFunction[];
}

export type HookFunction = (context: HookContext) => Promise<void>;

export interface HookContext {
  agent: Agent;
  task?: AgentTask;
  result?: TaskResult;
  error?: Error;
  metadata: Record<string, any>;
}

export interface AgentPerformance {
  tasksCompleted: number;
  successRate: number;
  averageTime: number;
  errorCount: number;
  lastActive: Date;
  efficiency: number;
}

export interface AgentConfig {
  maxConcurrentTasks: number;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  resources: ResourceLimit[];
  endpoints: string[];
  authentication: AuthConfig;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  exponential: boolean;
  conditions: string[];
}

export interface ResourceRequirement {
  type: ResourceType;
  amount: number;
  unit: string;
  critical: boolean;
}

export interface ResourceLimit {
  type: ResourceType;
  max: number;
  current: number;
  unit: string;
}

export type ResourceType = 'cpu' | 'memory' | 'gpu' | 'storage' | 'bandwidth' | 'api-calls';

export interface AuthConfig {
  type: 'bearer' | 'api-key' | 'oauth' | 'cert';
  credentials: Record<string, string>;
  endpoints: string[];
}

export interface AgentGroupConfig {
  coordinationTimeout: number;
  consensusThreshold: number;
  failoverEnabled: boolean;
  loadBalancing: LoadBalancingStrategy;
  scaling: AutoScalingConfig;
}

export type LoadBalancingStrategy = 'round-robin' | 'least-busy' | 'capability-based' | 'priority';

export interface AutoScalingConfig {
  enabled: boolean;
  minAgents: number;
  maxAgents: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownMs: number;
}

export interface RoutineTask {
  id: string;
  agentType: AgentType;
  taskType: AgentTaskType;
  payload: TaskPayload;
  timeout: number;
  dependencies: string[];
  parallel: boolean;
}

export interface RoutineConfig {
  timezone: string;
  notifications: NotificationConfig;
  failureHandling: FailureHandlingConfig;
  logging: LoggingConfig;
}

export interface NotificationConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  conditions: NotificationCondition[];
}

export interface NotificationChannel {
  type: 'webhook' | 'email' | 'slack' | 'discord';
  endpoint: string;
  authentication?: AuthConfig;
}

export interface NotificationCondition {
  event: 'start' | 'complete' | 'error' | 'timeout';
  severity: 'info' | 'warning' | 'error' | 'critical';
  throttle?: number;
}

export interface FailureHandlingConfig {
  retryRoutine: boolean;
  skipFailedTasks: boolean;
  alertThreshold: number;
  rollback: boolean;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  destinations: LogDestination[];
  retention: number;
}

export interface LogDestination {
  type: 'console' | 'file' | 'database' | 'remote';
  config: Record<string, any>;
}

export interface AgentGroupMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTime: number;
  throughput: number;
  efficiency: number;
  resourceUtilization: Record<ResourceType, number>;
}

export interface RoutineMetrics {
  executions: number;
  successRate: number;
  averageDuration: number;
  lastExecution: Date;
  nextExecution: Date;
  taskMetrics: Record<string, TaskMetrics>;
}

export interface TaskMetrics {
  duration: number;
  resourceUsage: Record<ResourceType, number>;
  qualityScore: number;
  errors: string[];
  warnings: string[];
}

export interface PerformanceMetrics {
  latency: number;
  throughput: number;
  accuracy: number;
  reliability: number;
  scalability: number;
}

export interface MemoryMetadata {
  created: Date;
  updated: Date;
  size: number;
  accessCount: number;
  permissions: MemoryPermission[];
}

export interface MemoryPermission {
  agentId: string;
  access: MemoryAccess;
  expires?: Date;
}

export type CronExpression = string;

// Event types for agent communication
export interface AgentEvent {
  id: string;
  type: AgentEventType;
  source: string;
  target?: string;
  payload: any;
  timestamp: Date;
  priority: TaskPriority;
}

export type AgentEventType =
  | 'task-assigned'
  | 'task-completed'
  | 'task-failed'
  | 'status-changed'
  | 'resource-request'
  | 'coordination-signal'
  | 'memory-updated'
  | 'alert-raised';

// Integration interfaces for existing components
export interface ComponentIntegration {
  audioTranscriber: AudioTranscriberIntegration;
  textToImage: TextToImageIntegration;
  batchImage: BatchImageIntegration;
  tensorMutator: TensorMutatorIntegration;
  supabase: SupabaseIntegration;
}

export interface AudioTranscriberIntegration {
  agentType: 'audio-composer' | 'voice-synthesizer';
  capabilities: ['transcribe', 'analyze', 'enhance'];
  endpoints: TranscriptionEndpoint[];
}

export interface TextToImageIntegration {
  agentType: 'video-generator';
  capabilities: ['text-to-image', 'style-transfer', 'enhancement'];
  endpoints: ImageGenerationEndpoint[];
}

export interface BatchImageIntegration {
  agentType: 'video-generator';
  capabilities: ['batch-process', 'queue-management', 'optimization'];
  endpoints: BatchProcessingEndpoint[];
}

export interface TensorMutatorIntegration {
  agentType: 'video-effects';
  capabilities: ['tensor-manipulation', 'model-optimization', 'inference'];
  endpoints: TensorEndpoint[];
}

export interface SupabaseIntegration {
  tables: SupabaseTable[];
  functions: SupabaseFunction[];
  realtime: RealtimeConfig[];
  storage: StorageConfig;
}

export interface SupabaseTable {
  name: string;
  operations: ('read' | 'write' | 'update' | 'delete')[];
  agentAccess: string[];
}

export interface SupabaseFunction {
  name: string;
  purpose: string;
  agentAccess: string[];
}

export interface RealtimeConfig {
  table: string;
  events: ('INSERT' | 'UPDATE' | 'DELETE')[];
  filter?: string;
}

export interface StorageConfig {
  bucket: string;
  permissions: ('read' | 'write' | 'delete')[];
  agentAccess: string[];
}

export interface TranscriptionEndpoint {
  url: string;
  method: 'POST' | 'GET';
  authentication: AuthConfig;
}

export interface ImageGenerationEndpoint {
  url: string;
  method: 'POST';
  authentication: AuthConfig;
  rateLimit: RateLimit;
}

export interface BatchProcessingEndpoint {
  url: string;
  method: 'POST';
  authentication: AuthConfig;
  concurrency: number;
}

export interface TensorEndpoint {
  url: string;
  method: 'POST';
  authentication: AuthConfig;
  computeType: 'cpu' | 'gpu' | 'tpu';
}

export interface RateLimit {
  requests: number;
  period: number;
  unit: 'second' | 'minute' | 'hour' | 'day';
}