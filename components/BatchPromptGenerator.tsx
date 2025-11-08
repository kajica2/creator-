import React, { useState } from 'react';
import { Type } from '@google/genai';
import { PromptType, RagSource, User, Page } from '../types';
import { SaveToDriveButton } from './SaveToDriveButton';
import { getGeminiClient } from '../utils/geminiClient';

interface BatchPromptGeneratorProps {
    onPromptGenerated: (prompt: { type: PromptType; prompt: string }) => void;
    language: 'en' | 'sr';
    aiContext: string;
    ragSources: RagSource[];
    user: User | null;
    onAttemptGeneration: (generationFn: () => Promise<void>) => void;
    onContentGenerated: (page: Page, content: any) => void;
}

const ListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const CopyIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM5 11a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z" />
    </svg>
);


export const BatchPromptGenerator: React.FC<BatchPromptGeneratorProps> = ({ onPromptGenerated, language, aiContext, ragSources, user, onAttemptGeneration, onContentGenerated }) => {
    const [folderTheme, setFolderTheme] = useState('');
    const [promptCount, setPromptCount] = useState(10);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        if (!folderTheme) {
            setError("Please describe the theme for your media folder.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedPrompts([]);

        const historyPrompt = `Theme: ${folderTheme}\nCount: ${promptCount}`;
        onPromptGenerated({ type: PromptType.BatchImagePrompts, prompt: historyPrompt });

        try {
            const ai = getGeminiClient();
            const contextPrefix = aiContext ? `ARTIST CONTEXT: "${aiContext}". The prompts should strongly reflect this style. ` : '';
            const textRagSources = ragSources.filter(s => s.mimeType.startsWith('text/'));
            const ragContext = textRagSources.length > 0
                ? `USER-PROVIDED CONTEXT:\n---\n${textRagSources.map(s => `Source (${s.type}: ${s.name}):\n${s.content}`).join('\n---\n')}\n---\n\n`
                : '';
            
            const prompt = `${ragContext}${contextPrefix}You are a creative director for a digital artist. Generate a list of ${promptCount} unique, detailed, and inspiring text-to-image prompts for a media folder with the theme: "${folderTheme}". Each prompt should be a complete sentence or two, describing a scene, mood, and style. They should be suitable for models like Imagen or Midjourney. ${language === 'sr' ? 'The entire response, including all keys and values in the JSON schema, must be in Serbian.' : ''}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            prompts: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING },
                                description: `An array of ${promptCount} text-to-image prompts.`
                            }
                        },
                        required: ["prompts"]
                    },
                },
            });

            const jsonStr = response.text.trim();
            const parsedData = JSON.parse(jsonStr) as { prompts: string[] };
            setGeneratedPrompts(parsedData.prompts);
            onContentGenerated('Batch Prompts', parsedData.prompts);

        } catch (e) {
            console.error(e);
            setError(`An error occurred: ${(e as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const triggerGenerate = () => {
        // This is a single generation call, so the count is 1
        onAttemptGeneration(handleGenerate);
    };

    const handleCopy = () => {
        if (generatedPrompts.length === 0) return;
        const fullText = generatedPrompts.join('\n');
        navigator.clipboard.writeText(fullText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
                 <div>
                    <label htmlFor="folder-theme" className="font-bold text-gray-300">1. Describe the media folder theme</label>
                    <textarea
                        id="folder-theme"
                        value={folderTheme}
                        onChange={(e) => setFolderTheme(e.target.value)}
                        placeholder="e.g., A VJ pack about ethereal cosmic horror, vintage sci-fi book covers, glitch art inspired by circuit boards..."
                        className="mt-2 w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                        rows={3}
                    />
                </div>
                 <div>
                    <label htmlFor="prompt-count" className="font-bold text-gray-300">2. Number of prompts to generate</label>
                    <input
                        id="prompt-count"
                        type="number"
                        value={promptCount}
                        onChange={(e) => setPromptCount(Math.max(1, parseInt(e.target.value, 10)))}
                        min="1"
                        max="50"
                        className="mt-2 w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                    />
                 </div>
                 {error && <p className="text-sm text-red-400">{error}</p>}
                 <button
                    onClick={triggerGenerate}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <ListIcon />
                    {isLoading ? 'Generating Prompts...' : 'Generate Batch of Prompts'}
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {generatedPrompts.length > 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 md:p-6 space-y-4 animate-fade-in">
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">Generated Prompts ({generatedPrompts.length})</h2>
                        <button
                            onClick={handleCopy}
                            className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-1.5 px-3 rounded-full transition-colors"
                        >
                            <CopyIcon />
                            <span>{isCopied ? 'Copied!' : 'Copy All'}</span>
                        </button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {generatedPrompts.map((prompt, index) => (
                             <div key={index} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                <p className="text-sm text-gray-300 font-mono">
                                    <span className="text-purple-400 mr-2">{index + 1}.</span>
                                    {prompt}
                                </p>
                            </div>
                        ))}
                    </div>
                     {user && (
                        <div className="pt-4 border-t border-gray-700">
                            <SaveToDriveButton
                                user={user}
                                content={generatedPrompts.join('\n')}
                                fileName={`image_prompts_${folderTheme.substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`}
                                mimeType="text/plain"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};