import React, { useState, useEffect } from 'react';
import { useCredits } from '../../contexts/CreditsContext';

export const CreditsDisplay: React.FC = () => {
  const { balance, gameState, claimDailyBonus, canClaimDailyBonus } = useCredits();
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationAmount, setAnimationAmount] = useState(0);
  const [previousCredits, setPreviousCredits] = useState(balance.current);
  const [showDailyBonus, setShowDailyBonus] = useState(false);

  // Animate credit changes
  useEffect(() => {
    if (balance.current !== previousCredits) {
      const diff = balance.current - previousCredits;
      setAnimationAmount(diff);
      setShowAnimation(true);
      setPreviousCredits(balance.current);

      setTimeout(() => {
        setShowAnimation(false);
      }, 2000);
    }
  }, [balance.current, previousCredits]);

  const handleClaimDailyBonus = async () => {
    const bonus = await claimDailyBonus();
    if (bonus > 0) {
      setShowDailyBonus(true);
      setTimeout(() => setShowDailyBonus(false), 3000);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const getLevelColor = (): string => {
    if (gameState.level >= 50) return 'from-purple-400 to-pink-500';
    if (gameState.level >= 25) return 'from-yellow-400 to-orange-500';
    if (gameState.level >= 10) return 'from-blue-400 to-purple-500';
    if (gameState.level >= 5) return 'from-green-400 to-blue-500';
    return 'from-gray-400 to-gray-600';
  };

  const xpProgress = ((gameState.xp % 1000) / 1000) * 100;

  return (
    <div className="flex items-center gap-4 relative">
      {/* Daily Bonus Button */}
      {canClaimDailyBonus() && (
        <button
          onClick={handleClaimDailyBonus}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg blur-sm group-hover:blur-md transition-all animate-pulse" />
          <div className="relative bg-gray-900 border border-yellow-500/50 rounded-lg px-3 py-2 hover:border-yellow-400 transition-all">
            <span className="text-xs font-bold text-yellow-400">Daily Bonus!</span>
          </div>
        </button>
      )}

      {/* Credits Display */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700 hover:border-blue-500/50 transition-all">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <span className={`text-xl font-bold ${showAnimation ? 'animate-pulse' : ''} text-blue-400`}>
                {formatNumber(balance.current)}
              </span>
            </div>
            <span className="text-xs text-gray-400">Credits</span>
          </div>

          {/* Credit Change Animation */}
          {showAnimation && (
            <div className={`absolute -top-8 right-0 text-lg font-bold animate-float-up ${
              animationAmount > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {animationAmount > 0 ? '+' : ''}{animationAmount}
            </div>
          )}
        </div>
      </div>

      {/* XP and Level Display */}
      <div className="flex items-center gap-3 bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700">
        {/* Level Badge */}
        <div className="relative">
          <div className={`absolute inset-0 bg-gradient-to-r ${getLevelColor()} rounded-full blur-sm animate-pulse`} />
          <div className={`relative bg-gradient-to-r ${getLevelColor()} text-white font-bold text-sm px-3 py-1 rounded-full`}>
            Lv.{gameState.level}
          </div>
        </div>

        {/* XP Bar */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-medium text-purple-400">
              {formatNumber(gameState.xp)} XP
            </span>
          </div>
          <div className="w-24 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        {/* Streak Display */}
        {gameState.dailyStreak > 0 && (
          <div className="flex items-center gap-1 text-orange-400">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-bold">{gameState.dailyStreak}</span>
          </div>
        )}
      </div>

      {/* Daily Bonus Claimed Notification */}
      {showDailyBonus && (
        <div className="absolute top-full mt-2 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in-top">
          <span className="font-bold">Daily Bonus Claimed! 🎉</span>
        </div>
      )}

      <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-30px);
          }
        }

        @keyframes slide-in-top {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }

        .animate-slide-in-top {
          animation: slide-in-top 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};