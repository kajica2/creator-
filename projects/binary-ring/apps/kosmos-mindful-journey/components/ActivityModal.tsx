import React, { useState, useEffect, useCallback } from 'react';
import { Activity } from '../types';
import { useGame } from '../hooks/useGameLogic';
import { generateJournalPrompt } from '../services/geminiService';
import { BLUEPRINTS_DATA } from '../constants';

const ActivityModal: React.FC<{ activity: Activity; onClose: () => void; }> = ({ activity, onClose }) => {
    const [stage, setStage] = useState<'intro' | 'active' | 'journal' | 'complete'>('intro');
    const [timeLeft, setTimeLeft] = useState(activity.duration || 60);
    const [journalPrompt, setJournalPrompt] = useState('Loading prompt...');
    const [journalText, setJournalText] = useState('');
    const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
    // Fix: Remove ascendSphere as it's now handled by the reducer automatically.
    const { addEnergy, addIp, spendEnergy, completeJournalEntry, state } = useGame();

    const getNextJournalBlueprint = () => {
        for (const blueprintId of state.unlockedBlueprints) {
            const blueprint = BLUEPRINTS_DATA.find(b => b.id === blueprintId);
            if (blueprint && !state.craftedArtifacts.includes(blueprint.unlocksArtifact)) {
                const entriesCount = state.journalEntries.filter(e => e.blueprintId === blueprintId).length;
                if (entriesCount < blueprint.nodes.length) {
                    return { blueprintId, nodeIndex: entriesCount };
                }
            }
        }
        return null;
    };

    const handleStart = () => setStage('active');

    const handleJournalSubmit = () => {
        const journalTarget = getNextJournalBlueprint();
        if (journalTarget) {
            completeJournalEntry({
                blueprintId: journalTarget.blueprintId,
                nodeIndex: journalTarget.nodeIndex,
                text: journalText,
            });

            // Fix: Removed buggy ascension logic that relied on stale state.
            // This is now handled automatically and correctly inside the game reducer.
        }
        setStage('complete');
        setTimeout(onClose, 2000);
    };

    const fetchPrompt = useCallback(async () => {
        if (!activity.sphere) return;
        setIsLoadingPrompt(true);
        try {
            const prompt = await generateJournalPrompt(activity.sphere.theme);
            setJournalPrompt(prompt);
        } catch (error) {
            console.error("Failed to generate journal prompt:", error);
            setJournalPrompt("What insight did you discover during your practice?");
        } finally {
            setIsLoadingPrompt(false);
        }
    }, [activity.sphere]);

    useEffect(() => {
        if (stage === 'active' && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (stage === 'active' && timeLeft === 0) {
            if (activity.type === 'meditation' && activity.sphere) {
                const energyCost = Math.floor(activity.duration! / 10);
                const ipGain = Math.floor(activity.duration! / 5);
                spendEnergy(energyCost);
                addIp(ipGain);
                fetchPrompt();
                setStage('journal');
            } else if (activity.type === 'breathing') {
                const energyGain = Math.floor(activity.duration! / 6);
                addEnergy(energyGain);
                setStage('complete');
                setTimeout(onClose, 2000);
            }
        }
    }, [stage, timeLeft, activity, addEnergy, addIp, spendEnergy, fetchPrompt, onClose]);
    
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const renderContent = () => {
        switch (stage) {
            case 'intro':
                return (
                    <>
                        <h2 className="text-3xl font-bold mb-4 text-amber-100">{activity.sphere?.quest.description || 'Breathing Exercise'}</h2>
                        <p className="text-slate-300 mb-8">Duration: {formatTime(activity.duration || 0)}</p>
                        <button onClick={handleStart} className="w-full bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-300 transition-colors duration-300">Begin</button>
                    </>
                );
            case 'active':
                return (
                     <div className="text-center">
                        <p className="text-lg text-slate-300 mb-4 capitalize">{activity.type}</p>
                        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                            <div 
                                className="absolute inset-0 border-4 border-amber-400 rounded-full transition-all duration-1000"
                                style={{ clipPath: `inset(0 ${100 - (timeLeft / activity.duration!) * 100}% 0 0)` }}
                            ></div>
                            <span className="text-5xl font-mono text-white">{formatTime(timeLeft)}</span>
                        </div>
                    </div>
                );
            case 'journal':
                return (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-amber-100">Place your insight on the Grid</h2>
                        <p className="text-slate-300 mb-4 italic">{isLoadingPrompt ? 'Loading...' : journalPrompt}</p>
                        <textarea
                            value={journalText}
                            onChange={(e) => setJournalText(e.target.value)}
                            className="w-full h-32 p-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:ring-amber-400 focus:border-amber-400"
                            placeholder="Your reflection..."
                        />
                        <button onClick={handleJournalSubmit} disabled={!journalText.trim()} className="mt-4 w-full bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed">Save Insight</button>
                    </>
                );
            case 'complete':
                 return <div className="text-center"><h2 className="text-2xl font-bold text-green-400">Complete!</h2></div>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md text-center shadow-2xl shadow-slate-900/50">
                {renderContent()}
                {stage !== 'complete' && <button onClick={onClose} className="text-slate-400 mt-6 hover:text-white transition-colors">Close</button>}
            </div>
        </div>
    );
};

export default ActivityModal;
