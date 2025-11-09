
import React, { useState, useCallback, useMemo } from 'react';
import type { Note } from '../../types';
import { PianoRoll } from '../PianoRoll';
import { ControlContainer, Slider, Button } from '../common/Controls';
import { PIANO_ROLL_CONFIG } from '../../constants';

export const CellularAutomataGenerator: React.FC = () => {
    const [rule, setRule] = useState(110);
    const [steps, setSteps] = useState(64);
    const [notes, setNotes] = useState<Note[]>([]);

    const generateMusic = useCallback(() => {
        const width = steps;
        const height = PIANO_ROLL_CONFIG.PITCH_MAX - PIANO_ROLL_CONFIG.PITCH_MIN + 1;
        
        // Initialize first row with a single active cell in the middle
        let cells = Array(width).fill(0);
        cells[Math.floor(width / 2)] = 1;

        const grid = [cells];
        const ruleBinary = rule.toString(2).padStart(8, '0');

        for (let y = 1; y < height; y++) {
            const nextGeneration = Array(width).fill(0);
            for (let x = 0; x < width; x++) {
                const left = cells[(x - 1 + width) % width];
                const center = cells[x];
                const right = cells[(x + 1) % width];
                const pattern = `${left}${center}${right}`;
                const patternIndex = parseInt(pattern, 2);
                nextGeneration[x] = parseInt(ruleBinary[7 - patternIndex]);
            }
            grid.push(nextGeneration);
            cells = nextGeneration;
        }

        const generatedNotes: Note[] = [];
        const scale = [0, 2, 4, 7, 9]; // Pentatonic scale
        
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x] === 1) {
                    const pitchIndex = y % scale.length;
                    const octave = Math.floor(y / scale.length);
                    const pitch = PIANO_ROLL_CONFIG.PITCH_MIN + octave * 12 + scale[pitchIndex];
                    
                    if(pitch <= PIANO_ROLL_CONFIG.PITCH_MAX) {
                         generatedNotes.push({
                            pitch,
                            start: x * 0.5,
                            duration: 0.5,
                            velocity: 100
                        });
                    }
                }
            }
        }
        
        setNotes(generatedNotes);
    }, [rule, steps]);
    
    return (
        <div className="space-y-6">
            <ControlContainer title="Cellular Automata Controls (Wolfram Rules)">
                <Slider
                    label="Rule"
                    value={rule}
                    min={0}
                    max={255}
                    onChange={(e) => setRule(Number(e.target.value))}
                    tooltip="The Wolfram rule number (0-255) to govern cell evolution."
                />
                <Slider
                    label="Time Steps"
                    value={steps}
                    min={16}
                    max={PIANO_ROLL_CONFIG.TOTAL_BEATS}
                    step={4}
                    onChange={(e) => setSteps(Number(e.target.value))}
                    tooltip="The number of time steps (columns) to generate."
                />
                <Button onClick={generateMusic}>
                    Generate Music
                </Button>
            </ControlContainer>
            <PianoRoll notes={notes} />
        </div>
    );
};
