import React, { useState, useEffect } from 'react';
import { Type } from '@google/genai';
import { SunoLyricsResponse, PromptType, RagSource, User, Page } from '../types';
import { SaveToDriveButton } from './SaveToDriveButton';
import { getGeminiClient } from '../utils/geminiClient';

interface SunoLyricsGeneratorProps {
    onPromptGenerated: (prompt: { type: PromptType; prompt: string }) => void;
    language: 'en' | 'sr';
    aiContext: string;
    ragSources: RagSource[];
    user: User | null;
    onAttemptGeneration: (generationFn: () => Promise<void>) => void;
    onContentGenerated: (page: Page, content: any) => void;
}

const MusicNoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V3z" />
    </svg>
);

const CopyIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM5 11a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z" />
    </svg>
);

export const SunoLyricsGenerator: React.FC<SunoLyricsGeneratorProps> = ({ onPromptGenerated, language, aiContext, ragSources, user, onAttemptGeneration, onContentGenerated }) => {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lyricsData, setLyricsData] = useState<SunoLyricsResponse | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        if (!topic) {
            setError("Please describe the song's theme or topic.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setLyricsData(null);

        onPromptGenerated({ type: PromptType.SunoLyrics, prompt: topic });

        try {
            const ai = getGeminiClient();
            const contextPrefix = aiContext ? `ARTIST CONTEXT: "${aiContext}". Use this to inform the lyrical style and themes. ` : '';
            const textRagSources = ragSources.filter(s => s.mimeType.startsWith('text/'));
            const ragContext = textRagSources.length > 0
                ? `USER-PROVIDED CONTEXT:\n---\n${textRagSources.map(s => `Source (${s.type}: ${s.name}):\n${s.content}`).join('\n---\n')}\n---\n\n`
                : '';
            
            const prompt = `${ragContext}${contextPrefix}Generate song lyrics for Suno AI based on this theme: "${topic}". The structure should be clear and ready for music generation, using tags like [Verse], [Chorus], [Bridge], [Instrumental], [Intro], [Outro]. Create a catchy title and the full lyrics. ${language === 'sr' ? 'The entire response, including all keys and values in the JSON schema, must be in Serbian. Note that structural tags like [Verse], [Chorus] should remain in English.' : ''}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "A catchy title for the song." },
                            lyrics: { type: Type.STRING, description: "The full song lyrics, formatted with tags like [Verse], [Chorus], etc." }
                        },
                        required: ["title", "lyrics"]
                    },
                },
            });

            const jsonStr = response.text.trim();
            const parsedData = JSON.parse(jsonStr) as SunoLyricsResponse;
            setLyricsData(parsedData);
            onContentGenerated('AI Lyrics', parsedData);

        } catch (e) {
            console.error(e);
            setError(`An error occurred: ${(e as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const triggerGenerate = () => {
        onAttemptGeneration(handleGenerate);
    };

    const handleCopy = () => {
        if (!lyricsData) return;
        navigator.clipboard.writeText(lyricsData.lyrics);
        setIsCopied(true);
    };

     useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => setIsCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isCopied]);
    
    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
                 <div>
                    <label htmlFor="suno-topic" className="font-bold text-gray-300">Describe Your Song</label>
                    <textarea
                        id="suno-topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., A synthwave track about exploring a neon city at night, feeling hopeful but lonely."
                        className="mt-2 w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                        rows={3}
                    />
                </div>
                 {error && <p className="text-sm text-red-400">{error}</p>}
                 <button
                    onClick={triggerGenerate}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <MusicNoteIcon />
                    {isLoading ? 'Generating Lyrics...' : 'Generate Suno Lyrics'}
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {lyricsData && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 md:p-6 space-y-4 animate-fade-in">
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">{lyricsData.title}</h2>
                        <button
                            onClick={handleCopy}
                            className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-1.5 px-3 rounded-full transition-colors"
                        >
                            <CopyIcon />
                            <span>{isCopied ? 'Copied!' : 'Copy Lyrics'}</span>
                        </button>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">{lyricsData.lyrics}</p>
                     {user && (
                        <div className="pt-4 border-t border-gray-700">
                            <SaveToDriveButton
                                user={user}
                                content={lyricsData.lyrics}
                                fileName={`${lyricsData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`}
                                mimeType="text/plain"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};