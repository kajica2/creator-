
import React, { useState, useCallback } from 'react';
import { GameState } from './types';
import type { StorySegment, StoryHistoryItem } from './types';
import { fetchStorySegment } from './services/geminiService';
import Header from './components/Header';
import GenreSelector from './components/GenreSelector';
import StoryDisplay from './components/StoryDisplay';
import ChoiceButtons from './components/ChoiceButtons';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.SELECT_GENRE);
    const [storyHistory, setStoryHistory] = useState<StoryHistoryItem[]>([]);
    const [currentChoices, setCurrentChoices] = useState<string[]>([]);
    const [selectedGenre, setSelectedGenre] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleRestart = () => {
        setGameState(GameState.SELECT_GENRE);
        setStoryHistory([]);
        setCurrentChoices([]);
        setSelectedGenre('');
        setErrorMessage('');
    };

    const getNextSegment = useCallback(async (genre: string, history: StoryHistoryItem[], choice: string | null) => {
        setGameState(GameState.LOADING);
        setErrorMessage('');
        try {
            const segment: StorySegment = await fetchStorySegment(genre, history, choice);
            const newHistoryItem: StoryHistoryItem = {
                narrative: segment.narrative,
                choiceMade: null, // This will be set on the *previous* item
            };
            
            setStoryHistory(prev => {
                const updatedHistory = [...prev];
                if (updatedHistory.length > 0 && choice) {
                    updatedHistory[updatedHistory.length - 1].choiceMade = choice;
                }
                return [...updatedHistory, newHistoryItem];
            });

            setCurrentChoices(segment.choices);
            setGameState(GameState.PLAYING);
        } catch (error) {
            if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('An unknown error occurred.');
            }
            setGameState(GameState.ERROR);
        }
    }, []);

    const handleSelectGenre = (genre: string) => {
        setSelectedGenre(genre);
        getNextSegment(genre, [], null);
    };

    const handleMakeChoice = (choice: string) => {
        getNextSegment(selectedGenre, storyHistory, choice);
    };

    const renderContent = () => {
        switch (gameState) {
            case GameState.SELECT_GENRE:
                return <GenreSelector onSelectGenre={handleSelectGenre} />;
            case GameState.LOADING:
                return <LoadingSpinner />;
            case GameState.PLAYING:
                return (
                    <>
                        <StoryDisplay history={storyHistory} />
                        <ChoiceButtons choices={currentChoices} onChoose={handleMakeChoice} />
                    </>
                );
            case GameState.ERROR:
                return (
                    <div className="text-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
                        <h3 className="text-2xl font-bold text-red-400 mb-2">An Error Occurred</h3>
                        <p className="text-red-300 mb-4">{errorMessage}</p>
                        <button
                            onClick={() => getNextSegment(selectedGenre, storyHistory.slice(0, -1), storyHistory[storyHistory.length - 2]?.choiceMade || null)}
                            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 font-sans">
            <Header onRestart={handleRestart} showRestart={gameState !== GameState.SELECT_GENRE} />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default App;
