import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchUserRatingSummary,
  submitUserRating,
  UserRatingSummary,
} from '../supabase/utils';

interface UserProfileCardProps {
  displayName: string;
  handle: string;
  avatarUrl?: string;
  headline?: string;
  reviewerHandle?: string;
}

const STARS = [1, 2, 3, 4, 5];

const formatAverage = (value: number | null) =>
  value === null ? '—' : value.toFixed(1);

const buildDistribution = (summary: UserRatingSummary) => [
  { label: '5', count: summary.fiveStar },
  { label: '4', count: summary.fourStar },
  { label: '3', count: summary.threeStar },
  { label: '2', count: summary.twoStar },
  { label: '1', count: summary.oneStar },
];

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  displayName,
  handle,
  avatarUrl,
  headline,
  reviewerHandle,
}) => {
  const [summary, setSummary] = useState<UserRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const distribution = useMemo(
    () => (summary ? buildDistribution(summary) : []),
    [summary],
  );

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserRatingSummary(handle);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rating summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [handle]);

  const handleSubmit = async () => {
    if (!selectedScore) {
      setError('Select a rating before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await submitUserRating({
        targetHandle: handle,
        score: selectedScore,
        feedback: feedback || undefined,
        reviewerHandle,
      });
      setSuccessMessage('Thanks for sharing your rating!');
      setFeedback('');
      setSelectedScore(null);
      await loadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/30 border border-purple-600/30 rounded-2xl p-6 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-purple-500/30 border border-purple-400/30 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-purple-200">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              {displayName}
              <span className="text-xs text-gray-400">@{handle}</span>
            </h2>
            {headline && <p className="text-sm text-gray-300">{headline}</p>}
          </div>
        </div>

        <div className="bg-gray-900/40 border border-gray-700 rounded-xl px-4 py-3 text-center">
          <div className="text-xs uppercase text-gray-400 tracking-wide">Average Rating</div>
          <div className="text-3xl font-semibold text-yellow-300 mt-1">
            {formatAverage(summary?.averageScore ?? null)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {summary?.totalRatings || 0} community ratings
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Rate this creator</h3>
            <p className="text-xs text-gray-400">
              Tap a star to score from 1 (needs work) to 5 (phenomenal).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {STARS.map((star) => {
              const active = selectedScore ? star <= selectedScore : star <= (summary?.averageScore || 0);
              return (
                <button
                  key={star}
                  onClick={() => setSelectedScore(star)}
                  className={`h-10 w-10 rounded-full flex items-center justify-center border transition ${
                    active
                      ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300'
                      : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-yellow-400/60 hover:text-yellow-200'
                  }`}
                >
                  ★
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs uppercase text-gray-500 mb-1">
              Optional feedback
            </label>
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              rows={3}
              placeholder="What stood out in this collaboration?"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
          >
            {submitting ? 'Submitting...' : 'Share Rating'}
          </button>

          {error && (
            <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="text-xs text-green-300 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
              {successMessage}
            </div>
          )}
        </div>

        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Community sentiment</h3>
          {loading ? (
            <div className="text-sm text-gray-500">Loading rating summary...</div>
          ) : summary && summary.totalRatings > 0 ? (
            <div className="space-y-2">
              {distribution.map((item) => {
                const percent =
                  summary.totalRatings > 0
                    ? Math.round((item.count / summary.totalRatings) * 100)
                    : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{item.label}★</span>
                      <span>{item.count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
                      <div
                        className="h-2 rounded-full bg-yellow-400"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No ratings yet. Be the first to score this creator!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;

