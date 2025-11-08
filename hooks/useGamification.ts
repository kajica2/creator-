import { useState, useEffect, useCallback } from 'react';
import { UserProgress, Page, Achievement } from '../types';
import { XP_REWARDS, ACHIEVEMENTS, calculateLevel, getCurrentLevelReward } from '../data/gamification';

const defaultUserProgress: UserProgress = {
  xp: 0,
  level: 1,
  achievements: ACHIEVEMENTS.map(achievement => ({ ...achievement, progress: 0, unlocked: false })),
  streak: 0,
  lastActivityDate: new Date().toISOString().split('T')[0],
  totalGenerations: 0,
  toolUsage: {},
  completedChallenges: []
};

export const useGamification = () => {
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    try {
      const savedProgress = localStorage.getItem('userProgress');
      if (savedProgress) {
        return JSON.parse(savedProgress);
      }
    } catch (error) {
      console.error("Could not load user progress from localStorage", error);
    }
    return defaultUserProgress;
  });

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('userProgress', JSON.stringify(userProgress));
    } catch (error) {
      console.error("Could not save user progress to localStorage", error);
    }
  }, [userProgress]);

  // Update streak based on daily activity
  const updateStreak = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = userProgress.lastActivityDate;
    
    if (lastActivity === today) {
      return userProgress.streak; // Already updated today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = userProgress.streak;
    if (lastActivity === yesterdayStr) {
      newStreak += 1; // Consecutive day
    } else if (lastActivity !== today) {
      newStreak = 1; // Broken streak, start over
    }

    setUserProgress(prev => ({
      ...prev,
      streak: newStreak,
      lastActivityDate: today
    }));

    return newStreak;
  }, [userProgress.lastActivityDate, userProgress.streak]);

  // Add XP and handle level ups
  const addXP = useCallback((amount: number, tool: Page, onAddCredits?: (amount: number) => void) => {
    setUserProgress(prev => {
      const newXP = prev.xp + amount;
      const oldLevel = prev.level;
      const newLevel = calculateLevel(newXP);
      
      // Check for level up rewards
      if (newLevel > oldLevel && onAddCredits) {
        const levelReward = getCurrentLevelReward(newLevel);
        if (levelReward) {
          onAddCredits(levelReward.credits);
        }
      }

      // Update tool usage
      const newToolUsage = {
        ...prev.toolUsage,
        [tool]: (prev.toolUsage[tool] || 0) + 1
      };

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        totalGenerations: prev.totalGenerations + 1,
        toolUsage: newToolUsage
      };
    });

    // Update streak on any activity
    updateStreak();
  }, [updateStreak]);

  // Check and update achievements
  const checkAchievements = useCallback((onAddCredits?: (amount: number) => void) => {
    setUserProgress(prev => {
      const updatedAchievements = prev.achievements.map(achievement => {
        if (achievement.unlocked) return achievement;

        let progress = 0;
        
        switch (achievement.category) {
          case 'tool_explorer':
            progress = Object.keys(prev.toolUsage).length;
            break;
          case 'content_creator':
            progress = prev.totalGenerations;
            break;
          case 'consistency':
            progress = prev.streak;
            break;
          case 'hashtag_master':
            // Placeholder - would need hashtag category tracking
            progress = 1;
            break;
          default:
            progress = 0;
        }

        const shouldUnlock = progress >= achievement.target;
        
        if (shouldUnlock && !achievement.unlocked && onAddCredits) {
          // Award credits for new achievement
          onAddCredits(achievement.creditReward || 0);
        }

        return {
          ...achievement,
          progress,
          unlocked: shouldUnlock,
          unlockedAt: shouldUnlock && !achievement.unlocked ? Date.now() : achievement.unlockedAt
        };
      });

      return {
        ...prev,
        achievements: updatedAchievements
      };
    });
  }, []);

  // Record AI generation and award XP
  const recordGeneration = useCallback((tool: Page, onAddCredits?: (amount: number) => void) => {
    const xpReward = XP_REWARDS[tool] || 0;
    
    if (xpReward > 0) {
      addXP(xpReward, tool, onAddCredits);
      checkAchievements(onAddCredits);
    }
  }, [addXP, checkAchievements]);

  // Complete a daily challenge
  const completeChallenge = useCallback((challengeId: string, xpReward: number, creditReward: number, onAddCredits?: (amount: number) => void) => {
    setUserProgress(prev => {
      if (prev.completedChallenges.includes(challengeId)) {
        return prev; // Already completed
      }

      return {
        ...prev,
        xp: prev.xp + xpReward,
        completedChallenges: [...prev.completedChallenges, challengeId]
      };
    });

    if (onAddCredits && creditReward > 0) {
      onAddCredits(creditReward);
    }

    updateStreak();
    checkAchievements(onAddCredits);
  }, [updateStreak, checkAchievements]);

  // Reset progress (for testing)
  const resetProgress = useCallback(() => {
    setUserProgress(defaultUserProgress);
  }, []);

  return {
    userProgress,
    recordGeneration,
    completeChallenge,
    updateStreak,
    checkAchievements,
    resetProgress
  };
};