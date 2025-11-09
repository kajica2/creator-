
import React from 'react';

interface GenreSelectorProps {
    onSelectGenre: (genre: string) => void;
}

const genres = ["Fantasy", "Sci-Fi", "Mystery", "Adventure", "Horror", "Cyberpunk"];

const GenreSelector: React.FC<GenreSelectorProps> = ({ onSelectGenre }) => {
    return (
        <div className="text-center p-8 flex flex-col items-center justify-center animate-fade-in">
            <h2 className="text-4xl font-bold mb-4 text-gray-100">Choose Your Genre</h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl">Select a genre to begin your unique, AI-powered adventure. Each choice you make will shape the narrative.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {genres.map(genre => (
                    <button
                        key={genre}
                        onClick={() => onSelectGenre(genre)}
                        className="bg-slate-800 border border-slate-700 text-gray-200 font-semibold py-4 px-8 rounded-lg hover:bg-indigo-600 hover:border-indigo-500 hover:scale-105 transform transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                        {genre}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default GenreSelector;
