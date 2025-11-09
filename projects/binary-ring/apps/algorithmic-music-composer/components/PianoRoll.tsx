
import React from 'react';
import type { Note } from '../types';
import { PIANO_ROLL_CONFIG } from '../constants';

interface PianoRollProps {
  notes: Note[];
}

export const PianoRoll: React.FC<PianoRollProps> = ({ notes }) => {
  const { PITCH_MIN, PITCH_MAX, BEAT_WIDTH, NOTE_HEIGHT, TOTAL_BEATS } = PIANO_ROLL_CONFIG;
  const pitchRange = PITCH_MAX - PITCH_MIN + 1;
  const totalWidth = TOTAL_BEATS * BEAT_WIDTH;
  const totalHeight = pitchRange * NOTE_HEIGHT;

  const noteToName = (pitch: number) => {
    const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(pitch / 12) - 1;
    return scale[pitch % 12] + octave;
  };

  return (
    <div className="bg-gray-950 p-4 rounded-lg border border-gray-700 overflow-hidden">
        <h3 className="text-lg font-semibold text-white mb-4">Generated Output</h3>
        <div className="flex">
        {/* Keyboard */}
        <div className="flex-shrink-0">
          {Array.from({ length: pitchRange }, (_, i) => {
            const pitch = PITCH_MAX - i;
            const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12);
            return (
              <div
                key={pitch}
                style={{ height: `${NOTE_HEIGHT}px` }}
                className={`w-12 text-xs flex items-center justify-end pr-2 ${
                  isBlackKey ? 'bg-gray-700 text-gray-300' : 'bg-gray-600 text-white'
                }`}
              >
                {noteToName(pitch)}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="relative overflow-x-auto w-full" style={{ height: `${totalHeight}px` }}>
            <div
                className="absolute top-0 left-0 bg-no-repeat bg-center"
                style={{
                    width: `${totalWidth}px`,
                    height: `${totalHeight}px`,
                    backgroundImage: `
                        linear-gradient(to right, rgba(107, 114, 128, 0.2) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(107, 114, 128, 0.2) 1px, transparent 1px)
                    `,
                    backgroundSize: `${BEAT_WIDTH * 4}px ${NOTE_HEIGHT * 12}px, ${BEAT_WIDTH}px ${NOTE_HEIGHT}px`,
                }}
            />

            {/* Notes */}
            {notes.map((note, index) => {
                const y = (PITCH_MAX - note.pitch) * NOTE_HEIGHT;
                const x = note.start * BEAT_WIDTH;
                const width = note.duration * BEAT_WIDTH;

                if (note.pitch < PITCH_MIN || note.pitch > PITCH_MAX) return null;

                return (
                    <div
                        key={index}
                        className="absolute bg-blue-500 rounded-sm border border-blue-300 opacity-80"
                        style={{
                            top: `${y}px`,
                            left: `${x}px`,
                            width: `${width}px`,
                            height: `${NOTE_HEIGHT}px`,
                            opacity: 0.6 + note.velocity / 127 * 0.4,
                        }}
                        title={`Pitch: ${noteToName(note.pitch)} (${note.pitch}), Vel: ${note.velocity}`}
                    />
                );
            })}
        </div>
        </div>
    </div>
  );
};
