import React, { useEffect, useState } from 'react';

interface SocialPostQueueItem {
  id: string;
  platform: string;
  status: string;
  scheduled_at: string;
  media_url?: string;
  caption?: string;
  error_message?: string;
}

export const SocialWorkerDashboard: React.FC = () => {
  const [queue, setQueue] = useState<SocialPostQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/socialWorker?status=queued');
      const payload = await response.json();
      if (!payload.success) {
        throw new Error(payload.error || 'Failed to load queue');
      }
      setQueue(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load social queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleProcessQueue = async () => {
    setProcessing(true);
    setError(null);
    try {
      const response = await fetch('/api/socialWorker', { method: 'POST' });
      const payload = await response.json();
      if (!payload.success) {
        throw new Error(payload.error || 'Failed to process queue');
      }
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Social Distribution Queue</h3>
          <p className="text-sm text-gray-400">
            Tracks posts waiting for Instagram and YouTube workers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadQueue}
            className="px-3 py-2 rounded-lg border border-gray-700 text-xs uppercase tracking-wide text-gray-300 hover:bg-gray-800 transition"
          >
            Refresh
          </button>
          <button
            onClick={handleProcessQueue}
            disabled={processing}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-xs uppercase tracking-wide text-white transition"
          >
            {processing ? 'Dispatching...' : 'Run Workers'}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Loading queue...</div>
      ) : queue.length === 0 ? (
        <div className="text-sm text-gray-500">
          No queued posts. Use Studio Social or Agency Syndicate tiers to enqueue media.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead>
              <tr className="text-xs uppercase text-gray-500 border-b border-gray-800">
                <th className="py-2 pr-4">Platform</th>
                <th className="py-2 pr-4">Scheduled</th>
                <th className="py-2 pr-4">Caption</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.id} className="border-b border-gray-800 last:border-0">
                  <td className="py-2 pr-4 capitalize">{item.platform}</td>
                  <td className="py-2 pr-4 text-xs text-gray-400">
                    {new Date(item.scheduled_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 truncate max-w-xs text-xs text-gray-400">
                    {item.caption || '—'}
                  </td>
                  <td className="py-2 pr-4 text-xs text-gray-400">
                    {item.status}
                    {item.error_message && (
                      <span className="block text-red-400 mt-1">Error: {item.error_message}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SocialWorkerDashboard;

