import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MetaAgentBuilder } from '../../api/agents/MetaAgentBuilder';
import { AgentBlueprint, AgentRequirements } from '../../src/types/AgentTypes';

describe('MetaAgentBuilder', () => {
  let metaBuilder: MetaAgentBuilder;
  
  beforeEach(() => {
    metaBuilder = new MetaAgentBuilder();
  });
  
  afterEach(() => {
    // Cleanup any created agents
  });
  
  describe('Agent Creation', () => {
    it('should create a basic agent from blueprint', async () => {
      const blueprint: AgentBlueprint = {
        name: 'TestAgent',
        description: 'A test agent',
        capabilities: ['data-processing'],
        methods: [{
          name: 'process',
          description: 'Process data',
          parameters: [{
            name: 'data',
            type: 'any',
            required: true
          }],
          returnType: 'any',
          async: true
        }],
        metadata: {
          version: '1.0.0',
          author: 'test',
          tags: ['test'],
          created: new Date(),
          updated: new Date()
        }
      };
      
      const result = await metaBuilder.handle({
        action: 'create',
        payload: { blueprint },
        userId: 'test-user'
      });
      
      expect(result.success).toBe(true);
      expect(result.agentName).toBe('TestAgent');
      expect(result.capabilities).toEqual(['data-processing']);
    });
    
    it('should validate blueprint before creation', async () => {
      const invalidBlueprint = {
        // Missing required fields
        description: 'Invalid agent'
      };
      
      await expect(
        metaBuilder.handle({
          action: 'create',
          payload: { blueprint: invalidBlueprint },
          userId: 'test-user'
        })
      ).rejects.toThrow('Agent name is required');
    });
    
    it('should generate blueprint from requirements', async () => {
      const requirements: AgentRequirements = {
        name: 'DataProcessor',
        description: 'Process data efficiently',
        features: ['data transformation', 'validation'],
        operations: ['transform', 'validate'],
        dataTypes: ['json', 'xml'],
        performance: {
          maxResponseTime: 1000,
          throughputRequirement: 100,
          memoryLimit: 512,
          cpuLimit: 80
        },
        security: {
          authentication: true,
          authorization: false,
          encryption: false,
          auditLogging: true,
          dataPrivacy: ['pii']
        },
        tags: ['data', 'processing']
      };
      
      const blueprint = await metaBuilder.handle({
        action: 'generate-blueprint',
        payload: { requirements },
        userId: 'test-user'
      });
      
      expect(blueprint.name).toBe('DataProcessor');
      expect(blueprint.capabilities).toContain('data-processing');
      expect(blueprint.methods.length).toBeGreaterThan(0);
    });
  });
  
  describe('Agent Composition', () => {
    it('should compose multiple agents sequentially', async () => {
      // First create some base agents
      const agent1Blueprint: AgentBlueprint = {
        name: 'ProcessorAgent1',
        description: 'First processor',
        capabilities: ['data-processing'],
        methods: [{
          name: 'process',
          description: 'Process step 1',
          parameters: [{ name: 'data', type: 'any', required: true }],
          returnType: 'any',
          async: true
        }],
        metadata: {
          version: '1.0.0',
          author: 'test',
          tags: ['processor'],
          created: new Date(),
          updated: new Date()
        }
      };
      
      const agent2Blueprint: AgentBlueprint = {
        name: 'ProcessorAgent2',
        description: 'Second processor',
        capabilities: ['data-validation'],
        methods: [{
          name: 'validate',
          description: 'Validate step 2',
          parameters: [{ name: 'data', type: 'any', required: true }],
          returnType: 'boolean',
          async: true
        }],
        metadata: {
          version: '1.0.0',
          author: 'test',
          tags: ['validator'],
          created: new Date(),
          updated: new Date()
        }
      };
      
      // Create the base agents
      await metaBuilder.handle({
        action: 'create',
        payload: { blueprint: agent1Blueprint },
        userId: 'test-user'
      });
      
      await metaBuilder.handle({
        action: 'create',
        payload: { blueprint: agent2Blueprint },
        userId: 'test-user'
      });
      
      // Compose them
      const compositeResult = await metaBuilder.handle({
        action: 'compose',
        payload: {
          agentNames: ['ProcessorAgent1', 'ProcessorAgent2'],
          compositionStrategy: 'sequential'
        },
        userId: 'test-user'
      });
      
      expect(compositeResult.success).toBe(true);
      expect(compositeResult.agentName).toContain('Composite');
    });
  });
  
  describe('Agent Testing', () => {
    it('should test agent with sample cases', async () => {
      const blueprint: AgentBlueprint = {
        name: 'TestableAgent',
        description: 'Agent for testing',
        capabilities: ['testing'],
        methods: [{
          name: 'echo',
          description: 'Echo input',
          parameters: [{ name: 'message', type: 'string', required: true }],
          returnType: 'string',
          implementation: 'return payload.message;',
          async: false
        }],
        metadata: {
          version: '1.0.0',
          author: 'test',
          tags: ['test'],
          created: new Date(),
          updated: new Date()
        }
      };
      
      await metaBuilder.handle({
        action: 'create',
        payload: { blueprint },
        userId: 'test-user'
      });
      
      await metaBuilder.handle({
        action: 'deploy',
        payload: { agentName: 'TestableAgent' },
        userId: 'test-user'
      });
      
      const testCases = [{
        name: 'echo_test',
        action: 'echo',
        payload: { message: 'hello' }
      }];
      
      const testResult = await metaBuilder.handle({
        action: 'test',
        payload: {
          agentName: 'TestableAgent',
          testCases
        },
        userId: 'test-user'
      });
      
      expect(testResult.totalTests).toBe(1);
      expect(testResult.passed).toBe(1);
      expect(testResult.failed).toBe(0);
    });
  });
  
  describe('Agent Optimization', () => {
    it('should optimize agent configuration', async () => {
      const blueprint: AgentBlueprint = {
        name: 'UnoptimizedAgent',
        description: 'Agent needing optimization',
        capabilities: ['basic'],
        methods: [{
          name: 'process',
          description: 'Process data',
          parameters: [{ name: 'data', type: 'any', required: true }],
          returnType: 'any',
          async: false // Not async but should be
        }],
        metadata: {
          version: '1.0.0',
          author: 'test',
          tags: ['unoptimized'],
          created: new Date(),
          updated: new Date()
        }
      };
      
      await metaBuilder.handle({
        action: 'create',
        payload: { blueprint },
        userId: 'test-user'
      });
      
      const optimizationResult = await metaBuilder.handle({
        action: 'optimize',
        payload: { agentName: 'UnoptimizedAgent' },
        userId: 'test-user'
      });
      
      expect(optimizationResult.agentName).toBe('UnoptimizedAgent');
      expect(optimizationResult.optimized).toBe(true);
      expect(optimizationResult.optimizations.length).toBeGreaterThan(0);
    });
  });
  
  describe('Agent Analysis', () => {
    it('should analyze agent capabilities', async () => {
      const blueprint: AgentBlueprint = {
        name: 'AnalyzableAgent',
        description: 'Agent for analysis',
        capabilities: ['data-processing', 'api-integration'],
        methods: [{
          name: 'fetchAndProcess',
          description: 'Fetch data from API and process it',
          parameters: [{ name: 'url', type: 'string', required: true }],
          returnType: 'any',
          implementation: 'const data = await fetch(url); return processData(data);',
          async: true
        }],
        dependencies: ['axios'],
        metadata: {
          version: '1.0.0',
          author: 'test',
          tags: ['analysis'],
          created: new Date(),
          updated: new Date()
        }
      };
      
      await metaBuilder.handle({
        action: 'create',
        payload: { blueprint },
        userId: 'test-user'
      });
      
      const analysis = await metaBuilder.handle({
        action: 'analyze',
        payload: { agentName: 'AnalyzableAgent' },
        userId: 'test-user'
      });
      
      expect(analysis.name).toBe('AnalyzableAgent');
      expect(analysis.capabilities).toContain('data-processing');
      expect(analysis.capabilities).toContain('api-integration');
      expect(analysis.methods.length).toBe(1);
      expect(analysis.dependencies).toContain('axios');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle unknown actions gracefully', async () => {
      await expect(
        metaBuilder.handle({
          action: 'unknown-action' as any,
          payload: {},
          userId: 'test-user'
        })
      ).rejects.toThrow('Unknown action: unknown-action');
    });
    
    it('should handle missing agent names', async () => {
      await expect(
        metaBuilder.handle({
          action: 'deploy',
          payload: { agentName: 'NonExistentAgent' },
          userId: 'test-user'
        })
      ).rejects.toThrow('Agent NonExistentAgent not found in registry');
    });
  });
  
  describe('Agent Lifecycle', () => {
    it('should manage complete agent lifecycle', async () => {
      const blueprint: AgentBlueprint = {
        name: 'LifecycleAgent',
        description: 'Agent for lifecycle testing',
        capabilities: ['lifecycle'],
        methods: [{
          name: 'work',
          description: 'Do some work',
          parameters: [],
          returnType: 'string',
          implementation: 'return "working";',
          async: false
        }],
        metadata: {
          version: '1.0.0',
          author: 'test',
          tags: ['lifecycle'],
          created: new Date(),
          updated: new Date()
        }
      };
      
      // Create
      const createResult = await metaBuilder.handle({
        action: 'create',
        payload: { blueprint },
        userId: 'test-user'
      });
      expect(createResult.success).toBe(true);
      
      // List
      const listResult = await metaBuilder.handle({
        action: 'list',
        payload: {},
        userId: 'test-user'
      });
      expect(listResult.agents.some((a: any) => a.name === 'LifecycleAgent')).toBe(true);
      
      // Update
      const updatedBlueprint = { ...blueprint, description: 'Updated description' };
      const updateResult = await metaBuilder.handle({
        action: 'update',
        payload: { agentName: 'LifecycleAgent', updates: updatedBlueprint },
        userId: 'test-user'
      });
      expect(updateResult.success).toBe(true);
      
      // Delete
      const deleteResult = await metaBuilder.handle({
        action: 'delete',
        payload: { agentName: 'LifecycleAgent' },
        userId: 'test-user'
      });
      expect(deleteResult.success).toBe(true);
      
      // Verify deletion
      const listAfterDelete = await metaBuilder.handle({
        action: 'list',
        payload: {},
        userId: 'test-user'
      });
      expect(listAfterDelete.agents.some((a: any) => a.name === 'LifecycleAgent')).toBe(false);
    });
  });
});

// Helper function for creating test blueprints
function createTestBlueprint(name: string, capabilities: string[] = ['test']): AgentBlueprint {
  return {
    name,
    description: `Test agent ${name}`,
    capabilities,
    methods: [{
      name: 'test',
      description: 'Test method',
      parameters: [],
      returnType: 'string',
      async: false
    }],
    metadata: {
      version: '1.0.0',
      author: 'test',
      tags: ['test'],
      created: new Date(),
      updated: new Date()
    }
  };
}