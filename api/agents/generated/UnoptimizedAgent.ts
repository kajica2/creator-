
import { AgentHandler, AgentMessage } from '../core/AgentOrchestrator';

export default class UnoptimizedAgent implements AgentHandler {
  private config: any;
  private state: Map<string, any> = new Map();

  constructor(config?: any) {
    this.config = config || {};
    
  }

  async handle(message: AgentMessage): Promise<any> {
    const { action, payload } = message;
    
    switch (action) {
      case 'process':
        return this.process(payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  getCapabilities(): string[] {
    return ["basic"];
  }

  getStatus(): 'ready' | 'busy' | 'error' {
    return 'ready';
  }

  
  process(data: any): any {
    // TODO: Implement this method
  }
}
