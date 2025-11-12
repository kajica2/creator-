import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CreditBalance, CreditTransaction, GameState, Achievement, XPEvent } from '../../types';
import { supabase } from '../../utils/supabaseClient';

interface CreditsContextType {
  balance: CreditBalance;
  gameState: GameState;
  transactions: CreditTransaction[];

  // Credit operations
  spendCredits: (amount: number, description: string, feature?: string) => Promise<boolean>;
  earnCredits: (amount: number, description: string, metadata?: any) => Promise<void>;
  purchaseCredits: (amount: number, paymentId: string) => Promise<void>;

  // XP operations
  addXP: (amount: number, source: string) => void;
  checkLevelUp: () => void;

  // Achievement operations
  unlockAchievement: (achievementId: string) => void;
  updateAchievementProgress: (achievementId: string, progress: number) => void;

  // Daily bonus
  claimDailyBonus: () => Promise<number>;
  canClaimDailyBonus: () => boolean;

  // Loading state
  loading: boolean;
  error: string | null;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

// Default achievements
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'welcome_bonus',
    name: 'Welcome to the Community',
    description: 'Claim your welcome bonus by uploading an image and URL',
    icon: '🎉',
    unlocked: false,
    progress: 0,
    target: 1,
    xpReward: 200,
    creditsReward: 0, // Credits already awarded in offer
    tier: 'bronze'
  },
  {
    id: 'first_generation',
    name: 'First Generation',
    description: 'Complete your first AI generation',
    icon: '🎯',
    unlocked: false,
    progress: 0,
    target: 1,
    xpReward: 100,
    creditsReward: 50,
    tier: 'bronze'
  },
  {
    id: 'hashtag_master',
    name: 'Hashtag Master',
    description: 'Generate 100+ hashtags',
    icon: '#️⃣',
    unlocked: false,
    progress: 0,
    target: 100,
    xpReward: 500,
    creditsReward: 200,
    tier: 'silver'
  },
  {
    id: 'image_wizard',
    name: 'Image Wizard',
    description: 'Generate 50+ images',
    icon: '🎨',
    unlocked: false,
    progress: 0,
    target: 50,
    xpReward: 750,
    creditsReward: 300,
    tier: 'gold'
  },
  {
    id: 'credit_millionaire',
    name: 'Credit Millionaire',
    description: 'Earn 10,000 total credits',
    icon: '💰',
    unlocked: false,
    progress: 0,
    target: 10000,
    xpReward: 2000,
    creditsReward: 1000,
    tier: 'platinum'
  },
  {
    id: 'daily_streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    unlocked: false,
    progress: 0,
    target: 7,
    xpReward: 350,
    creditsReward: 150,
    tier: 'silver'
  },
  {
    id: 'ai_explorer',
    name: 'AI Explorer',
    description: 'Try 5 different AI features',
    icon: '🚀',
    unlocked: false,
    progress: 0,
    target: 5,
    xpReward: 250,
    creditsReward: 100,
    tier: 'bronze'
  }
];

const XP_PER_LEVEL = 1000;

export const CreditsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<CreditBalance>({
    current: 100, // Start with 100 free credits
    lifetime: 100,
    spent: 0,
    earned: 100,
    purchased: 0
  });

  const [gameState, setGameState] = useState<GameState>({
    credits: 100,
    xp: 0,
    level: 1,
    nextLevelXp: XP_PER_LEVEL,
    achievements: DEFAULT_ACHIEVEMENTS,
    dailyStreak: 0,
    lastDailyBonus: null,
    totalEarned: 100,
    totalSpent: 0
  });

  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data from Supabase
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Load game state from Supabase
        const { data: gameData, error: gameError } = await supabase
          .from('user_game_state')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (gameData && !gameError) {
          setGameState({
            ...gameState,
            credits: gameData.credits,
            xp: gameData.xp,
            level: gameData.level,
            achievements: gameData.achievements || DEFAULT_ACHIEVEMENTS,
            dailyStreak: gameData.daily_streak,
            lastDailyBonus: gameData.last_daily_bonus ? new Date(gameData.last_daily_bonus) : null,
            totalEarned: gameData.total_earned || 0,
            totalSpent: gameData.total_spent || 0
          });

          setBalance({
            current: gameData.credits,
            lifetime: gameData.total_earned || 0,
            spent: gameData.total_spent || 0,
            earned: gameData.total_earned || 0,
            purchased: gameData.total_purchased || 0
          });
        }

        // Load recent transactions
        const { data: transData } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (transData) {
          setTransactions(transData.map(t => ({
            ...t,
            timestamp: new Date(t.created_at)
          })));
        }
      } else {
        // Load from localStorage for non-authenticated users
        const savedState = localStorage.getItem('creditsGameState');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setGameState({
            ...parsed,
            lastDailyBonus: parsed.lastDailyBonus ? new Date(parsed.lastDailyBonus) : null
          });
          setBalance({
            current: parsed.credits,
            lifetime: parsed.totalEarned || 0,
            spent: parsed.totalSpent || 0,
            earned: parsed.totalEarned || 0,
            purchased: 0
          });
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const saveGameState = useCallback(async (newState: GameState) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('user_game_state')
          .upsert({
            user_id: user.id,
            credits: newState.credits,
            xp: newState.xp,
            level: newState.level,
            achievements: newState.achievements,
            daily_streak: newState.dailyStreak,
            last_daily_bonus: newState.lastDailyBonus?.toISOString(),
            total_earned: newState.totalEarned,
            total_spent: newState.totalSpent,
            updated_at: new Date().toISOString()
          });
      } else {
        // Save to localStorage for non-authenticated users
        localStorage.setItem('creditsGameState', JSON.stringify({
          ...newState,
          lastDailyBonus: newState.lastDailyBonus?.toISOString()
        }));
      }
    } catch (err) {
      console.error('Error saving game state:', err);
    }
  }, []);

  const addTransaction = async (transaction: Omit<CreditTransaction, 'id' | 'timestamp'>) => {
    const newTransaction: CreditTransaction = {
      ...transaction,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev].slice(0, 100));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('credit_transactions')
          .insert({
            id: newTransaction.id,
            user_id: user.id,
            amount: transaction.amount,
            type: transaction.type,
            description: transaction.description,
            metadata: transaction.metadata,
            created_at: newTransaction.timestamp.toISOString()
          });
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
    }
  };

  const spendCredits = async (amount: number, description: string, feature?: string): Promise<boolean> => {
    if (balance.current < amount) {
      return false;
    }

    const newBalance = {
      ...balance,
      current: balance.current - amount,
      spent: balance.spent + amount
    };

    const newGameState = {
      ...gameState,
      credits: newBalance.current,
      totalSpent: gameState.totalSpent + amount
    };

    setBalance(newBalance);
    setGameState(newGameState);
    await saveGameState(newGameState);

    await addTransaction({
      userId: '', // Will be set in addTransaction
      amount: -amount,
      type: 'spent',
      description,
      metadata: { feature }
    });

    // Update achievement progress
    if (feature === 'hashtag') {
      updateAchievementProgress('hashtag_master', 1);
    } else if (feature === 'image') {
      updateAchievementProgress('image_wizard', 1);
    }

    return true;
  };

  const earnCredits = async (amount: number, description: string, metadata?: any) => {
    const newBalance = {
      ...balance,
      current: balance.current + amount,
      lifetime: balance.lifetime + amount,
      earned: balance.earned + amount
    };

    const newGameState = {
      ...gameState,
      credits: newBalance.current,
      totalEarned: gameState.totalEarned + amount
    };

    setBalance(newBalance);
    setGameState(newGameState);
    await saveGameState(newGameState);

    await addTransaction({
      userId: '',
      amount,
      type: 'earned',
      description,
      metadata
    });

    // Check credit millionaire achievement
    if (newGameState.totalEarned >= 10000) {
      unlockAchievement('credit_millionaire');
    }
  };

  const purchaseCredits = async (amount: number, paymentId: string) => {
    const newBalance = {
      ...balance,
      current: balance.current + amount,
      lifetime: balance.lifetime + amount,
      purchased: balance.purchased + amount
    };

    const newGameState = {
      ...gameState,
      credits: newBalance.current
    };

    setBalance(newBalance);
    setGameState(newGameState);
    await saveGameState(newGameState);

    await addTransaction({
      userId: '',
      amount,
      type: 'purchased',
      description: `Purchased ${amount} credits`,
      metadata: { paymentId }
    });
  };

  const addXP = (amount: number, source: string) => {
    const newXP = gameState.xp + amount;
    const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
    const nextLevelXp = newLevel * XP_PER_LEVEL;

    const newGameState = {
      ...gameState,
      xp: newXP,
      level: newLevel,
      nextLevelXp
    };

    setGameState(newGameState);
    saveGameState(newGameState);

    // Check if leveled up
    if (newLevel > gameState.level) {
      // Award level up bonus
      earnCredits(100 * newLevel, `Level ${newLevel} bonus!`);
    }
  };

  const checkLevelUp = () => {
    const newLevel = Math.floor(gameState.xp / XP_PER_LEVEL) + 1;
    if (newLevel > gameState.level) {
      setGameState(prev => ({ ...prev, level: newLevel }));
    }
  };

  const unlockAchievement = (achievementId: string) => {
    const achievement = gameState.achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;

    const updatedAchievements = gameState.achievements.map(a =>
      a.id === achievementId
        ? { ...a, unlocked: true, unlockedAt: new Date(), progress: a.target }
        : a
    );

    const newGameState = {
      ...gameState,
      achievements: updatedAchievements
    };

    setGameState(newGameState);
    saveGameState(newGameState);

    // Award achievement rewards
    if (achievement.xpReward) {
      addXP(achievement.xpReward, `Achievement: ${achievement.name}`);
    }
    if (achievement.creditsReward) {
      earnCredits(achievement.creditsReward, `Achievement: ${achievement.name}`);
    }
  };

  const updateAchievementProgress = (achievementId: string, increment: number) => {
    const achievement = gameState.achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;

    const newProgress = Math.min(achievement.progress + increment, achievement.target);

    const updatedAchievements = gameState.achievements.map(a =>
      a.id === achievementId
        ? { ...a, progress: newProgress }
        : a
    );

    const newGameState = {
      ...gameState,
      achievements: updatedAchievements
    };

    setGameState(newGameState);
    saveGameState(newGameState);

    // Check if achievement is now complete
    if (newProgress >= achievement.target) {
      unlockAchievement(achievementId);
    }
  };

  const claimDailyBonus = async (): Promise<number> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (gameState.lastDailyBonus) {
      const lastBonus = new Date(gameState.lastDailyBonus);
      lastBonus.setHours(0, 0, 0, 0);

      if (lastBonus.getTime() === today.getTime()) {
        return 0; // Already claimed today
      }

      // Check if streak continues
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const newStreak = lastBonus.getTime() === yesterday.getTime()
        ? gameState.dailyStreak + 1
        : 1;

      // Calculate bonus based on streak
      const baseBonus = 100;
      const streakBonus = Math.min(newStreak * 10, 400);
      const totalBonus = baseBonus + streakBonus + Math.floor(Math.random() * 100);

      const newGameState = {
        ...gameState,
        dailyStreak: newStreak,
        lastDailyBonus: today
      };

      setGameState(newGameState);
      await saveGameState(newGameState);
      await earnCredits(totalBonus, `Daily bonus (${newStreak} day streak)`);

      // Check streak achievement
      if (newStreak >= 7) {
        unlockAchievement('daily_streak_7');
      }

      return totalBonus;
    }

    // First daily bonus
    const bonus = 100;
    const newGameState = {
      ...gameState,
      dailyStreak: 1,
      lastDailyBonus: today
    };

    setGameState(newGameState);
    await saveGameState(newGameState);
    await earnCredits(bonus, 'Daily bonus');

    return bonus;
  };

  const canClaimDailyBonus = (): boolean => {
    if (!gameState.lastDailyBonus) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastBonus = new Date(gameState.lastDailyBonus);
    lastBonus.setHours(0, 0, 0, 0);

    return lastBonus.getTime() !== today.getTime();
  };

  const value: CreditsContextType = {
    balance,
    gameState,
    transactions,
    spendCredits,
    earnCredits,
    purchaseCredits,
    addXP,
    checkLevelUp,
    unlockAchievement,
    updateAchievementProgress,
    claimDailyBonus,
    canClaimDailyBonus,
    loading,
    error
  };

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  );
};

export const useCredits = () => {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
};