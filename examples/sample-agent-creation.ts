import { MetaAgentBuilder } from '../api/agents/MetaAgentBuilder';
import { agentSpawner } from '../src/lib/AgentSpawner';
import { agentTestFramework } from '../src/lib/AgentTestFramework';
import { agentAnalyzer } from '../src/lib/AgentAnalyzer';
import { AgentBlueprint, AgentRequirements } from '../src/types/AgentTypes';

/**
 * Example: Creating a Viral Content Agent using MetaAgentBuilder
 * 
 * This example demonstrates how to use the MetaAgentBuilder to create,
 * deploy, test, and optimize an agent specifically for viral content creation.
 */

async function createViralContentAgent() {
  console.log('🚀 Creating Viral Content Agent...');
  
  const metaBuilder = new MetaAgentBuilder();
  
  // Define requirements for viral content agent
  const requirements: AgentRequirements = {
    name: 'ViralContentAgent',
    description: 'Generates viral hashtags and optimizes content for social media engagement',
    features: [
      'hashtag generation',
      'sentiment analysis', 
      'trend analysis',
      'engagement prediction',
      'content optimization'
    ],
    operations: [
      'generateHashtags',
      'analyzeSentiment',
      'predictEngagement',
      'optimizeContent',
      'trackTrends'
    ],
    dataTypes: ['text', 'json', 'image-metadata'],
    integrations: ['social-media-apis', 'ai-services'],
    performance: {
      maxResponseTime: 2000,
      throughputRequirement: 50,
      memoryLimit: 512,
      cpuLimit: 70
    },
    security: {
      authentication: true,
      authorization: false,
      encryption: false,
      auditLogging: true,
      dataPrivacy: ['user-content', 'social-data']
    },
    constraints: [
      'No offensive content generation',
      'Respect platform guidelines',
      'Maintain brand safety'
    ],
    tags: ['viral', 'content', 'social-media', 'hashtags']
  };
  
  try {
    // Step 1: Generate blueprint from requirements
    console.log('📋 Generating agent blueprint...');
    const blueprint = await metaBuilder.handle({
      action: 'generate-blueprint',
      payload: { requirements },
      userId: 'system'
    });
    
    console.log('✅ Blueprint generated:', blueprint.name);
    console.log('📊 Capabilities:', blueprint.capabilities);
    
    // Step 2: Create the agent
    console.log('🔨 Creating agent from blueprint...');
    const createResult = await metaBuilder.handle({
      action: 'create',
      payload: { blueprint },
      userId: 'system'
    });
    
    console.log('✅ Agent created:', createResult.message);
    
    // Step 3: Deploy the agent
    console.log('🚀 Deploying agent...');
    const deployResult = await metaBuilder.handle({
      action: 'deploy',
      payload: { agentName: 'ViralContentAgent' },
      userId: 'system'
    });
    
    console.log('✅ Agent deployed:', deployResult.status);
    
    return blueprint;
  } catch (error) {
    console.error('❌ Error creating agent:', error);
    throw error;
  }
}

async function testViralContentAgent() {
  console.log('🧪 Testing Viral Content Agent...');
  
  const metaBuilder = new MetaAgentBuilder();
  
  // Generate comprehensive test cases
  const testCases = await agentTestFramework.generateTestCases('ViralContentAgent', {
    includeEdgeCases: true,
    includeErrorCases: true,
    includePerformanceTests: true,
    includeSecurityTests: true
  });
  
  // Add custom test cases specific to viral content
  const customTestCases = [
    {
      name: 'generate_trending_hashtags',
      description: 'Test hashtag generation for trending topics',
      action: 'generateHashtags',
      payload: {
        content: 'Amazing new AI breakthrough in healthcare',
        platform: 'twitter',
        targetAudience: 'tech-enthusiasts'
      },
      expectedResult: {
        hashtags: expect.any(Array),
        score: expect.any(Number)
      }
    },
    {
      name: 'analyze_content_sentiment',
      description: 'Test sentiment analysis of content',
      action: 'analyzeSentiment',
      payload: {
        content: 'This is the most incredible innovation I have ever seen!'
      },
      expectedResult: {
        sentiment: 'positive',
        confidence: expect.any(Number)
      }
    },
    {
      name: 'predict_engagement_score',
      description: 'Test engagement prediction',
      action: 'predictEngagement',
      payload: {
        content: 'Check out this amazing new feature!',
        hashtags: ['#innovation', '#tech', '#amazing'],
        platform: 'instagram'
      },
      expectedResult: {
        engagementScore: expect.any(Number),
        recommendations: expect.any(Array)
      }
    }
  ];
  
  // Run all tests
  try {
    console.log('📝 Running generated test cases...');
    const testResult = await metaBuilder.handle({
      action: 'test',
      payload: {
        agentName: 'ViralContentAgent',
        testCases: [...testCases, ...customTestCases]
      },
      userId: 'system'
    });
    
    console.log('✅ Test Results:');
    console.log(`   Total Tests: ${testResult.totalTests}`);
    console.log(`   Passed: ${testResult.passed}`);
    console.log(`   Failed: ${testResult.failed}`);
    console.log(`   Success Rate: ${((testResult.passed / testResult.totalTests) * 100).toFixed(1)}%`);
    
    return testResult;
  } catch (error) {
    console.error('❌ Testing failed:', error);
    throw error;
  }
}

async function analyzeViralContentAgent() {
  console.log('🔍 Analyzing Viral Content Agent...');
  
  try {
    // Capability analysis
    const capabilityAnalysis = await agentAnalyzer.analyzeCapabilities('ViralContentAgent');
    console.log('📊 Capability Analysis:');
    console.log(`   Compatibility Score: ${(capabilityAnalysis.compatibilityScore * 100).toFixed(1)}%`);
    console.log(`   Missing Capabilities: ${capabilityAnalysis.missingCapabilities}`);
    console.log(`   Redundant Capabilities: ${capabilityAnalysis.redundantCapabilities}`);
    
    // Performance analysis
    const performanceReport = await agentAnalyzer.analyzePerformance('ViralContentAgent');
    console.log('⚡ Performance Analysis:');
    console.log(`   Success Rate: ${(performanceReport.successRate * 100).toFixed(1)}%`);
    console.log(`   Avg Response Time: ${performanceReport.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Throughput: ${performanceReport.throughput.toFixed(2)} req/sec`);
    
    // Code analysis
    const codeAnalysis = await agentAnalyzer.analyzeCode('ViralContentAgent');
    console.log('🔒 Code Analysis:');
    console.log(`   Complexity Score: ${codeAnalysis.complexity}/100`);
    console.log(`   Maintainability Score: ${codeAnalysis.maintainability.toFixed(1)}/100`);
    console.log(`   Security Issues: ${codeAnalysis.securityIssues.length}`);
    console.log(`   Code Smells: ${codeAnalysis.codeSmells.length}`);
    
    return {
      capabilities: capabilityAnalysis,
      performance: performanceReport,
      code: codeAnalysis
    };
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    throw error;
  }
}

async function optimizeViralContentAgent() {
  console.log('⚡ Optimizing Viral Content Agent...');
  
  const metaBuilder = new MetaAgentBuilder();
  
  try {
    const optimization = await metaBuilder.handle({
      action: 'optimize',
      payload: { agentName: 'ViralContentAgent' },
      userId: 'system'
    });
    
    console.log('✅ Optimization Complete:');
    console.log(`   Optimizations Applied: ${optimization.optimizations.length}`);
    optimization.optimizations.forEach((opt: any, index: number) => {
      console.log(`   ${index + 1}. ${opt}`);
    });
    
    return optimization;
  } catch (error) {
    console.error('❌ Optimization failed:', error);
    throw error;
  }
}

async function scaleViralContentAgent() {
  console.log('📈 Scaling Viral Content Agent...');
  
  try {
    // Spawn with auto-scaling configuration
    const agentId = await agentSpawner.spawnFromRequirements({
      name: 'ViralContentAgent',
      description: 'Scaled viral content agent',
      features: ['hashtag generation', 'content optimization'],
      performance: {
        maxResponseTime: 1000,
        throughputRequirement: 100,
        memoryLimit: 256,
        cpuLimit: 60
      }
    }, {
      scaling: {
        enabled: true,
        minInstances: 2,
        maxInstances: 8,
        scaleUpThreshold: 0.8,
        scaleDownThreshold: 0.3,
        cooldownPeriod: 300000 // 5 minutes
      },
      healthCheck: {
        enabled: true,
        interval: 30000, // 30 seconds
        timeout: 5000,
        retries: 3
      }
    });
    
    console.log(`✅ Scaled agent deployed with ID: ${agentId}`);
    
    // Simulate load to trigger scaling
    console.log('🔥 Simulating load...');
    const promises = [];
    
    for (let i = 0; i < 100; i++) {
      const promise = agentSpawner.executeWithLoadBalancing(
        'ViralContentAgent',
        {
          action: 'generateHashtags',
          payload: {
            content: `Test content ${i}`,
            platform: 'twitter'
          },
          userId: 'load-test'
        },
        'round-robin'
      );
      promises.push(promise);
    }
    
    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    console.log(`✅ Load test completed: ${successful}/${results.length} successful`);
    
    return agentId;
  } catch (error) {
    console.error('❌ Scaling failed:', error);
    throw error;
  }
}

async function createCompositeAgent() {
  console.log('🔗 Creating Composite Viral Marketing Agent...');
  
  const metaBuilder = new MetaAgentBuilder();
  
  // First, create additional specialized agents
  const agents = [
    {
      name: 'HashtagGeneratorAgent',
      capabilities: ['hashtag-generation', 'trend-analysis']
    },
    {
      name: 'SentimentAnalyzerAgent', 
      capabilities: ['sentiment-analysis', 'emotion-detection']
    },
    {
      name: 'EngagementPredictorAgent',
      capabilities: ['engagement-prediction', 'performance-forecasting']
    }
  ];
  
  // Create each specialized agent
  for (const agentSpec of agents) {
    const blueprint: AgentBlueprint = {
      name: agentSpec.name,
      description: `Specialized ${agentSpec.name}`,
      capabilities: agentSpec.capabilities,
      methods: [{
        name: 'process',
        description: 'Process specialized task',
        parameters: [{ name: 'data', type: 'any', required: true }],
        returnType: 'any',
        async: true
      }],
      metadata: {
        version: '1.0.0',
        author: 'MetaAgentBuilder',
        tags: ['specialized'],
        created: new Date(),
        updated: new Date()
      }
    };
    
    await metaBuilder.handle({
      action: 'create',
      payload: { blueprint },
      userId: 'system'
    });
    
    console.log(`✅ Created ${agentSpec.name}`);
  }
  
  // Create composite agent
  const compositeResult = await metaBuilder.handle({
    action: 'compose',
    payload: {
      agentNames: [
        'HashtagGeneratorAgent',
        'SentimentAnalyzerAgent', 
        'EngagementPredictorAgent'
      ],
      compositionStrategy: 'pipeline'
    },
    userId: 'system'
  });
  
  console.log('✅ Composite agent created:', compositeResult.agentName);
  
  return compositeResult;
}

// Main execution function
async function runExample() {
  console.log('🎬 MetaAgentBuilder Viral Content Example Starting...');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Create the main viral content agent
    const blueprint = await createViralContentAgent();
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Step 2: Test the agent
    const testResults = await testViralContentAgent();
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Step 3: Analyze the agent
    const analysis = await analyzeViralContentAgent();
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Step 4: Optimize the agent
    const optimization = await optimizeViralContentAgent();
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Step 5: Scale the agent
    const scaledAgentId = await scaleViralContentAgent();
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Step 6: Create composite agent
    const composite = await createCompositeAgent();
    console.log('\n' + '='.repeat(60) + '\n');
    
    console.log('🎉 Example completed successfully!');
    console.log('\nSummary:');
    console.log(`📋 Blueprint: ${blueprint.name}`);
    console.log(`🧪 Tests: ${testResults.passed}/${testResults.totalTests} passed`);
    console.log(`📊 Performance: ${analysis.performance.averageResponseTime.toFixed(2)}ms avg`);
    console.log(`⚡ Optimizations: ${optimization.optimizations.length} applied`);
    console.log(`📈 Scaled Agent: ${scaledAgentId}`);
    console.log(`🔗 Composite Agent: ${composite.agentName}`);
    
  } catch (error) {
    console.error('❌ Example failed:', error);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample().catch(console.error);
}

export {
  createViralContentAgent,
  testViralContentAgent,
  analyzeViralContentAgent,
  optimizeViralContentAgent,
  scaleViralContentAgent,
  createCompositeAgent,
  runExample
};