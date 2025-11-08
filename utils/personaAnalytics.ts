import { ContentStorage, Persona, StoredContentItem, PromptType, Page } from '../types';

export interface PersonaStats {
  persona: Persona;
  totalContent: number;
  contentByTool: Record<Page, number>;
  contentByType: Record<PromptType, number>;
  recentActivity: StoredContentItem[];
  averageGenerationsPerDay: number;
  mostUsedTools: Array<{ tool: Page; count: number }>;
  creationDate: Date;
  lastActivityDate: Date | null;
  productivityScore: number;
  contentDistribution: Array<{ type: string; count: number; percentage: number }>;
}

export interface PersonaInsights {
  topPersonas: PersonaStats[];
  totalGenerations: number;
  mostProductivePersona: PersonaStats | null;
  recentActivity: StoredContentItem[];
  toolUsageDistribution: Record<Page, number>;
  contentTypeDistribution: Record<PromptType, number>;
  dailyAverage: number;
  streakDays: number;
}

// Calculate detailed statistics for a single persona
export const getPersonaStats = (storage: ContentStorage, personaId: string): PersonaStats | null => {
  const persona = storage.personas.find(p => p.id === personaId);
  if (!persona) return null;

  const personaContent = storage.content.filter(item => item.personaId === personaId);
  const totalContent = personaContent.length;

  if (totalContent === 0) {
    return {
      persona,
      totalContent: 0,
      contentByTool: {} as Record<Page, number>,
      contentByType: {} as Record<PromptType, number>,
      recentActivity: [],
      averageGenerationsPerDay: 0,
      mostUsedTools: [],
      creationDate: new Date(persona.createdAt),
      lastActivityDate: null,
      productivityScore: 0,
      contentDistribution: []
    };
  }

  // Calculate content by tool
  const contentByTool: Record<Page, number> = {} as Record<Page, number>;
  const contentByType: Record<PromptType, number> = {} as Record<PromptType, number>;

  personaContent.forEach(item => {
    contentByTool[item.tool] = (contentByTool[item.tool] || 0) + 1;
    contentByType[item.type] = (contentByType[item.type] || 0) + 1;
  });

  // Get recent activity (last 10 items)
  const recentActivity = personaContent
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  // Calculate average generations per day
  const firstGeneration = Math.min(...personaContent.map(item => item.timestamp));
  const daysActive = Math.max(1, (Date.now() - firstGeneration) / (1000 * 60 * 60 * 24));
  const averageGenerationsPerDay = totalContent / daysActive;

  // Get most used tools
  const mostUsedTools = Object.entries(contentByTool)
    .map(([tool, count]) => ({ tool: tool as Page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate productivity score (0-100)
  const productivityScore = Math.min(100, Math.round((totalContent / 50) * 100));

  // Calculate content distribution
  const contentDistribution = Object.entries(contentByType)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalContent) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  const lastActivityDate = recentActivity.length > 0 ? new Date(recentActivity[0].timestamp) : null;

  return {
    persona,
    totalContent,
    contentByTool,
    contentByType,
    recentActivity,
    averageGenerationsPerDay,
    mostUsedTools,
    creationDate: new Date(persona.createdAt),
    lastActivityDate,
    productivityScore,
    contentDistribution
  };
};

// Get insights for all personas
export const getPersonaInsights = (storage: ContentStorage): PersonaInsights => {
  const allPersonaStats = storage.personas
    .map(persona => getPersonaStats(storage, persona.id))
    .filter((stats): stats is PersonaStats => stats !== null);

  // Sort personas by content count (most productive first)
  const topPersonas = allPersonaStats.sort((a, b) => b.totalContent - a.totalContent);

  const totalGenerations = storage.content.length;

  // Get most productive persona
  const mostProductivePersona = topPersonas.length > 0 ? topPersonas[0] : null;

  // Get recent activity across all personas
  const recentActivity = storage.content
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);

  // Calculate tool usage distribution
  const toolUsageDistribution: Record<Page, number> = {} as Record<Page, number>;
  storage.content.forEach(item => {
    toolUsageDistribution[item.tool] = (toolUsageDistribution[item.tool] || 0) + 1;
  });

  // Calculate content type distribution
  const contentTypeDistribution: Record<PromptType, number> = {} as Record<PromptType, number>;
  storage.content.forEach(item => {
    contentTypeDistribution[item.type] = (contentTypeDistribution[item.type] || 0) + 1;
  });

  // Calculate daily average
  const oldestContent = storage.content.length > 0 
    ? Math.min(...storage.content.map(item => item.timestamp))
    : Date.now();
  const totalDays = Math.max(1, (Date.now() - oldestContent) / (1000 * 60 * 60 * 24));
  const dailyAverage = totalGenerations / totalDays;

  // Calculate streak (simplified - based on consecutive days with activity)
  let streakDays = 0;
  if (storage.content.length > 0) {
    const sortedTimestamps = storage.content.map(item => item.timestamp).sort((a, b) => b - a);
    let currentStreak = 1;
    let lastDate = new Date(sortedTimestamps[0]).toDateString();
    
    for (let i = 1; i < sortedTimestamps.length; i++) {
      const currentDate = new Date(sortedTimestamps[i]).toDateString();
      if (currentDate === lastDate) continue;
      
      const timeDiff = Math.abs(new Date(sortedTimestamps[i-1]).getTime() - new Date(sortedTimestamps[i]).getTime());
      const dayDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      if (dayDiff <= 1) {
        currentStreak++;
      } else {
        break;
      }
      lastDate = currentDate;
    }
    streakDays = currentStreak;
  }

  return {
    topPersonas,
    totalGenerations,
    mostProductivePersona,
    recentActivity,
    toolUsageDistribution,
    contentTypeDistribution,
    dailyAverage,
    streakDays
  };
};

// Get productivity trends (last 30 days)
export const getProductivityTrends = (storage: ContentStorage) => {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentContent = storage.content.filter(item => item.timestamp >= thirtyDaysAgo);

  const dailyCounts: Record<string, number> = {};
  recentContent.forEach(item => {
    const date = new Date(item.timestamp).toDateString();
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  return {
    dailyCounts,
    totalRecent: recentContent.length,
    averageDaily: recentContent.length / 30
  };
};

// Get persona comparison data
export const comparePersonas = (storage: ContentStorage, personaIds: string[]) => {
  const personasStats = personaIds
    .map(id => getPersonaStats(storage, id))
    .filter((stats): stats is PersonaStats => stats !== null);

  return personasStats.map(stats => ({
    name: stats.persona.name,
    totalContent: stats.totalContent,
    productivityScore: stats.productivityScore,
    averageDaily: stats.averageGenerationsPerDay,
    mostUsedTool: stats.mostUsedTools[0]?.tool || 'None',
    creationDate: stats.creationDate
  }));
};