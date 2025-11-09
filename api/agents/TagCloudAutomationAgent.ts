import { AgentHandler, AgentMessage } from '../core/AgentOrchestrator';
import {
  runTagCloudAutomationCycle,
  startHashtagAutomationScheduler,
  stopHashtagAutomationScheduler,
  listAutomationSegments,
} from '../../utils/hashtagCloudAutomation';

type AutomationAction =
  | 'runCycle'
  | 'startScheduler'
  | 'stopScheduler'
  | 'listSegments';

interface AutomationPayload {
  action?: AutomationAction;
  intervalMinutes?: number;
  createdBy?: string;
}

export default class TagCloudAutomationAgent implements AgentHandler {
  async handle(message: AgentMessage): Promise<any> {
    const payload: AutomationPayload = message.payload || {};
    const action = payload.action || 'runCycle';

    switch (action) {
      case 'runCycle':
        return runTagCloudAutomationCycle({
          createdBy: payload.createdBy || message.userId,
        });

      case 'startScheduler':
        return startHashtagAutomationScheduler({
          intervalMinutes: payload.intervalMinutes,
          createdBy: payload.createdBy || message.userId,
        });

      case 'stopScheduler':
        stopHashtagAutomationScheduler();
        return { stopped: true };

      case 'listSegments':
        return listAutomationSegments();

      default:
        throw new Error(`Unknown automation action: ${action}`);
    }
  }

  getCapabilities(): string[] {
    return [
      'scheduled-tag-cloud-generation',
      'automated-trending-analysis',
      'segment-management',
    ];
  }

  getStatus(): 'ready' | 'busy' | 'error' {
    return 'ready';
  }
}

