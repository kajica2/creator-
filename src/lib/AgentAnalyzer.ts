import { 
  AgentBlueprint, 
  AgentCapabilityAnalysis, 
  AgentDependencyGraph,
  AgentNode,
  AgentEdge,
  AgentPerformanceReport,
  MemoryUsage
} from '../types/AgentTypes';
import { agentRegistry } from './AgentRegistry';
import * as fs from 'fs/promises';
import * as path from 'path';
import { performance } from 'perf_hooks';

export interface AnalysisOptions {
  includePerformance?: boolean;
  includeDependencies?: boolean;
  includeCompatibility?: boolean;
  includeOptimizations?: boolean;
  depth?: number;
}

export interface AgentCodeAnalysis {
  complexity: number;
  maintainability: number;
  testCoverage: number;
  codeSmells: CodeSmell[];
  securityIssues: SecurityIssue[];
  performanceBottlenecks: PerformanceBottleneck[];
}

export interface CodeSmell {
  type: 'long-method' | 'large-class' | 'duplicate-code' | 'complex-conditional';
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface SecurityIssue {
  type: 'unsafe-eval' | 'unvalidated-input' | 'hardcoded-secret' | 'insecure-random';
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cwe?: string;
  mitigation: string;
}

export interface PerformanceBottleneck {
  type: 'blocking-io' | 'memory-leak' | 'inefficient-algorithm' | 'unnecessary-computation';
  location: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
}

export class AgentAnalyzer {
  private performanceData = new Map<string, PerformanceMetric[]>();
  private dependencyCache = new Map<string, string[]>();
  
  async analyzeCapabilities(
    agentName: string, 
    options: AnalysisOptions = {}
  ): Promise<AgentCapabilityAnalysis> {
    const agent = agentRegistry.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    const blueprint = agent.blueprint;
    
    // Analyze declared capabilities
    const declaredCapabilities = blueprint.capabilities;
    
    // Infer capabilities from code analysis
    const inferredCapabilities = await this.inferCapabilities(blueprint);
    
    // Find missing and redundant capabilities
    const missingCapabilities = inferredCapabilities.filter(
      cap => !declaredCapabilities.includes(cap)
    );
    
    const redundantCapabilities = declaredCapabilities.filter(
      cap => !inferredCapabilities.includes(cap)
    );
    
    // Calculate compatibility score
    const compatibilityScore = this.calculateCompatibilityScore(
      declaredCapabilities,
      inferredCapabilities
    );
    
    // Generate recommendations
    const recommendations = this.generateCapabilityRecommendations(
      declaredCapabilities,
      inferredCapabilities,
      missingCapabilities,
      redundantCapabilities
    );
    
    return {
      agentName,
      declaredCapabilities,
      inferredCapabilities,
      missingCapabilities,
      redundantCapabilities,
      compatibilityScore,
      recommendations
    };
  }
  
  async analyzeDependencies(
    agentNames: string[]
  ): Promise<AgentDependencyGraph> {
    const nodes: AgentNode[] = [];
    const edges: AgentEdge[] = [];
    const visited = new Set<string>();
    
    // Build dependency graph
    for (const agentName of agentNames) {
      await this.buildDependencyGraph(agentName, nodes, edges, visited);
    }
    
    // Detect cycles
    const cycles = this.detectCycles(nodes, edges);
    
    // Find critical path
    const criticalPath = this.findCriticalPath(nodes, edges);
    
    return {
      nodes,
      edges,
      cycles,
      criticalPath
    };
  }
  
  async analyzePerformance(
    agentName: string,
    testCases?: any[],
    duration: number = 60000 // 1 minute
  ): Promise<AgentPerformanceReport> {
    const agent = agentRegistry.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }
    
    const startTime = performance.now();
    const metrics: PerformanceMetric[] = [];
    const errors: any[] = [];
    
    // Default test cases if none provided
    if (!testCases) {
      testCases = this.generateDefaultTestCases(agent.blueprint);
    }
    
    let requestCount = 0;
    const endTime = startTime + duration;
    
    // Run performance test
    while (performance.now() < endTime) {
      for (const testCase of testCases) {
        try {
          const requestStart = performance.now();
          const memoryBefore = process.memoryUsage();
          
          // Execute test case
          await this.executeTestCase(agentName, testCase);
          
          const requestEnd = performance.now();
          const memoryAfter = process.memoryUsage();
          
          const responseTime = requestEnd - requestStart;
          const memoryDelta = memoryAfter.heapUsed - memoryBefore.heapUsed;
          
          metrics.push({
            timestamp: requestEnd,
            responseTime,
            memoryUsage: memoryAfter.heapUsed,
            memoryDelta,
            success: true
          });
          
          requestCount++;
        } catch (error) {
          errors.push({
            timestamp: performance.now(),
            error: error.message,
            testCase
          });
        }
      }
    }
    
    const totalDuration = performance.now() - startTime;
    
    // Calculate statistics
    const successfulRequests = metrics.filter(m => m.success);
    const responseTimes = successfulRequests.map(m => m.responseTime);
    const memoryUsages = successfulRequests.map(m => m.memoryUsage);
    
    const report: AgentPerformanceReport = {
      agentName,
      testDuration: totalDuration,
      requestCount,
      successRate: successfulRequests.length / requestCount,
      averageResponseTime: this.average(responseTimes),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      throughput: (requestCount / totalDuration) * 1000, // requests per second
      errorRate: errors.length / requestCount,
      memoryUsage: {
        current: memoryUsages[memoryUsages.length - 1] || 0,
        peak: Math.max(...memoryUsages),
        average: this.average(memoryUsages)
      },
      cpuUsage: await this.measureCpuUsage(agentName),
      recommendations: this.generatePerformanceRecommendations(metrics, errors)
    };
    
    // Store performance data for future analysis
    this.performanceData.set(agentName, metrics);
    
    return report;
  }
  
  async analyzeCode(agentName: string): Promise<AgentCodeAnalysis> {
    const agent = agentRegistry.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }
    
    const agentFilePath = path.join(
      process.cwd(),
      'api',
      'agents',
      'generated',
      `${agentName}.ts`
    );
    
    let code: string;
    try {
      code = await fs.readFile(agentFilePath, 'utf-8');
    } catch (error) {
      throw new Error(`Could not read agent file: ${agentFilePath}`);
    }
    
    return {
      complexity: this.calculateComplexity(code),
      maintainability: this.calculateMaintainability(code),
      testCoverage: await this.calculateTestCoverage(agentName),
      codeSmells: this.detectCodeSmells(code),
      securityIssues: this.detectSecurityIssues(code),
      performanceBottlenecks: this.detectPerformanceBottlenecks(code)
    };
  }
  
  async compareAgents(
    agentNames: string[],
    criteria: string[] = ['performance', 'capabilities', 'complexity']
  ): Promise<AgentComparison> {
    const comparisons: AgentComparisonResult[] = [];
    
    for (const agentName of agentNames) {
      const result: AgentComparisonResult = {
        agentName,
        scores: {}
      };
      
      if (criteria.includes('performance')) {
        const perfReport = await this.analyzePerformance(agentName, undefined, 10000);
        result.scores.performance = this.normalizePerformanceScore(perfReport);
      }
      
      if (criteria.includes('capabilities')) {
        const capAnalysis = await this.analyzeCapabilities(agentName);
        result.scores.capabilities = capAnalysis.compatibilityScore;
      }
      
      if (criteria.includes('complexity')) {
        const codeAnalysis = await this.analyzeCode(agentName);
        result.scores.complexity = 1 - (codeAnalysis.complexity / 100); // Invert so lower complexity = higher score
      }
      
      comparisons.push(result);
    }
    
    return {
      agents: comparisons,
      criteria,
      ranking: this.rankAgents(comparisons, criteria),
      recommendations: this.generateComparisonRecommendations(comparisons)
    };
  }
  
  private async inferCapabilities(blueprint: AgentBlueprint): Promise<string[]> {
    const capabilities = new Set<string>();
    
    // Analyze method names and implementations
    blueprint.methods.forEach(method => {
      const methodName = method.name.toLowerCase();
      const implementation = method.implementation || '';
      
      // Infer from method names
      if (methodName.includes('process') || methodName.includes('transform')) {
        capabilities.add('data-processing');
      }
      if (methodName.includes('api') || methodName.includes('http') || methodName.includes('fetch')) {
        capabilities.add('api-integration');
      }
      if (methodName.includes('ai') || methodName.includes('ml') || methodName.includes('predict')) {
        capabilities.add('machine-learning');
      }
      if (methodName.includes('store') || methodName.includes('save') || methodName.includes('persist')) {
        capabilities.add('data-storage');
      }
      
      // Infer from implementation
      if (implementation.includes('axios') || implementation.includes('fetch')) {
        capabilities.add('api-integration');
      }
      if (implementation.includes('tensorflow') || implementation.includes('@google/genai')) {
        capabilities.add('machine-learning');
      }
      if (implementation.includes('fs.') || implementation.includes('database')) {
        capabilities.add('data-storage');
      }
    });
    
    // Infer from dependencies
    blueprint.dependencies?.forEach(dep => {
      if (dep.includes('axios') || dep.includes('node-fetch')) {
        capabilities.add('api-integration');
      }
      if (dep.includes('tensorflow') || dep.includes('torch')) {
        capabilities.add('machine-learning');
      }
      if (dep.includes('mongoose') || dep.includes('sequelize')) {
        capabilities.add('data-storage');
      }
    });
    
    return Array.from(capabilities);
  }
  
  private calculateCompatibilityScore(
    declared: string[],
    inferred: string[]
  ): number {
    const intersection = declared.filter(cap => inferred.includes(cap));
    const union = [...new Set([...declared, ...inferred])];
    
    return union.length > 0 ? intersection.length / union.length : 0;
  }
  
  private generateCapabilityRecommendations(
    declared: string[],
    inferred: string[],
    missing: string[],
    redundant: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (missing.length > 0) {
      recommendations.push(`Consider adding these capabilities: ${missing.join(', ')}`);
    }
    
    if (redundant.length > 0) {
      recommendations.push(`Consider removing unused capabilities: ${redundant.join(', ')}`);
    }
    
    if (declared.length === 0) {
      recommendations.push('Agent has no declared capabilities. Consider adding some.');
    }
    
    if (inferred.length > declared.length * 1.5) {
      recommendations.push('Agent seems to have more capabilities than declared. Review and update.');
    }
    
    return recommendations;
  }
  
  private async buildDependencyGraph(
    agentName: string,
    nodes: AgentNode[],
    edges: AgentEdge[],
    visited: Set<string>
  ): Promise<void> {
    if (visited.has(agentName)) {
      return;
    }
    
    visited.add(agentName);
    
    const agent = agentRegistry.get(agentName);
    if (!agent) {
      return;
    }
    
    // Add node
    nodes.push({
      name: agentName,
      type: 'agent',
      status: agent.status as any,
      capabilities: agent.blueprint.capabilities
    });
    
    // Analyze dependencies
    const dependencies = agent.blueprint.dependencies || [];
    
    for (const dep of dependencies) {
      // Add dependency node if it's another agent
      const depAgent = agentRegistry.get(dep);
      if (depAgent) {
        edges.push({
          from: agentName,
          to: dep,
          type: 'depends',
          weight: 1,
          frequency: 1
        });
        
        await this.buildDependencyGraph(dep, nodes, edges, visited);
      }
    }
  }
  
  private detectCycles(nodes: AgentNode[], edges: AgentEdge[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // Found cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart));
        }
        return;
      }
      
      if (visited.has(node)) {
        return;
      }
      
      visited.add(node);
      recursionStack.add(node);
      path.push(node);
      
      const outgoingEdges = edges.filter(e => e.from === node);
      for (const edge of outgoingEdges) {
        dfs(edge.to, [...path]);
      }
      
      recursionStack.delete(node);
    };
    
    for (const node of nodes) {
      if (!visited.has(node.name)) {
        dfs(node.name, []);
      }
    }
    
    return cycles;
  }
  
  private findCriticalPath(nodes: AgentNode[], edges: AgentEdge[]): string[] {
    // Simplified critical path using longest path algorithm
    const distances = new Map<string, number>();
    const predecessors = new Map<string, string>();
    
    // Initialize distances
    nodes.forEach(node => distances.set(node.name, -Infinity));
    
    // Find source nodes (no incoming edges)
    const sourceNodes = nodes.filter(node => 
      !edges.some(edge => edge.to === node.name)
    );
    
    sourceNodes.forEach(node => distances.set(node.name, 0));
    
    // Relax edges repeatedly
    for (let i = 0; i < nodes.length - 1; i++) {
      for (const edge of edges) {
        const fromDist = distances.get(edge.from) || -Infinity;
        const toDist = distances.get(edge.to) || -Infinity;
        
        if (fromDist + edge.weight > toDist) {
          distances.set(edge.to, fromDist + edge.weight);
          predecessors.set(edge.to, edge.from);
        }
      }
    }
    
    // Find the longest path
    let maxDistance = -Infinity;
    let endNode = '';
    
    distances.forEach((distance, node) => {
      if (distance > maxDistance) {
        maxDistance = distance;
        endNode = node;
      }
    });
    
    // Reconstruct path
    const path: string[] = [];
    let current = endNode;
    
    while (current) {
      path.unshift(current);
      current = predecessors.get(current) || '';
    }
    
    return path;
  }
  
  private generateDefaultTestCases(blueprint: AgentBlueprint): any[] {
    return blueprint.methods.map(method => ({
      action: method.name,
      payload: this.generateSamplePayload(method.parameters)
    }));
  }
  
  private generateSamplePayload(parameters: any[]): any {
    const payload: any = {};
    
    parameters.forEach(param => {
      switch (param.type) {
        case 'string':
          payload[param.name] = 'test-string';
          break;
        case 'number':
          payload[param.name] = 42;
          break;
        case 'boolean':
          payload[param.name] = true;
          break;
        case 'object':
          payload[param.name] = { test: 'value' };
          break;
        case 'array':
          payload[param.name] = ['item1', 'item2'];
          break;
        default:
          payload[param.name] = null;
      }
    });
    
    return payload;
  }
  
  private async executeTestCase(agentName: string, testCase: any): Promise<any> {
    const agent = agentRegistry.get(agentName);
    if (!agent || !agent.instance) {
      throw new Error(`Agent ${agentName} not available`);
    }
    
    return agent.instance.handle({
      action: testCase.action,
      payload: testCase.payload,
      userId: 'performance-test'
    });
  }
  
  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }
  
  private async measureCpuUsage(agentName: string): Promise<number> {
    // Simplified CPU usage measurement
    return Math.random() * 100; // Placeholder
  }
  
  private generatePerformanceRecommendations(
    metrics: PerformanceMetric[],
    errors: any[]
  ): string[] {
    const recommendations: string[] = [];
    
    const responseTimes = metrics.map(m => m.responseTime);
    const avgResponseTime = this.average(responseTimes);
    
    if (avgResponseTime > 1000) {
      recommendations.push('Consider optimizing for faster response times');
    }
    
    if (errors.length > metrics.length * 0.1) {
      recommendations.push('High error rate detected. Review error handling.');
    }
    
    const memoryGrowth = this.analyzeMemoryGrowth(metrics);
    if (memoryGrowth > 1.5) {
      recommendations.push('Potential memory leak detected. Review memory usage.');
    }
    
    return recommendations;
  }
  
  private analyzeMemoryGrowth(metrics: PerformanceMetric[]): number {
    if (metrics.length < 2) return 1;
    
    const firstQuarter = metrics.slice(0, Math.floor(metrics.length / 4));
    const lastQuarter = metrics.slice(-Math.floor(metrics.length / 4));
    
    const avgFirst = this.average(firstQuarter.map(m => m.memoryUsage));
    const avgLast = this.average(lastQuarter.map(m => m.memoryUsage));
    
    return avgFirst > 0 ? avgLast / avgFirst : 1;
  }
  
  private calculateComplexity(code: string): number {
    // Simplified cyclomatic complexity
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'];
    let complexity = 1; // Base complexity
    
    complexityKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex) || [];
      complexity += matches.length;
    });
    
    return Math.min(complexity, 100); // Cap at 100
  }
  
  private calculateMaintainability(code: string): number {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    // Simple maintainability index based on code length and complexity
    const lengthFactor = Math.max(0, 100 - (nonEmptyLines.length / 10));
    const complexityFactor = Math.max(0, 100 - this.calculateComplexity(code));
    
    return (lengthFactor + complexityFactor) / 2;
  }
  
  private async calculateTestCoverage(agentName: string): Promise<number> {
    // Placeholder for test coverage calculation
    return Math.random() * 100;
  }
  
  private detectCodeSmells(code: string): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      if (line.length > 120) {
        smells.push({
          type: 'long-method',
          location: `Line ${index + 1}`,
          description: 'Line is too long',
          severity: 'low',
          suggestion: 'Consider breaking long lines for better readability'
        });
      }
      
      if (line.includes('// TODO') || line.includes('// FIXME')) {
        smells.push({
          type: 'duplicate-code',
          location: `Line ${index + 1}`,
          description: 'Unfinished code detected',
          severity: 'medium',
          suggestion: 'Complete implementation or remove TODO/FIXME comments'
        });
      }
    });
    
    return smells;
  }
  
  private detectSecurityIssues(code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    
    if (code.includes('eval(')) {
      issues.push({
        type: 'unsafe-eval',
        location: 'Code contains eval()',
        description: 'Use of eval() can lead to code injection',
        severity: 'high',
        cwe: 'CWE-95',
        mitigation: 'Use safer alternatives like JSON.parse() or Function constructor'
      });
    }
    
    if (code.includes('Math.random()')) {
      issues.push({
        type: 'insecure-random',
        location: 'Code contains Math.random()',
        description: 'Math.random() is not cryptographically secure',
        severity: 'medium',
        mitigation: 'Use crypto.randomBytes() for security-sensitive operations'
      });
    }
    
    return issues;
  }
  
  private detectPerformanceBottlenecks(code: string): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];
    
    if (code.includes('fs.readFileSync') || code.includes('fs.writeFileSync')) {
      bottlenecks.push({
        type: 'blocking-io',
        location: 'Synchronous file operations detected',
        description: 'Synchronous I/O operations block the event loop',
        impact: 'high',
        suggestion: 'Use asynchronous file operations (fs.promises or async/await)'
      });
    }
    
    return bottlenecks;
  }
  
  private normalizePerformanceScore(report: AgentPerformanceReport): number {
    // Normalize performance metrics to 0-1 score
    const responseTimeScore = Math.max(0, 1 - (report.averageResponseTime / 5000)); // 5s max
    const throughputScore = Math.min(1, report.throughput / 100); // 100 RPS max
    const errorRateScore = Math.max(0, 1 - report.errorRate);
    const successRateScore = report.successRate;
    
    return (responseTimeScore + throughputScore + errorRateScore + successRateScore) / 4;
  }
  
  private rankAgents(
    comparisons: AgentComparisonResult[],
    criteria: string[]
  ): AgentRanking[] {
    return comparisons
      .map(comp => {
        const totalScore = criteria.reduce(
          (sum, criterion) => sum + (comp.scores[criterion] || 0),
          0
        ) / criteria.length;
        
        return {
          agentName: comp.agentName,
          totalScore,
          rank: 0 // Will be set after sorting
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((result, index) => ({ ...result, rank: index + 1 }));
  }
  
  private generateComparisonRecommendations(
    comparisons: AgentComparisonResult[]
  ): string[] {
    const recommendations: string[] = [];
    
    const bestPerforming = comparisons.reduce((best, current) => {
      const bestScore = Object.values(best.scores).reduce((a, b) => a + b, 0);
      const currentScore = Object.values(current.scores).reduce((a, b) => a + b, 0);
      return currentScore > bestScore ? current : best;
    });
    
    recommendations.push(`${bestPerforming.agentName} shows the best overall performance`);
    
    // Find agents that need improvement
    const underperforming = comparisons.filter(comp => 
      Object.values(comp.scores).some(score => score < 0.5)
    );
    
    if (underperforming.length > 0) {
      recommendations.push(
        `Consider optimizing: ${underperforming.map(a => a.agentName).join(', ')}`
      );
    }
    
    return recommendations;
  }
}

interface PerformanceMetric {
  timestamp: number;
  responseTime: number;
  memoryUsage: number;
  memoryDelta: number;
  success: boolean;
}

export interface AgentComparison {
  agents: AgentComparisonResult[];
  criteria: string[];
  ranking: AgentRanking[];
  recommendations: string[];
}

export interface AgentComparisonResult {
  agentName: string;
  scores: Record<string, number>;
}

export interface AgentRanking {
  agentName: string;
  totalScore: number;
  rank: number;
}

// Singleton instance
export const agentAnalyzer = new AgentAnalyzer();