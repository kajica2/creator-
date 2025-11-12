const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const path = require('path');

if (!isMainThread && parentPort) {
  // Worker thread logic
  let agentInstance = null;
  
  async function initializeAgent() {
    try {
      const { blueprint, options } = workerData;
      
      // Dynamically import the agent class
      const modulePath = path.join(
        process.cwd(),
        'api',
        'agents',
        'generated',
        `${blueprint.name}.js`
      );
      
      const AgentClass = await import(modulePath);
      agentInstance = new AgentClass.default(blueprint.config);
      
      // Signal ready
      parentPort.postMessage({ type: 'ready' });
    } catch (error) {
      parentPort.postMessage({ type: 'error', error: error.message });
    }
  }
  
  parentPort.on('message', async (message) => {
    if (message.type === 'execute') {
      try {
        if (!agentInstance) {
          throw new Error('Agent not initialized');
        }
        
        const result = await agentInstance.handle(message.message);
        
        parentPort.postMessage({
          messageId: message.messageId,
          result
        });
      } catch (error) {
        parentPort.postMessage({
          messageId: message.messageId,
          error: error.message
        });
      }
    }
  });
  
  // Initialize the agent
  initializeAgent();
  
  // Memory monitoring
  setInterval(() => {
    const usage = process.memoryUsage();
    parentPort.postMessage({
      type: 'memory-usage',
      usage
    });
  }, 10000); // Every 10 seconds
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    if (agentInstance && typeof agentInstance.destroy === 'function') {
      agentInstance.destroy();
    }
    process.exit(0);
  });
}