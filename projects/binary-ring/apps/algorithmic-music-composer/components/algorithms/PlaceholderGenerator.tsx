
import React from 'react';
import type { Note } from '../../types';
import { PianoRoll } from '../PianoRoll';

interface PlaceholderGeneratorProps {
    algorithmName: string;
}

export const PlaceholderGenerator: React.FC<PlaceholderGeneratorProps> = ({ algorithmName }) => {
    const emptyNotes: Note[] = [];

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-white">Coming Soon!</h3>
                <p className="text-gray-400 mt-2">The interactive generator for <strong>{algorithmName}</strong> is currently under development.</p>
            </div>
            <PianoRoll notes={emptyNotes} />
        </div>
    );
};
