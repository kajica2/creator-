import React, { useEffect, useState, useCallback, useRef } from 'react';
import { NeuralMelodyPlayer } from './NeuralMelodyPlayer';
import PianoKeyboard from './PianoKeyboard';
import {
  NeuralMelodyConfig,
  PlayerState,
  NoteSequence,
  MelodyPlayerCallbacks
} from './types';

interface NeuralMelodyComponentProps {
  config?: Partial<NeuralMelodyConfig>;
  className?: string;
  onSequenceGenerated?: (sequence: NoteSequence) => void;
  onError?: (error: Error) => void;
}

const NeuralMelodyComponent: React.FC<NeuralMelodyComponentProps> = ({
  config = {},
  className = '',
  onSequenceGenerated,
  onError
}) => {
  const playerRef = useRef<NeuralMelodyPlayer | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    isLoading: false,
    isModelLoaded: false,
    currentSequence: null,
    error: null,
    sustainMode: false,
    activeNotes: new Set()
  });

  const [playerConfig, setPlayerConfig] = useState<NeuralMelodyConfig>({
    temperature: 1.0,
    stepsPerQuarter: 4,
    totalSteps: 128,
    minNote: 48,
    maxNote: 84,
    ...config
  });

  const [generatedSequences, setGeneratedSequences] = useState<NoteSequence[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<any[]>([]);

  // Initialize player
  useEffect(() => {
    const callbacks: MelodyPlayerCallbacks = {
      onNoteStart: (note, velocity) => {
        setPlayerState(prev => ({
          ...prev,
          activeNotes: new Set([...prev.activeNotes, note])
        }));

        if (isRecording) {
          setRecordedNotes(prev => [...prev, {
            pitch: note,
            startTime: performance.now(),
            velocity: velocity * 127
          }]);
        }
      },
      onNoteEnd: (note) => {
        setPlayerState(prev => {
          const newActiveNotes = new Set(prev.activeNotes);
          newActiveNotes.delete(note);
          return { ...prev, activeNotes: newActiveNotes };
        });
      },
      onSequenceUpdate: (sequence) => {
        setPlayerState(prev => ({ ...prev, currentSequence: sequence }));
        setGeneratedSequences(prev => [...prev, sequence]);
        onSequenceGenerated?.(sequence);
      },
      onError: (error) => {
        setPlayerState(prev => ({ ...prev, error: error.message }));
        onError?.(error);
      },
      onModelLoad: () => {
        setPlayerState(prev => ({ ...prev, isModelLoaded: true, isLoading: false }));
      },
      onPlaybackStateChange: (isPlaying) => {
        setPlayerState(prev => ({ ...prev, isPlaying }));
      }
    };

    playerRef.current = new NeuralMelodyPlayer(playerConfig, callbacks);

    // Get initial state
    const initialState = playerRef.current.getState();
    setPlayerState(prev => ({ ...prev, ...initialState }));

    return () => {
      playerRef.current?.dispose();
    };
  }, []);

  // Update player config when props change
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setConfig(playerConfig);
    }
  }, [playerConfig]);

  const handleNotePress = useCallback(async (note: number) => {
    if (!playerRef.current) return;

    try {
      await playerRef.current.startAudioContext();
      playerRef.current.playNoteByMidi(note, 0.8);
    } catch (error) {
      console.error('Error playing note:', error);
    }
  }, []);

  const handleNoteRelease = useCallback((note: number) => {
    if (!playerRef.current) return;
    playerRef.current.stopNoteByMidi(note);
  }, []);

  const handleConfigChange = useCallback((key: keyof NeuralMelodyConfig, value: any) => {
    setPlayerConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearAll = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.stop();
    setGeneratedSequences([]);
    setRecordedNotes([]);
    setPlayerState(prev => ({ ...prev, currentSequence: null }));
  }, []);

  const handlePlaySequence = useCallback(async (sequence: NoteSequence) => {
    if (!playerRef.current) return;

    try {
      await playerRef.current.startAudioContext();
      await playerRef.current.playSequence(sequence);
    } catch (error) {
      console.error('Error playing sequence:', error);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    setIsRecording(prev => {
      if (prev) {
        // Stop recording - finalize the sequence
        const endTime = performance.now();
        const finalizedNotes = recordedNotes.map((note, index) => ({
          ...note,
          endTime: index < recordedNotes.length - 1
            ? recordedNotes[index + 1].startTime
            : endTime,
          startTime: (note.startTime - recordedNotes[0]?.startTime || 0) / 1000,
        }));

        if (finalizedNotes.length > 0) {
          const sequence: NoteSequence = {
            notes: finalizedNotes.map(note => ({
              ...note,
              endTime: note.endTime / 1000
            })),
            totalTime: Math.max(...finalizedNotes.map(n => n.endTime / 1000)),
            ticksPerQuarter: playerConfig.stepsPerQuarter
          };

          setGeneratedSequences(prev => [...prev, sequence]);
        }
      } else {
        // Start recording
        setRecordedNotes([]);
      }
      return !prev;
    });
  }, [recordedNotes, playerConfig.stepsPerQuarter]);

  const renderControlPanel = () => (
    <div className="neural-melody__controls">
      <div className="control-group">
        <h3>Neural Network Settings</h3>

        <div className="control-item">
          <label>Temperature: {playerConfig.temperature.toFixed(2)}</label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={playerConfig.temperature}
            onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
            className="control-slider"
          />
          <small>Lower = more predictable, Higher = more creative</small>
        </div>

        <div className="control-item">
          <label>Steps per Quarter: {playerConfig.stepsPerQuarter}</label>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={playerConfig.stepsPerQuarter}
            onChange={(e) => handleConfigChange('stepsPerQuarter', parseInt(e.target.value))}
            className="control-slider"
          />
        </div>

        <div className="control-item">
          <label>Total Steps: {playerConfig.totalSteps}</label>
          <input
            type="range"
            min="32"
            max="256"
            step="16"
            value={playerConfig.totalSteps}
            onChange={(e) => handleConfigChange('totalSteps', parseInt(e.target.value))}
            className="control-slider"
          />
        </div>
      </div>

      <div className="control-group">
        <h3>Recording & Playback</h3>

        <button
          onClick={toggleRecording}
          className={`control-button ${isRecording ? 'recording' : ''}`}
          disabled={!playerState.isModelLoaded}
        >
          {isRecording ? '⏹️ Stop Recording' : '⏺️ Start Recording'}
        </button>

        <button
          onClick={handleClearAll}
          className="control-button secondary"
        >
          🗑️ Clear All
        </button>
      </div>

      <div className="control-group">
        <h3>Model Status</h3>

        <div className={`status-indicator ${playerState.isModelLoaded ? 'loaded' : 'loading'}`}>
          {playerState.isLoading && '⏳ Loading model...'}
          {playerState.isModelLoaded && '✅ Model ready'}
          {playerState.error && `❌ Error: ${playerState.error}`}
        </div>

        {!playerState.isModelLoaded && !playerState.error && (
          <button
            onClick={() => playerRef.current?.loadModel()}
            className="control-button"
            disabled={playerState.isLoading}
          >
            🔄 Reload Model
          </button>
        )}
      </div>
    </div>
  );

  const renderSequenceList = () => (
    <div className="neural-melody__sequences">
      <h3>Generated Sequences ({generatedSequences.length})</h3>

      <div className="sequence-list">
        {generatedSequences.map((sequence, index) => (
          <div key={index} className="sequence-item">
            <div className="sequence-info">
              <span className="sequence-title">Sequence {index + 1}</span>
              <span className="sequence-details">
                {sequence.notes.length} notes, {sequence.totalTime.toFixed(1)}s
              </span>
            </div>
            <button
              onClick={() => handlePlaySequence(sequence)}
              className="play-button"
              disabled={playerState.isPlaying}
            >
              ▶️ Play
            </button>
          </div>
        ))}

        {generatedSequences.length === 0 && (
          <div className="empty-state">
            🎹 Play some notes to generate AI continuations
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`neural-melody ${className}`}>
      <div className="neural-melody__header">
        <h2>🎵 Neural Melody Autocompletion</h2>
        <p>Play notes on the keyboard and watch AI continue your melodies</p>
      </div>

      <div className="neural-melody__layout">
        {/* Human Interface */}
        <div className="neural-melody__human">
          <h3>👤 Human Input</h3>
          <PianoKeyboard
            activeNotes={Array.from(playerState.activeNotes)}
            sustainMode={playerState.sustainMode}
            onNotePress={handleNotePress}
            onNoteRelease={handleNoteRelease}
            showLabels={true}
          />
          {renderControlPanel()}
        </div>

        {/* Machine Interface */}
        <div className="neural-melody__machine">
          <h3>🤖 AI Response</h3>
          {renderSequenceList()}

          {playerState.currentSequence && (
            <div className="current-sequence">
              <h4>Latest Generation</h4>
              <div className="sequence-visualization">
                {playerState.currentSequence.notes.map((note, index) => (
                  <div
                    key={index}
                    className="note-block"
                    style={{
                      height: `${((note.pitch - playerConfig.minNote) /
                        (playerConfig.maxNote - playerConfig.minNote)) * 100}%`,
                      width: `${(note.endTime - note.startTime) * 50}px`,
                      left: `${note.startTime * 50}px`,
                      backgroundColor: `hsl(${(note.pitch - 60) * 10}, 70%, 60%)`
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .neural-melody {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 16px;
          color: white;
          min-height: 600px;
        }

        .neural-melody__header {
          text-align: center;
          margin-bottom: 1rem;
        }

        .neural-melody__header h2 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .neural-melody__layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          flex: 1;
        }

        .neural-melody__human,
        .neural-melody__machine {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .neural-melody__human h3,
        .neural-melody__machine h3 {
          margin: 0;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .neural-melody__controls {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .control-group h3 {
          font-size: 1rem;
          margin: 0;
          color: #94a3b8;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.5rem;
        }

        .control-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .control-item label {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .control-item small {
          color: #94a3b8;
          font-size: 0.75rem;
        }

        .control-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          -webkit-appearance: none;
        }

        .control-slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .control-button {
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 8px;
          background: linear-gradient(45deg, #3b82f6, #1d4ed8);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .control-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .control-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .control-button.secondary {
          background: linear-gradient(45deg, #64748b, #475569);
        }

        .control-button.recording {
          background: linear-gradient(45deg, #ef4444, #dc2626);
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .status-indicator {
          padding: 0.75rem;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
        }

        .status-indicator.loading {
          background: rgba(251, 191, 36, 0.2);
          border: 1px solid rgba(251, 191, 36, 0.3);
          color: #fbbf24;
        }

        .status-indicator.loaded {
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }

        .neural-melody__sequences {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
        }

        .sequence-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .sequence-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .sequence-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .sequence-title {
          font-weight: 600;
        }

        .sequence-details {
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .play-button {
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 6px;
          background: linear-gradient(45deg, #10b981, #059669);
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .play-button:hover {
          transform: scale(1.05);
        }

        .play-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #64748b;
          font-style: italic;
        }

        .current-sequence {
          margin-top: 1rem;
        }

        .sequence-visualization {
          position: relative;
          height: 100px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          overflow-x: auto;
        }

        .note-block {
          position: absolute;
          bottom: 0;
          border-radius: 2px;
          opacity: 0.8;
          transition: all 0.2s ease;
        }

        .note-block:hover {
          opacity: 1;
          transform: scaleY(1.1);
        }

        @media (max-width: 1024px) {
          .neural-melody__layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .neural-melody {
            padding: 1rem;
          }

          .neural-melody__header h2 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default NeuralMelodyComponent;