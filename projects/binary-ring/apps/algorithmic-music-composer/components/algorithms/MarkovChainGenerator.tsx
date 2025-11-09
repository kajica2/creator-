
import React, { useState, useCallback } from 'react';
import type { Note } from '../../types';
import { PianoRoll } from '../PianoRoll';
import { ControlContainer, Slider, Button } from '../common/Controls';

export const MarkovChainGenerator: React.FC = () => {
    const [trainingData, setTrainingData] = useState('60,62,64,65,67,65,64,62');
    const [order, setOrder] = useState(2);
    const [length, setLength] = useState(32);
    const [notes, setNotes] = useState<Note[]>([]);
    const [error, setError] = useState<string | null>(null);

    const generateMusic = useCallback(() => {
        setError(null);
        const sequence = trainingData.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));

        if (sequence.length <= order) {
            setError('Training data must be longer than the Markov order.');
            return;
        }

        const transitions: { [key: string]: number[] } = {};
        for (let i = 0; i < sequence.length - order; i++) {
            const state = sequence.slice(i, i + order).join(',');
            const nextNote = sequence[i + order];
            if (!transitions[state]) {
                transitions[state] = [];
            }
            transitions[state].push(nextNote);
        }

        if (Object.keys(transitions).length === 0) {
            setError('Could not build a transition matrix from the training data. Ensure data is comma-separated numbers.');
            return;
        }

        const startKeys = Object.keys(transitions);
        let currentStateKey = startKeys[Math.floor(Math.random() * startKeys.length)];
        let result = currentStateKey.split(',').map(Number);

        for (let i = 0; i < length - order; i++) {
            const possibleNext = transitions[currentStateKey];
            if (!possibleNext) {
                // Dead end, jump to a random state
                currentStateKey = startKeys[Math.floor(Math.random() * startKeys.length)];
                result.push(...currentStateKey.split(',').map(Number));
                i += order-1; // account for adding multiple notes
                continue;
            }
            const nextNote = possibleNext[Math.floor(Math.random() * possibleNext.length)];
            result.push(nextNote);
            currentStateKey = result.slice(-order).join(',');
        }

        const generatedNotes: Note[] = result.slice(0, length).map((pitch, i) => ({
            pitch,
            start: i * 0.5,
            duration: 0.5,
            velocity: 90 + Math.floor(Math.random() * 20),
        }));
        setNotes(generatedNotes);

    }, [trainingData, order, length]);

    return (
        <div className="space-y-6">
            <ControlContainer title="Markov Chain Controls">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Training Data (MIDI notes)</label>
                    <textarea
                        value={trainingData}
                        onChange={(e) => setTrainingData(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="e.g., 60,62,64,62,65,67,65,64"
                    />
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>
                <Slider
                    label="Markov Order"
                    value={order}
                    min={1}
                    max={5}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    tooltip="The number of previous notes to consider for predicting the next one."
                />
                <Slider
                    label="Output Length"
                    value={length}
                    min={8}
                    max={64}
                    onChange={(e) => setLength(Number(e.target.value))}
                    tooltip="The total number of notes in the generated sequence."
                />
                <Button onClick={generateMusic}>
                    Generate Music
                </Button>
            </ControlContainer>
            <PianoRoll notes={notes} />
        </div>
    );
};
