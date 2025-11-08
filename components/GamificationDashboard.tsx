import React, { useMemo } from 'react';
import { UserProgress, Achievement, DailyChallenge, LevelReward } from '../types';
import { ACHIEVEMENTS, LEVEL_REWARDS, getXPForNextLevel, getCurrentLevelReward } from '../data/gamification';

interface GamificationDashboardProps {
  userProgress: UserProgress;
  onAddCredits: (amount: number) => void;
}

const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const FireIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>;
const TargetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({ userProgress, onAddCredits }) => {
  const xpToNextLevel = getXPForNextLevel(userProgress.xp);
  const currentLevelReward = getCurrentLevelReward(userProgress.level);
  const nextLevelReward = LEVEL_REWARDS.find(reward => reward.level === userProgress.level + 1);

  // Calculate achievement progress
  const achievements = useMemo(() => {
    return ACHIEVEMENTS.map(achievement => {
      let progress = 0;
      
      switch (achievement.id) {
        case 'tool_explorer_bronze':
        case 'tool_explorer_silver':
        case 'tool_explorer_gold':
          progress = Object.keys(userProgress.toolUsage).length;
          break;
        case 'content_creator_bronze':
        case 'content_creator_silver':
        case 'content_creator_gold':
          progress = userProgress.totalGenerations;
          break;
        case 'streak_3':
        case 'streak_7':
        case 'streak_30':
          progress = userProgress.streak;
          break;
        case 'hashtag_explorer':
        case 'hashtag_master':
          // This would need hashtag category tracking - placeholder
          progress = 1;
          break;
      }

      return {
        ...achievement,
        progress,
        unlocked: progress >= achievement.target
      };
    });
  }, [userProgress]);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-yellow-600';
      case 'silver': return 'text-gray-400';
      case 'gold': return 'text-yellow-400';
      case 'platinum': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getTierBgColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'silver': return 'bg-gray-500/10 border-gray-500/30';
      case 'gold': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'platinum': return 'bg-purple-500/10 border-purple-500/30';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-300">{userProgress.level}</div>
          <div className="text-sm text-gray-400">Level</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-300">{userProgress.xp}</div>
          <div className="text-sm text-gray-400">Total XP</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-300">{userProgress.streak}</div>
          <div className="text-sm text-gray-400 flex items-center justify-center">
            <FireIcon className="mr-1" /> Day Streak
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-300">{userProgress.totalGenerations}</div>
          <div className="text-sm text-gray-400">Generations</div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <StarIcon className="mr-2" />
          Level Progress
        </h2>
        
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Level {userProgress.level}</span>
            <span className="text-purple-300">{xpToNextLevel} XP to Level {userProgress.level + 1}</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${((userProgress.xp % 100) / 100) * 100}%` }}
            ></div>
          </div>

          {currentLevelReward && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mt-4">
              <div className="flex items-center text-green-300 text-sm font-semibold">
                <TrophyIcon className="mr-2" />
                Level {currentLevelReward.level} Reward Unlocked!
              </div>
              <div className="text-green-200 text-sm mt-1">
                {currentLevelReward.description} - {currentLevelReward.credits} credits added!
              </div>
            </div>
          )}

          {nextLevelReward && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <div className="text-purple-300 text-sm font-semibold">
                Next Reward at Level {nextLevelReward.level}
              </div>
              <div className="text-purple-200 text-sm mt-1">
                {nextLevelReward.description} - {nextLevelReward.credits} credits
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <TrophyIcon className="mr-2" />
          Achievements ({unlockedAchievements.length}/{achievements.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {unlockedAchievements.map(achievement => (
            <div 
              key={achievement.id}
              className={`border rounded-lg p-4 ${getTierBgColor(achievement.tier)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{achievement.icon}</span>
                  <div>
                    <div className={`font-semibold ${getTierColor(achievement.tier)}`}>
                      {achievement.name}
                    </div>
                    <div className="text-sm text-gray-300">{achievement.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 uppercase">{achievement.tier}</div>
                  <div className="text-sm text-green-300">+{achievement.xpReward} XP</div>
                  {achievement.creditReward && (
                    <div className="text-sm text-blue-300">+{achievement.creditReward} credits</div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {lockedAchievements.slice(0, 4).map(achievement => (
            <div 
              key={achievement.id}
              className="border border-gray-600 rounded-lg p-4 bg-gray-700/30 opacity-60"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3 text-gray-500">{achievement.icon}</span>
                  <div>
                    <div className="font-semibold text-gray-400">
                      {achievement.name}
                    </div>
                    <div className="text-sm text-gray-500">{achievement.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Progress: {achievement.progress}/{achievement.target}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase">{achievement.tier}</div>
                  <div className="text-sm text-gray-500">+{achievement.xpReward} XP</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {lockedAchievements.length > 4 && (
          <div className="text-center mt-4">
            <div className="text-gray-400 text-sm">
              +{lockedAchievements.length - 4} more achievements to unlock
            </div>
          </div>
        )}
      </div>

      {/* Tool Usage Stats */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <TargetIcon className="mr-2" />
          Tool Usage
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(userProgress.toolUsage)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([tool, count]) => {
              const usageCount = count as number;
              const maxUsage = Math.max(...Object.values(userProgress.toolUsage).map(v => v as number));
              const percentage = maxUsage > 0 ? Math.min((usageCount / maxUsage) * 100, 100) : 0;
              
              return (
                <div key={tool} className="bg-gray-700/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-300">{tool}</div>
                    <div className="text-purple-300 font-bold">{usageCount}</div>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
        </div>

        {Object.keys(userProgress.toolUsage).length === 0 && (
          <div className="text-center text-gray-400 py-8">
            Start using AI generators to track your tool usage!
          </div>
        )}
      </div>
    </div>
  );
};