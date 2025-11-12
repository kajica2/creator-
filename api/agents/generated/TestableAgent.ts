
import { AgentHandler, AgentMessage } from '../core/AgentOrchestrator';

export default class TestableAgent implements AgentHandler {
  private config: any;
  private state: Map<string, any> = new Map();

  constructor(config?: any) {
    this.config = config || {};
    
  }

  async handle(message: AgentMessage): Promise<any> {
    const { action, payload } = message;
    
    switch (action) {
      case 'echo':
        return this.echo(payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  getCapabilities(): string[] {
    return ["testing"];
  }

  getStatus(): 'ready' | 'busy' | 'error' {
    return 'ready';
  }

  
  echo(message: string): string {
    return payload.message;
  }
}
