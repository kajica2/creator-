
import React from 'react';
import type { StoryHistoryItem } from '../types';

interface StoryDisplayProps {
    history: StoryHistoryItem[];
}

const StoryDisplay: React.FC<StoryDisplayProps> = ({ history }) => {
    return (
        <div className="p-6 bg-slate-800/50 rounded-lg shadow-lg border border-slate-700 prose prose-invert max-w-none prose-p:text-gray-300 prose-p:leading-relaxed animate-fade-in">
            {history.map((item, index) => (
                <React.Fragment key={index}>
                    <p>{item.narrative}</p>
                    {item.choiceMade && (
                        <p className="text-indigo-400 italic my-4 border-l-4 border-indigo-500 pl-4">
                            &rarr; You chose: {item.choiceMade}
                        </p>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default StoryDisplay;
