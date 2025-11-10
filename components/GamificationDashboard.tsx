import React, { useMemo } from 'react';
import { UserProgress } from '../types';
import { getXPForNextLevel } from '../data/gamification';

interface GamificationDashboardProps {
  userProgress: UserProgress;
  onAddCredits: (amount: number) => void;
}

const StatCard: React.FC<{ label: string; value: string | number; description?: string }> = ({
  label,
  value,
  description,
}) => (
  <div className="rounded-2xl border border-gray-700/60 bg-gray-900/60 p-5 shadow-inner shadow-black/30">
    <p className="text-sm text-gray-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
  </div>
);

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  userProgress,
  onAddCredits,
}) => {
  const xpToNextLevel = getXPForNextLevel(userProgress.xp);

  const topTools = useMemo(() => {
    const entries = Object.entries(userProgress.toolUsage)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5);

    if (entries.length === 0) {
      return null;
    }

    const maxUsage = entries.reduce((acc, [, count]) => Math.max(acc, count as number), 0);

    return entries.map(([tool, count]) => ({
      tool,
      count: count as number,
      percentage: maxUsage === 0 ? 0 : Math.round(((count as number) / maxUsage) * 100),
    }));
  }, [userProgress.toolUsage]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-gray-900 via-purple-950 to-gray-900 p-10 shadow-lg shadow-purple-900/30">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-pink-500/10 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-purple-200/80">
              Progress snapshot
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Level {userProgress.level} Creator
            </h1>
            <p className="mt-3 max-w-xl text-sm text-gray-200">
              You&apos;re {xpToNextLevel} XP away from the next unlock. Keep shipping campaigns to unlock
              additional credits and automation perks.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatCard label="Current XP" value={userProgress.xp} />
            <StatCard label="Active streak" value={`${userProgress.streak} days`} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Content shipped" value={userProgress.totalGenerations} description="Total generations" />
        <StatCard
          label="Tools explored"
          value={Object.keys(userProgress.toolUsage).length}
          description="Unique modules used"
        />
        <StatCard label="Credits earned" value={`${userProgress.achievements.length * 5}`} description="From rewards" />
        <div className="rounded-2xl border border-gray-700/60 bg-gray-900/70 p-5">
          <p className="text-sm text-gray-400">Need a boost?</p>
          <p className="mt-2 text-lg font-semibold text-white">Top up extra credits</p>
          <button
            onClick={() => onAddCredits(10)}
            className="mt-4 inline-flex items-center rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-100 transition hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Add 10 credits
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-700/60 bg-gray-900/70 p-8">
        <h2 className="text-lg font-semibold text-white">Next best actions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-700/60 bg-gray-800/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-200/80">
              1 · Lock in your streak
            </p>
            <p className="mt-2 text-sm text-gray-200">
              Generate something today to keep the streak alive and double rewards at the next level.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-700/60 bg-gray-800/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-200/80">
              2 · Explore a new tool
            </p>
            <p className="mt-2 text-sm text-gray-200">
              Try a module you haven&apos;t used yet to unlock the tool explorer achievements faster.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-700/60 bg-gray-800/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-200/80">
              3 · Recycle top prompts
            </p>
            <p className="mt-2 text-sm text-gray-200">
              Reuse a high-performing prompt with fresh hashtags to compound your reach.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-700/60 bg-gray-900/70 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Tool usage highlight</h2>
            <p className="mt-2 text-sm text-gray-300">
              Here are the modules you lean on most. Mix in a new one each week to increase your XP
              multipliers.
            </p>
            {!topTools && (
              <p className="mt-6 rounded-xl border border-dashed border-gray-700/80 bg-gray-800/40 p-6 text-sm text-gray-400">
                No usage data yet. Launch the demo or create your first asset to see insights here.
              </p>
            )}
          </div>
          {topTools && (
            <ul className="flex-1 space-y-4">
              {topTools.map((item) => (
                <li
                  key={item.tool}
                  className="rounded-xl border border-gray-700/60 bg-gray-800/50 p-4"
                >
                  <div className="flex items-center justify-between text-sm text-gray-200">
                    <span className="font-medium">{item.tool}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};