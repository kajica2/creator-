import { supabase } from '../../../utils/supabaseClient';

interface DrivePayload {
  isConnected: boolean;
  refreshToken?: string;
}

interface GeminiPayload {
  apiKey?: string;
  projectId?: string;
}

interface LogEntranceMetadata {
  visitId?: string;
}

export interface LogEntranceParams {
  role: 'visitor' | 'user' | 'admin';
  drive?: DrivePayload;
  gemini?: GeminiPayload;
  metadata?: LogEntranceMetadata;
}

export interface LogEntranceResult {
  logId: string;
}

function buildPayload(params: LogEntranceParams) {
  const payload: Record<string, unknown> = {
    role: params.role,
  };

  if (params.drive) {
    payload.drive = {
      isConnected: params.drive.isConnected,
      ...(params.drive.refreshToken ? { refreshToken: params.drive.refreshToken } : {}),
    };
  }

  if (params.gemini) {
    payload.gemini = {
      ...(params.gemini.apiKey ? { apiKey: params.gemini.apiKey } : {}),
      ...(params.gemini.projectId ? { projectId: params.gemini.projectId } : {}),
    };
  }

  if (params.metadata) {
    payload.metadata = params.metadata;
  }

  return payload;
}

export async function logEntrance(params: LogEntranceParams): Promise<LogEntranceResult> {
  const { data, error } = await supabase.functions.invoke('log-entrance', {
    body: buildPayload(params),
  });

  if (error) {
    throw new Error(error.message ?? 'Failed to log entrance');
  }

  if (!data || typeof (data as Record<string, unknown>).logId !== 'string') {
    throw new Error('Invalid response payload from log-entrance');
  }

  return data as LogEntranceResult;
}

