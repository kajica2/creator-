export interface AgentBlueprint {
  name: string;
  description: string;
  capabilities: string[];
  dependencies?: string[];
  methods: AgentMethod[];
  config?: AgentConfig;
  hooks?: AgentHooks;
  metadata?: AgentMetadata;
}

export interface AgentMethod {
  name: string;
  description: string;
  parameters: MethodParameter[];
  returnType: string;
  implementation?: string;
  async?: boolean;
  examples?: AgentMethodExample[];
}

export interface MethodParameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description?: string;
  validation?: ParameterValidation;
}

export interface ParameterValidation {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
  custom?: string; // Custom validation function
}

export interface AgentMethodExample {
  name: string;
  input: any;
  output: any;
  description: string;
}

export interface AgentConfig {
  timeout?: number;
  retryPolicy?: RetryPolicy;
  rateLimit?: RateLimit;
  permissions?: string[];
  environment?: Record<string, string>;
  scaling?: ScalingConfig;
  monitoring?: MonitoringConfig;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay?: number;
}

export interface RateLimit {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
}

export interface ScalingConfig {
  minInstances: number;
  maxInstances: number;
  targetCpuUtilization: number;
  targetMemoryUtilization: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: string[];
  alertThresholds: Record<string, number>;
}

export interface AgentHooks {
  onCreate?: string;
  onDestroy?: string;
  beforeExecute?: string;
  afterExecute?: string;
  onError?: string;
  onTimeout?: string;
}

export interface AgentMetadata {
  version: string;
  author: string;
  tags: string[];
  created: Date;
  updated: Date;
  documentation?: string;
  examples?: AgentExample[];
  changelog?: ChangelogEntry[];
}

export interface AgentExample {
  title: string;
  description: string;
  input: any;
  expectedOutput: any;
  category?: string;
}

export interface ChangelogEntry {
  version: string;
  date: Date;
  changes: string[];
  breaking?: boolean;
}

export interface AgentTemplate {
  name: string;
  description: string;
  category: string;
  template: string;
  placeholders: TemplatePlaceholder[];
  requiredCapabilities: string[];
  tags: string[];
}

export interface TemplatePlaceholder {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default?: any;
  options?: any[];
}

export interface AgentRequirements {
  name: string;
  description?: string;
  features: string[];
  operations?: string[];
  dataTypes?: string[];
  integrations?: string[];
  performance?: PerformanceRequirements;
  security?: SecurityRequirements;
  constraints?: string[];
  tags?: string[];
}

export interface PerformanceRequirements {
  maxResponseTime: number;
  throughputRequirement: number;
  memoryLimit: number;
  cpuLimit: number;
}

export interface SecurityRequirements {
  authentication: boolean;
  authorization: boolean;
  encryption: boolean;
  auditLogging: boolean;
  dataPrivacy: string[];
}

export interface AgentComposition {
  name: string;
  description: string;
  agents: string[];
  strategy: CompositionStrategy;
  routing?: RoutingConfig;
  aggregation?: AggregationConfig;
}

export type CompositionStrategy = 
  | 'sequential'
  | 'parallel'
  | 'conditional'
  | 'pipeline'
  | 'scatter-gather'
  | 'round-robin'
  | 'weighted';

export interface RoutingConfig {
  rules: RoutingRule[];
  defaultAgent?: string;
  fallbackAgent?: string;
}

export interface RoutingRule {
  condition: string; // JavaScript expression
  targetAgent: string;
  weight?: number;
}

export interface AggregationConfig {
  strategy: 'merge' | 'select-first' | 'select-best' | 'custom';
  customAggregator?: string; // JavaScript function
  timeout?: number;
}

export interface AgentTestCase {
  name: string;
  description: string;
  action: string;
  payload: any;
  expectedResult?: any;
  expectedError?: string;
  timeout?: number;
  tags?: string[];
}

export interface AgentTestSuite {
  name: string;
  description: string;
  testCases: AgentTestCase[];
  setup?: string;
  teardown?: string;
  config?: TestConfig;
}

export interface TestConfig {
  parallel: boolean;
  timeout: number;
  retries: number;
  coverage: boolean;
}

export interface AgentPerformanceReport {
  agentName: string;
  testDuration: number;
  requestCount: number;
  successRate: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: MemoryUsage;
  cpuUsage: number;
  recommendations: string[];
}

export interface MemoryUsage {
  current: number;
  peak: number;
  average: number;
}

export interface AgentOptimization {
  agentName: string;
  optimizations: OptimizationRecommendation[];
  estimatedImprovement: PerformanceImprovement;
  complexity: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface OptimizationRecommendation {
  type: 'performance' | 'memory' | 'security' | 'maintainability';
  description: string;
  implementation: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

export interface PerformanceImprovement {
  responseTime: number; // Percentage improvement
  throughput: number;
  memoryUsage: number;
  errorRate: number;
}

export interface AgentCapabilityAnalysis {
  agentName: string;
  declaredCapabilities: string[];
  inferredCapabilities: string[];
  missingCapabilities: string[];
  redundantCapabilities: string[];
  compatibilityScore: number;
  recommendations: string[];
}

export interface AgentDependencyGraph {
  nodes: AgentNode[];
  edges: AgentEdge[];
  cycles: string[][];
  criticalPath: string[];
}

export interface AgentNode {
  name: string;
  type: 'agent' | 'service' | 'data';
  status: 'active' | 'inactive' | 'error';
  capabilities: string[];
}

export interface AgentEdge {
  from: string;
  to: string;
  type: 'depends' | 'calls' | 'data-flow';
  weight: number;
  frequency: number;
}