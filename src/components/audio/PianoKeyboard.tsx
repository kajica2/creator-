import React, { useEffect, useState, useCallback } from 'react';
import { KeyboardKey } from './types';

interface PianoKeyboardProps {
  activeNotes: number[];
  sustainMode: boolean;
  onNotePress: (note: number) => void;
  onNoteRelease: (note: number) => void;
  startOctave?: number;
  octaves?: number;
  showLabels?: boolean;
  className?: string;
}

const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  activeNotes,
  sustainMode,
  onNotePress,
  onNoteRelease,
  startOctave = 3,
  octaves = 2,
  showLabels = true,
  className = ''
}) => {
  const [keys, setKeys] = useState<KeyboardKey[]>([]);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Create keyboard layout
  useEffect(() => {
    const keyLayout = [];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    for (let octave = startOctave; octave < startOctave + octaves; octave++) {
      for (let i = 0; i < 12; i++) {
        const midiNote = (octave + 1) * 12 + i;
        const noteName = noteNames[i];
        const isBlack = noteName.includes('#');

        keyLayout.push({
          note: midiNote,
          keyName: noteName,
          isBlack,
          isActive: false,
          octave
        });
      }
    }

    setKeys(keyLayout);
  }, [startOctave, octaves]);

  // Key mapping for computer keyboard
  const keyMapping: { [key: string]: number } = {
    'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64, 'f': 65, 't': 66,
    'g': 67, 'y': 68, 'h': 69, 'u': 70, 'j': 71, 'k': 72,
    'z': 48, 'q': 49, 'x': 50, '2': 51, 'c': 52, 'v': 53,
    '3': 54, 'b': 55, '4': 56, 'n': 57, '5': 58, 'm': 59
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (keyMapping[key] && !pressedKeys.has(key)) {
      event.preventDefault();
      setPressedKeys(prev => new Set(prev).add(key));
      onNotePress(keyMapping[key]);
    }
  }, [onNotePress, pressedKeys]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (keyMapping[key] && pressedKeys.has(key) && !sustainMode) {
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      onNoteRelease(keyMapping[key]);
    }
  }, [onNoteRelease, pressedKeys, sustainMode]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Handle sustain mode changes
  useEffect(() => {
    if (!sustainMode) {
      setPressedKeys(new Set());
    }
  }, [sustainMode]);

  const handleMouseDown = (note: number) => {
    onNotePress(note);
  };

  const handleMouseUp = (note: number) => {
    if (!sustainMode) {
      onNoteRelease(note);
    }
  };

  const getKeyClass = (key: KeyboardKey): string => {
    const isActive = activeNotes.includes(key.note);
    const baseClass = key.isBlack
      ? 'piano-key piano-key--black'
      : 'piano-key piano-key--white';

    const activeClass = isActive ? 'piano-key--active' : '';
    const sustainClass = sustainMode && isActive ? 'piano-key--sustained' : '';

    return `${baseClass} ${activeClass} ${sustainClass}`.trim();
  };

  const getKeyLabel = (key: KeyboardKey): string => {
    // Find the keyboard key that maps to this MIDI note
    const keyboardKey = Object.entries(keyMapping).find(([_, note]) => note === key.note);
    return keyboardKey ? keyboardKey[0].toUpperCase() : '';
  };

  const whiteKeys = keys.filter(key => !key.isBlack);
  const blackKeys = keys.filter(key => key.isBlack);

  return (
    <div className={`piano-keyboard ${className}`}>
      <div className="piano-keyboard__controls">
        <div className={`sustain-indicator ${sustainMode ? 'sustain-indicator--active' : ''}`}>
          <span>SUSTAIN {sustainMode ? 'ON' : 'OFF'}</span>
          <small>(Caps Lock to toggle)</small>
        </div>
      </div>

      <div className="piano-keyboard__keys">
        {/* White keys */}
        <div className="piano-keyboard__white-keys">
          {whiteKeys.map((key, index) => (
            <button
              key={`white-${key.note}`}
              className={getKeyClass(key)}
              onMouseDown={() => handleMouseDown(key.note)}
              onMouseUp={() => handleMouseUp(key.note)}
              onMouseLeave={() => handleMouseUp(key.note)}
            >
              {showLabels && (
                <div className="piano-key__label">
                  <span className="note-name">{key.keyName}</span>
                  <span className="key-binding">{getKeyLabel(key)}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Black keys */}
        <div className="piano-keyboard__black-keys">
          {blackKeys.map((key) => {
            const whiteKeyIndex = whiteKeys.findIndex(wk => wk.note === key.note - 1);
            const leftOffset = whiteKeyIndex >= 0 ? whiteKeyIndex * (100 / whiteKeys.length) : 0;

            return (
              <button
                key={`black-${key.note}`}
                className={getKeyClass(key)}
                style={{ left: `${leftOffset + (100 / whiteKeys.length) * 0.7}%` }}
                onMouseDown={() => handleMouseDown(key.note)}
                onMouseUp={() => handleMouseUp(key.note)}
                onMouseLeave={() => handleMouseUp(key.note)}
              >
                {showLabels && (
                  <div className="piano-key__label">
                    <span className="note-name">{key.keyName}</span>
                    <span className="key-binding">{getKeyLabel(key)}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .piano-keyboard {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .piano-keyboard__controls {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .sustain-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ccc;
          transition: all 0.3s ease;
        }

        .sustain-indicator--active {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
          color: #60a5fa;
        }

        .sustain-indicator small {
          font-size: 0.75rem;
          opacity: 0.7;
          margin-top: 0.25rem;
        }

        .piano-keyboard__keys {
          position: relative;
          height: 120px;
          width: 100%;
        }

        .piano-keyboard__white-keys {
          display: flex;
          width: 100%;
          height: 100%;
        }

        .piano-keyboard__black-keys {
          position: absolute;
          top: 0;
          width: 100%;
          height: 60%;
          pointer-events: none;
        }

        .piano-key {
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          user-select: none;
          pointer-events: auto;
        }

        .piano-key--white {
          background: linear-gradient(180deg, #fafafa 0%, #e5e5e5 100%);
          border: 1px solid #ccc;
          border-radius: 0 0 6px 6px;
          flex: 1;
          height: 100%;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .piano-key--white:hover {
          background: linear-gradient(180deg, #f0f0f0 0%, #d5d5d5 100%);
        }

        .piano-key--white:active,
        .piano-key--white.piano-key--active {
          background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          box-shadow:
            inset 0 2px 4px rgba(0, 0, 0, 0.2),
            0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .piano-key--black {
          background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
          border: 1px solid #333;
          border-radius: 0 0 4px 4px;
          width: 60%;
          height: 100%;
          position: absolute;
          z-index: 2;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .piano-key--black:hover {
          background: linear-gradient(180deg, #404040 0%, #2a2a2a 100%);
        }

        .piano-key--black:active,
        .piano-key--black.piano-key--active {
          background: linear-gradient(180deg, #7c3aed 0%, #5b21b6 100%);
          box-shadow:
            inset 0 2px 4px rgba(0, 0, 0, 0.3),
            0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .piano-key--sustained {
          animation: sustainPulse 2s ease-in-out infinite;
        }

        @keyframes sustainPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .piano-key__label {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.25rem;
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .note-name {
          font-weight: 600;
          margin-bottom: 0.125rem;
        }

        .key-binding {
          font-size: 0.6rem;
          opacity: 0.6;
          padding: 0.125rem 0.25rem;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          text-transform: uppercase;
        }

        .piano-key--white .key-binding {
          background: rgba(0, 0, 0, 0.1);
        }

        .piano-key--black .key-binding {
          background: rgba(255, 255, 255, 0.2);
          color: #ddd;
        }

        .piano-key--active .key-binding {
          background: rgba(255, 255, 255, 0.3);
          color: white;
        }

        @media (max-width: 768px) {
          .piano-keyboard__keys {
            height: 80px;
          }

          .piano-key__label {
            font-size: 0.6rem;
          }

          .key-binding {
            font-size: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PianoKeyboard;