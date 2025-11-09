import React, { useEffect, useMemo, useState } from 'react';
import {
  tagDuelService,
  TagDuel,
  TagDuelScore,
  TagDuelRound,
  DuelDetails,
  DuelTagPlay,
} from '../src/services/duels/TagDuelService';

interface BashingArenaProps {
  defaultChallengerHandle?: string;
}

interface CreateDuelForm {
  challengerHandle: string;
  challengedHandle: string;
  stakeTags: string;
}

interface RoundFormState {
  challengerTags: string;
  challengedTags: string;
}

const DEFAULT_TAG_POOL = [
  '#viralwave',
  '#aiartistry',
  '#neuralbeats',
  '#contentalchemy',
  '#growthloop',
  '#trendforge',
  '#brandpulse',
  '#engageboost',
  '#creatorenergy',
  '#algorithmhack',
  '#reachstorm',
  '#tagdomination',
];

const parseTagInput = (value: string): DuelTagPlay[] => {
  return value
    .split(/[\n,]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((name) => ({
      name: name.startsWith('#') ? name : `#${name}`,
    }));
};

const getRandomTags = (count: number): DuelTagPlay[] => {
  const shuffled = [...DEFAULT_TAG_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((name) => ({ name }));
};

export const BashingArena: React.FC<BashingArenaProps> = ({
  defaultChallengerHandle = 'You',
}) => {
  const [duels, setDuels] = useState<TagDuel[]>([]);
  const [selectedDuelId, setSelectedDuelId] = useState<string | null>(null);
  const [details, setDetails] = useState<DuelDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [roundSubmitting, setRoundSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateDuelForm>({
    challengerHandle: defaultChallengerHandle,
    challengedHandle: '',
    stakeTags: '#viralwave, #aiartistry, #trendforge',
  });

  const [roundForm, setRoundForm] = useState<RoundFormState>({
    challengerTags: '#viralwave, #growthloop, #engageboost',
    challengedTags: '#trendforge, #brandpulse, #creatorenergy',
  });

  const selectedDuel = useMemo(
    () => duels.find((duel) => duel.id === selectedDuelId) || null,
    [duels, selectedDuelId],
  );

  const loadDuels = async (autoSelect: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const duelList = await tagDuelService.listDuels();
      setDuels(duelList);

      if (autoSelect && duelList.length > 0) {
        setSelectedDuelId(duelList[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load #bashing duels');
    } finally {
      setLoading(false);
    }
  };

  const refreshDetails = async (duelId: string) => {
    setError(null);
    try {
      const duelDetails = await tagDuelService.getDuelDetails(duelId);
      setDetails(duelDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load duel details');
    }
  };

  useEffect(() => {
    loadDuels(true);
  }, []);

  useEffect(() => {
    if (selectedDuelId) {
      refreshDetails(selectedDuelId);
    } else {
      setDetails(null);
    }
  }, [selectedDuelId]);

  const handleCreateDuel = async () => {
    if (!createForm.challengerHandle || !createForm.challengedHandle) {
      setError('Both challenger and opponent handles are required.');
      return;
    }

    const stakeTags = parseTagInput(createForm.stakeTags).map((tag) => tag.name);
    if (stakeTags.length === 0) {
      setError('Add at least one stake hashtag for the duel.');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const duel = await tagDuelService.createDuel({
        challengerHandle: createForm.challengerHandle,
        challengedHandle: createForm.challengedHandle,
        stakeTags,
      });

      await loadDuels();
      setSelectedDuelId(duel.id);
      setCreateForm((prev) => ({
        ...prev,
        challengedHandle: '',
        stakeTags: '#viralwave, #trendforge, #brandpulse',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create duel');
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitRound = async (simulate: boolean = false) => {
    if (!selectedDuel) {
      setError('Select a duel to submit a round.');
      return;
    }

    const challengerTags = simulate
      ? getRandomTags(3)
      : parseTagInput(roundForm.challengerTags);
    const challengedTags = simulate
      ? getRandomTags(3)
      : parseTagInput(roundForm.challengedTags);

    if (challengerTags.length === 0 || challengedTags.length === 0) {
      setError('Both players must submit at least one hashtag for the round.');
      return;
    }

    setRoundSubmitting(true);
    setError(null);

    try {
      const nextRoundNumber = (details?.rounds.length || 0) + 1;
      const duelDetails = await tagDuelService.submitRound({
        duelId: selectedDuel.id,
        roundNumber: nextRoundNumber,
        challengerHandle: selectedDuel.challengerHandle,
        challengedHandle: selectedDuel.challengedHandle,
        challengerTags,
        challengedTags,
      });

      setDetails(duelDetails);
      await loadDuels();

      if (!simulate) {
        setRoundForm({
          challengerTags: '',
          challengedTags: '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit round');
    } finally {
      setRoundSubmitting(false);
    }
  };

  const handleDeclareWinner = async (handle: string) => {
    if (!selectedDuel) return;
    setError(null);

    try {
      await tagDuelService.declareWinner(selectedDuel.id, handle);
      await loadDuels();
      await refreshDetails(selectedDuel.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to declare winner');
    }
  };

  const scoreboard: TagDuelScore[] = useMemo(() => {
    if (details?.scoreboard?.length) {
      return details.scoreboard;
    }

    if (selectedDuel) {
      return [
        {
          id: `score-${selectedDuel.id}-challenger`,
          duelId: selectedDuel.id,
          displayHandle: selectedDuel.challengerHandle,
          score: 0,
          momentum: 0,
          tagsCaptured: [],
          updatedAt: new Date().toISOString(),
        },
        {
          id: `score-${selectedDuel.id}-challenged`,
          duelId: selectedDuel.id,
          displayHandle: selectedDuel.challengedHandle,
          score: 0,
          momentum: 0,
          tagsCaptured: [],
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    return [];
  }, [details, selectedDuel]);

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-800 bg-gradient-to-r from-purple-900/40 to-blue-900/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/30 text-purple-200 text-lg">
                ⚔️
              </span>
              #Bashing Arena
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              Launch head-to-head hashtag battles, capture your opponent&apos;s tags, and
              dominate the trend board.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-gray-400 tracking-wide">
              Total Duels
            </p>
            <p className="text-2xl font-semibold text-purple-200">{duels.length}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-purple-300">🎯</span>
                Launch a New Duel
              </h3>
              <span className="text-xs uppercase tracking-wide text-gray-500">
                Step 1
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-1">
                  Challenger handle
                </label>
                <input
                  type="text"
                  value={createForm.challengerHandle}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      challengerHandle: event.target.value,
                    }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
                  placeholder="@challenger"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase mb-1">
                  Opponent handle
                </label>
                <input
                  type="text"
                  value={createForm.challengedHandle}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      challengedHandle: event.target.value,
                    }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
                  placeholder="@opponent"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase mb-1">
                  Stake hashtags (comma separated)
                </label>
                <textarea
                  value={createForm.stakeTags}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      stakeTags: event.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={creating}
              onClick={handleCreateDuel}
              className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              {creating ? 'Launching...' : 'Launch Duel'}
            </button>
          </div>

          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-blue-300">📜</span>
                Active Duels
              </h3>
              <button
                type="button"
                onClick={() => loadDuels()}
                className="text-xs uppercase tracking-wide text-blue-300 hover:text-blue-200"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-gray-400 text-sm">Loading active duels...</div>
            ) : duels.length === 0 ? (
              <div className="text-gray-500 text-sm">
                No duels yet. Launch one to start the #bashing arena.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {duels.map((duel) => {
                  const isSelected = duel.id === selectedDuelId;
                  return (
                    <button
                      key={duel.id}
                      onClick={() => setSelectedDuelId(duel.id)}
                      className={`w-full text-left border rounded-lg px-3 py-2 transition ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10 text-purple-100'
                          : 'border-gray-800 bg-gray-900 hover:border-purple-500/40 text-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold">
                          {duel.challengerHandle} vs {duel.challengedHandle}
                        </span>
                        <span
                          className={`text-xs uppercase tracking-wide ${
                            duel.status === 'completed'
                              ? 'text-green-300'
                              : duel.status === 'active'
                              ? 'text-yellow-300'
                              : 'text-gray-400'
                          }`}
                        >
                          {duel.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Stake: {duel.stakeTags.join(', ')}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {selectedDuel && details && (
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span className="text-green-300">⚡</span>
                  {selectedDuel.challengerHandle} vs {selectedDuel.challengedHandle}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Stake tags: {selectedDuel.stakeTags.join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeclareWinner(selectedDuel.challengerHandle)}
                  className="text-xs px-3 py-2 rounded-lg border border-purple-500/40 text-purple-200 hover:bg-purple-500/10 transition"
                >
                  Declare {selectedDuel.challengerHandle} winner
                </button>
                <button
                  onClick={() => handleDeclareWinner(selectedDuel.challengedHandle)}
                  className="text-xs px-3 py-2 rounded-lg border border-purple-500/40 text-purple-200 hover:bg-purple-500/10 transition"
                >
                  Declare {selectedDuel.challengedHandle} winner
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scoreboard.map((score) => (
                <div
                  key={score.displayHandle}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-white">
                      {score.displayHandle}
                    </span>
                    <span className="text-purple-300 font-bold text-lg">
                      {Math.round(score.score)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="text-xs uppercase text-gray-500">Momentum</div>
                    <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${
                          score.momentum >= 0 ? 'bg-purple-500' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(Math.abs(score.momentum), 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-xs uppercase text-gray-500 mb-1">
                      Captured Tags
                    </div>
                    {score.tagsCaptured.length === 0 ? (
                      <div className="text-xs text-gray-500 italic">
                        None captured yet
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {score.tagsCaptured.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-purple-600/20 border border-purple-500/30 text-purple-200 px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold text-white flex items-center gap-2">
                  <span className="text-yellow-300">🔥</span>
                  Submit a Round
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={roundSubmitting}
                    onClick={() => handleSubmitRound(true)}
                    className="text-xs bg-blue-600/20 border border-blue-500/40 text-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-600/30 transition disabled:opacity-50"
                  >
                    Simulate Round
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    {selectedDuel.challengerHandle}&apos;s hashtags
                  </label>
                  <textarea
                    value={roundForm.challengerTags}
                    onChange={(event) =>
                      setRoundForm((prev) => ({
                        ...prev,
                        challengerTags: event.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    {selectedDuel.challengedHandle}&apos;s hashtags
                  </label>
                  <textarea
                    value={roundForm.challengedTags}
                    onChange={(event) =>
                      setRoundForm((prev) => ({
                        ...prev,
                        challengedTags: event.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={roundSubmitting}
                onClick={() => handleSubmitRound(false)}
                className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
              >
                {roundSubmitting ? 'Scoring round...' : 'Submit Round'}
              </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold text-white flex items-center gap-2">
                  <span className="text-pink-300">📊</span>
                  Round History
                </h4>
                <span className="text-xs text-gray-500">
                  {details.rounds.length} rounds played
                </span>
              </div>

              {details.rounds.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No rounds recorded yet. Submit a round to kick off the duel.
                </div>
              ) : (
                <div className="space-y-3">
                  {details.rounds.map((round) => (
                    <div
                      key={round.id}
                      className="bg-gray-900/60 border border-gray-800 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-300 font-semibold">
                          Round {round.roundNumber}
                        </div>
                        <div className="text-xs uppercase tracking-wide">
                          {round.roundWinnerHandle ? (
                            <span className="text-green-300">
                              Winner: {round.roundWinnerHandle}
                            </span>
                          ) : (
                            <span className="text-gray-500">Draw</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-300">
                        <div>
                          <div className="font-semibold text-purple-200 mb-1">
                            {selectedDuel.challengerHandle}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {round.challengerTags.map((tag) => (
                              <span
                                key={`${round.id}-challenger-${tag.name}`}
                                className="px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/30"
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-blue-200 mb-1">
                            {selectedDuel.challengedHandle}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {round.challengedTags.map((tag) => (
                              <span
                                key={`${round.id}-challenged-${tag.name}`}
                                className="px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/30"
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {round.capturedTags.length > 0 && (
                        <div className="text-xs text-green-300">
                          Captured: {round.capturedTags.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BashingArena;

