
import { AgentHandler, AgentMessage } from '../core/AgentOrchestrator';
import { Transform, pipeline } from 'stream';

export default class Composite_ProcessorAgent1_ProcessorAgent2 implements AgentHandler {
  private processors: Transform[] = [];

  async handle(message: AgentMessage): Promise<any> {
    const data = message.payload.data;
    return this.processData(data);
  }

  private async processData(data: any): Promise<any> {
    {{dataProcessingLogic}}
  }

  
  async processSequential(data: any): Promise<any> {
    
            let result = data;
            result = await this.agent0.process(result);
            result = await this.agent1.process(result);
            return result;
          
  }
}
