
import React from 'react';

interface ChoiceButtonsProps {
    choices: string[];
    onChoose: (choice: string) => void;
}

const ChoiceButtons: React.FC<ChoiceButtonsProps> = ({ choices, onChoose }) => {
    return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
            {choices.map((choice, index) => (
                <button
                    key={index}
                    onClick={() => onChoose(choice)}
                    className="w-full bg-slate-800 text-gray-200 font-medium py-3 px-4 rounded-lg border border-slate-700 hover:bg-indigo-600 hover:border-indigo-500 transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-left"
                >
                    {choice}
                </button>
            ))}
        </div>
    );
};

export default ChoiceButtons;
