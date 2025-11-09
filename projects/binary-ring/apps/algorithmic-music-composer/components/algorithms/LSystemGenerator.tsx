
import React, { useState, useCallback } from 'react';
import type { Note } from '../../types';
import { PianoRoll } from '../PianoRoll';
import { ControlContainer, Slider, Button } from '../common/Controls';

const PRESETS = {
    fractal_melody: {
        axiom: "F",
        rules: "F -> F+F-F-F+F",
        iterations: 3,
        angle: 2,
    },
    cantor_rhythm: {
        axiom: "A",
        rules: "A -> ABA\nB -> BBB",
        iterations: 4,
        angle: 0
    },
    plant_growth: {
        axiom: "X",
        rules: "X -> F[+X]F[-X]+X\nF -> FF",
        iterations: 4,
        angle: 3
    }
}

export const LSystemGenerator: React.FC = () => {
    const [axiom, setAxiom] = useState(PRESETS.fractal_melody.axiom);
    const [rules, setRules] = useState(PRESETS.fractal_melody.rules);
    const [iterations, setIterations] = useState(PRESETS.fractal_melody.iterations);
    const [angle, setAngle] = useState(PRESETS.fractal_melody.angle);
    const [notes, setNotes] = useState<Note[]>([]);
    const [error, setError] = useState<string | null>(null);

    const loadPreset = (presetName: keyof typeof PRESETS) => {
        const preset = PRESETS[presetName];
        setAxiom(preset.axiom);
        setRules(preset.rules);
        setIterations(preset.iterations);
        setAngle(preset.angle);
    }

    const generateMusic = useCallback(() => {
        setError(null);
        try {
            const parsedRules: { [key: string]: string } = {};
            rules.split('\n').forEach(line => {
                if (line.includes('->')) {
                    const [key, value] = line.split('->').map(s => s.trim());
                    if(key && value) parsedRules[key] = value;
                }
            });
            
            let currentString = axiom;
            for (let i = 0; i < iterations; i++) {
                let nextString = "";
                for (const char of currentString) {
                    nextString += parsedRules[char] || char;
                }
                currentString = nextString;
            }

            const generatedNotes: Note[] = [];
            let time = 0;
            let currentPitch = 60; // C4
            const stateStack: { pitch: number, time: number }[] = [];
            
            for (const char of currentString) {
                switch (char) {
                    case 'F':
                    case 'G':
                    case 'A':
                    case 'B':
                    case 'C':
                    case 'D':
                    case 'E':
                         generatedNotes.push({
                            pitch: currentPitch,
                            start: time,
                            duration: 0.25,
                            velocity: 100
                        });
                        time += 0.25;
                        break;
                    case '+':
                        currentPitch += angle;
                        break;
                    case '-':
                        currentPitch -= angle;
                        break;
                    case '[':
                        stateStack.push({ pitch: currentPitch, time });
                        break;
                    case ']':
                        if (stateStack.length > 0) {
                            const poppedState = stateStack.pop()!;
                            currentPitch = poppedState.pitch;
                            time = poppedState.time;
                        }
                        break;
                }
            }
            setNotes(generatedNotes);

        } catch (e) {
            setError("Failed to parse rules or generate sequence. Check rule format (e.g., A -> AB).");
            console.error(e);
        }
    }, [axiom, rules, iterations, angle]);

    return (
        <div className="space-y-6">
            <ControlContainer title="L-System Controls">
                <div className="flex space-x-2">
                    {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map(key => (
                        <button key={key} onClick={() => loadPreset(key)} className="text-xs bg-gray-700 hover:bg-gray-600 text-white font-medium py-1 px-3 rounded-full transition-colors">
                            {key.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Axiom (Start)</label>
                    <input value={axiom} onChange={e => setAxiom(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 font-mono text-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Rules</label>
                    <textarea value={rules} onChange={e => setRules(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 font-mono text-sm focus:ring-blue-500 focus:border-blue-500" rows={3}/>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Slider label="Iterations" value={iterations} min={1} max={8} onChange={e => setIterations(Number(e.target.value))} tooltip="How many times to apply the rules."/>
                <Slider label="Pitch Angle" value={angle} min={-12} max={12} onChange={e => setAngle(Number(e.target.value))} tooltip="Pitch change for '+' and '-' symbols (in semitones)." />
                <Button onClick={generateMusic}>Generate Music</Button>
            </ControlContainer>
            <PianoRoll notes={notes} />
        </div>
    );
};
