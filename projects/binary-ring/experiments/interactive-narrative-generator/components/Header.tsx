
import React from 'react';

interface HeaderProps {
    onRestart: () => void;
    showRestart: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRestart, showRestart }) => {
    return (
        <header className="py-6 px-4 sm:px-6 lg:px-8 bg-slate-900/70 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-700">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Interactive Narrative Generator
                </h1>
                {showRestart && (
                     <button
                        onClick={onRestart}
                        className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-200"
                    >
                        New Story
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
