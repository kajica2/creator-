# MetaAgentBuilder System Guide

## Overview

The MetaAgentBuilder is a sophisticated AI system that creates other AI agents dynamically. Think of it as an "agent factory" that can build, deploy, test, and optimize specialized agents for your viral content platform.

## Quick Start

### 1. Basic Agent Creation

```typescript
import { MetaAgentBuilder } from '../api/agents/MetaAgentBuilder';

const metaBuilder = new MetaAgentBuilder();

// Define what you want your agent to do
const requirements = {
  name: 'HashtagGeneratorAgent',
  description: 'Generates viral hashtags for social media',
  features: ['hashtag generation', 'trend analysis', 'engagement prediction'],
  operations: ['generateHashtags', 'analyzeTrends', 'predictEngagement']
};

// Create the agent
const result = await metaBuilder.handle({
  action: 'generate-blueprint',
  payload: { requirements },
  userId: 'your-user-id'
});
```

### 2. Deploy and Use

```typescript
// Deploy the created agent
await metaBuilder.handle({
  action: 'deploy',
  payload: { agentName: 'HashtagGeneratorAgent' },
  userId: 'your-user-id'
});

// Now you can use it through the spawner
import { agentSpawner } from '../src/lib/AgentSpawner';

const result = await agentSpawner.executeOnAgent(agentId, {
  action: 'generateHashtags',
  payload: {
    content: 'Amazing AI breakthrough in healthcare',
    platform: 'twitter',
    targetAudience: 'tech-enthusiasts'
  },
  userId: 'your-user-id'
});
```

## Core Concepts

### Agent Blueprint
Think of this as a recipe for creating an agent. It defines:
- **Name**: What to call your agent
- **Capabilities**: What it can do (e.g., 'data-processing', 'api-integration')
- **Methods**: Specific functions it can perform
- **Config**: How it should behave (timeouts, retry policies, etc.)

### Agent Templates
Pre-built patterns for common agent types:
- **Base Template**: General purpose agents
- **Data Processor**: For transforming and analyzing data
- **API Connector**: For interacting with external services

### Agent Registry
A central directory where all your agents are registered and can be discovered by their capabilities.

## Common Use Cases for Your Viral Content Platform

### 1. Content Analysis Agent

```typescript
const contentAnalyzer = {
  name: 'ContentAnalyzerAgent',
  features: ['sentiment analysis', 'engagement prediction', 'trend detection'],
  operations: ['analyzeSentiment', 'predictEngagement', 'detectTrends'],
  performance: {
    maxResponseTime: 1500, // Must respond within 1.5 seconds
    throughputRequirement: 100 // Handle 100 requests per second
  }
};
```

**What it does**: Analyzes user content to predict how viral it might become.

### 2. Hashtag Optimization Agent

```typescript
const hashtagOptimizer = {
  name: 'HashtagOptimizerAgent',
  features: ['hashtag generation', 'trend analysis', 'audience targeting'],
  operations: ['generateHashtags', 'optimizeForPlatform', 'analyzeCompetition'],
  integrations: ['twitter-api', 'instagram-api', 'tiktok-api']
};
```

**What it does**: Creates and optimizes hashtags based on current trends and platform-specific algorithms.

### 3. Image Enhancement Agent

```typescript
const imageEnhancer = {
  name: 'ImageEnhancerAgent',
  features: ['image processing', 'ai enhancement', 'format optimization'],
  operations: ['enhanceImage', 'optimizeForPlatform', 'generateAltText'],
  dependencies: ['sharp', 'tensorflow']
};
```

**What it does**: Automatically enhances images for maximum engagement on different platforms.

## Advanced Features

### Composite Agents (Agent Workflows)

Create powerful workflows by combining multiple agents:

```typescript
// Create a complete content optimization pipeline
const pipeline = await metaBuilder.handle({
  action: 'compose',
  payload: {
    agentNames: [
      'ContentAnalyzerAgent',
      'HashtagOptimizerAgent',
      'ImageEnhancerAgent'
    ],
    compositionStrategy: 'sequential' // Run one after another
  },
  userId: 'your-user-id'
});
```

This creates a single agent that:
1. Analyzes your content
2. Generates optimal hashtags
3. Enhances your images
All in one call!

### Auto-Scaling Deployment

Deploy agents that automatically scale based on demand:

```typescript
import { agentSpawner } from '../src/lib/AgentSpawner';

const agentId = await agentSpawner.spawnFromBlueprint(blueprint, {
  scaling: {
    enabled: true,
    minInstances: 2,      // Always keep 2 running
    maxInstances: 10,     // Scale up to 10 when busy
    scaleUpThreshold: 0.8,    // Scale up when 80% busy
    scaleDownThreshold: 0.3   // Scale down when 30% busy
  },
  healthCheck: {
    enabled: true,
    interval: 30000,    // Check health every 30 seconds
    retries: 3          // Restart if 3 health checks fail
  }
});
```

### Performance Monitoring

Monitor how your agents are performing:

```typescript
import { agentRegistry } from '../src/lib/AgentRegistry';

// Get performance stats
const stats = agentRegistry.getStats();
console.log(`Total agents: ${stats.totalAgents}`);
console.log(`Average response time: ${stats.averageResponseTime}ms`);
console.log(`Error rate: ${(stats.totalErrors / stats.totalRequests * 100).toFixed(2)}%`);

// Get specific agent metrics
const agent = agentRegistry.get('HashtagGeneratorAgent');
console.log(`Request count: ${agent.metrics.requestCount}`);
console.log(`Error count: ${agent.metrics.errorCount}`);
```

## Testing Your Agents

### Automated Test Generation

```typescript
import { agentTestFramework } from '../src/lib/AgentTestFramework';

// Generate comprehensive tests automatically
const testCases = await agentTestFramework.generateTestCases('HashtagGeneratorAgent', {
  includeEdgeCases: true,      // Test with unusual inputs
  includeErrorCases: true,     // Test error handling
  includePerformanceTests: true, // Test speed and efficiency
  includeSecurityTests: true   // Test for vulnerabilities
});

// Run the tests
const testSuite = {
  name: 'Hashtag Generator Test Suite',
  testCases: testCases,
  config: {
    parallel: true,    // Run tests in parallel for speed
    timeout: 30000     // 30 second timeout per test
  }
};

const results = await agentTestFramework.runTestSuite('HashtagGeneratorAgent', testSuite);
console.log(`Passed: ${results.passedTests}/${results.totalTests}`);
```

### Custom Tests

Create specific tests for your use case:

```typescript
const customTests = [{
  name: 'trending_hashtag_generation',
  description: 'Test hashtag generation for trending topics',
  action: 'generateHashtags',
  payload: {
    content: 'Breaking: New AI technology changes everything',
    platform: 'twitter',
    targetAudience: 'tech-enthusiasts'
  },
  expectedResult: {
    hashtags: expect.arrayContaining(['#AI', '#TechNews']),
    score: expect.any(Number)
  }
}];
```

## Optimization and Analysis

### Performance Analysis

```typescript
import { agentAnalyzer } from '../src/lib/AgentAnalyzer';

// Analyze agent performance
const performanceReport = await agentAnalyzer.analyzePerformance('HashtagGeneratorAgent');

console.log(`Average response time: ${performanceReport.averageResponseTime}ms`);
console.log(`Throughput: ${performanceReport.throughput} requests/sec`);
console.log(`Success rate: ${(performanceReport.successRate * 100)}%`);

// Get optimization recommendations
if (performanceReport.averageResponseTime > 2000) {
  console.log('⚠️  Agent is slow, consider optimization');
}
```

### Capability Analysis

```typescript
// Analyze what your agent can actually do vs what it claims
const capabilityAnalysis = await agentAnalyzer.analyzeCapabilities('HashtagGeneratorAgent');

console.log('Declared capabilities:', capabilityAnalysis.declaredCapabilities);
console.log('Inferred capabilities:', capabilityAnalysis.inferredCapabilities);
console.log('Missing capabilities:', capabilityAnalysis.missingCapabilities);
console.log('Compatibility score:', capabilityAnalysis.compatibilityScore);
```

### Auto-Optimization

```typescript
// Let the system optimize your agent automatically
const optimization = await metaBuilder.handle({
  action: 'optimize',
  payload: { agentName: 'HashtagGeneratorAgent' },
  userId: 'your-user-id'
});

console.log(`Applied ${optimization.optimizations.length} optimizations:`);
optimization.optimizations.forEach((opt, i) => {
  console.log(`${i + 1}. ${opt}`);
});
```

## Best Practices

### 1. Agent Design
- **Be Specific**: Clear, descriptive names and capabilities
- **Keep It Simple**: One agent should do one thing well
- **Plan for Scale**: Consider performance requirements upfront

```typescript
// ✅ Good: Specific and focused
const goodAgent = {
  name: 'TwitterHashtagGenerator',
  capabilities: ['hashtag-generation', 'twitter-optimization'],
  // ...
};

// ❌ Bad: Too broad and vague
const badAgent = {
  name: 'SocialMediaAgent',
  capabilities: ['everything', 'general-purpose'],
  // ...
};
```

### 2. Performance
- **Set Timeouts**: Always specify reasonable timeouts
- **Use Async**: For any I/O operations
- **Monitor Resources**: Keep an eye on memory and CPU usage

```typescript
const performantAgent = {
  config: {
    timeout: 5000,        // 5 second timeout
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2
    },
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000     // 100 requests per minute
    }
  }
};
```

### 3. Security
- **Validate Inputs**: Never trust user input
- **Use Rate Limiting**: Prevent abuse
- **Enable Logging**: Track what's happening

```typescript
const secureAgent = {
  config: {
    permissions: ['read-content', 'generate-hashtags'], // Specific permissions only
    environment: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    }
  },
  security: {
    authentication: true,
    auditLogging: true,
    dataPrivacy: ['user-content']
  }
};
```

## Troubleshooting

### Common Issues

#### Agent Creation Fails
```
Error: Agent name is required
```
**Solution**: Make sure your blueprint has all required fields:
- name
- capabilities (at least one)
- methods (at least one)

#### Deployment Issues
```
Error: Failed to deploy agent
```
**Solution**: Check that:
- The agent was created successfully
- All dependencies are available
- File permissions are correct

#### Performance Problems
```
Agent response time > 5000ms
```
**Solution**:
1. Check resource usage
2. Review algorithm efficiency
3. Consider caching
4. Use auto-optimization

### Debug Mode

Enable detailed logging:

```typescript
// Set environment variable
process.env.DEBUG = 'meta-agent:*';

// Or for specific components
process.env.DEBUG = 'meta-agent:builder,meta-agent:spawner';
```

### Health Monitoring

Set up monitoring for production:

```typescript
// Monitor agent health
agentSpawner.on('agent-error', (event) => {
  console.error(`Agent ${event.agentId} error:`, event.error);
  // Send alert to your monitoring system
});

// Monitor performance
agentSpawner.on('agent-executed', (event) => {
  if (event.responseTime > 5000) {
    console.warn(`Slow agent execution: ${event.responseTime}ms`);
  }
});
```

## Real-World Examples

### Example 1: Viral Content Pipeline

Create a complete content optimization system:

```typescript
async function createViralContentPipeline() {
  // 1. Create specialized agents
  const agents = [
    {
      name: 'ContentAnalyzer',
      features: ['sentiment-analysis', 'readability-check']
    },
    {
      name: 'HashtagGenerator',
      features: ['hashtag-generation', 'trend-analysis']
    },
    {
      name: 'ImageOptimizer',
      features: ['image-enhancement', 'platform-optimization']
    }
  ];

  // 2. Create each agent
  for (const agentSpec of agents) {
    await metaBuilder.handle({
      action: 'generate-blueprint',
      payload: { requirements: agentSpec },
      userId: 'system'
    });
  }

  // 3. Create pipeline
  const pipeline = await metaBuilder.handle({
    action: 'compose',
    payload: {
      agentNames: ['ContentAnalyzer', 'HashtagGenerator', 'ImageOptimizer'],
      compositionStrategy: 'sequential'
    },
    userId: 'system'
  });

  return pipeline;
}
```

### Example 2: A/B Testing Agent

```typescript
const abTestAgent = {
  name: 'ABTestingAgent',
  features: ['experiment-design', 'statistical-analysis', 'result-interpretation'],
  operations: ['createExperiment', 'trackResults', 'analyzeSignificance'],
  config: {
    timeout: 10000,
    permissions: ['read-analytics', 'write-experiments']
  }
};

// Use it to test different hashtag strategies
const experiment = await agentSpawner.executeOnAgent(abTestAgentId, {
  action: 'createExperiment',
  payload: {
    variants: [
      { hashtags: ['#AI', '#Tech', '#Innovation'] },
      { hashtags: ['#ArtificialIntelligence', '#Technology', '#Future'] }
    ],
    metric: 'engagement_rate',
    duration: '7d'
  }
});
```

## Integration with Your App

### React Component Integration

```typescript
// Hook for using agents in your React components
import { useAgent } from '../hooks/useAgent';

function HashtagSuggestions({ content }) {
  const { executeAgent, loading, error } = useAgent('HashtagGeneratorAgent');

  const generateHashtags = async () => {
    const result = await executeAgent({
      action: 'generateHashtags',
      payload: { content, platform: 'twitter' }
    });

    return result.hashtags;
  };

  // ... component logic
}
```

### API Endpoint Integration

```typescript
// Express.js API endpoint
app.post('/api/generate-hashtags', async (req, res) => {
  try {
    const { content, platform } = req.body;

    const result = await agentSpawner.executeWithLoadBalancing(
      'HashtagGeneratorAgent',
      {
        action: 'generateHashtags',
        payload: { content, platform },
        userId: req.user.id
      },
      'round-robin'
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Advanced Configuration

### Custom Templates

Create your own agent templates:

```typescript
const customTemplate = `
import { AgentHandler, AgentMessage } from '../core/AgentOrchestrator';
import { ViralContentAPI } from '../services/ViralContentAPI';

export default class {{AgentName}} implements AgentHandler {
  private viralAPI = new ViralContentAPI();

  async handle(message: AgentMessage): Promise<any> {
    switch (message.action) {
      case 'analyze':
        return this.analyzeContent(message.payload);
      case 'optimize':
        return this.optimizeContent(message.payload);
      default:
        throw new Error(\`Unknown action: \${message.action}\`);
    }
  }

  private async analyzeContent(payload: any) {
    // Your custom analysis logic here
    return this.viralAPI.analyzeViralPotential(payload.content);
  }

  private async optimizeContent(payload: any) {
    // Your custom optimization logic here
    return this.viralAPI.optimizeForEngagement(payload.content);
  }

  getCapabilities(): string[] {
    return ['viral-analysis', 'content-optimization'];
  }

  getStatus(): 'ready' | 'busy' | 'error' {
    return 'ready';
  }
}
`;

// Register your template
metaBuilder.registerTemplate('viral-content', customTemplate);
```

### Environment Configuration

```typescript
// .env configuration for MetaAgentBuilder
AGENT_OUTPUT_DIR=./api/agents/generated
AGENT_TEMPLATE_DIR=./templates
DEFAULT_TIMEOUT=30000
MAX_MEMORY_PER_AGENT=512
MAX_AGENTS_PER_TYPE=10
ENABLE_CODE_ANALYSIS=true
ENABLE_SECURITY_SCANNING=true
REQUIRE_AUTHENTICATION=true
```

## Next Steps

1. **Start Small**: Create one simple agent first
2. **Test Thoroughly**: Use the testing framework extensively
3. **Monitor Performance**: Set up health checks and monitoring
4. **Optimize Iteratively**: Use analysis tools to improve your agents
5. **Scale Gradually**: Add auto-scaling as your usage grows

## Resources

- **Documentation**: `/docs/MetaAgentBuilder.md`
- **Examples**: `/examples/sample-agent-creation.ts`
- **Tests**: `/tests/unit/MetaAgentBuilder.test.ts`
- **Types**: `/src/types/AgentTypes.ts`

Remember: The MetaAgentBuilder is designed to make AI agent creation simple and powerful. Start with the basics and gradually explore the advanced features as your needs grow!