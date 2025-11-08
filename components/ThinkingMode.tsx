import React, { useState } from 'react';
import { PromptType, RagSource, User, Page } from '../types';
import { SaveToDriveButton } from './SaveToDriveButton';
import { getGeminiClient } from '../utils/geminiClient';

interface ThinkingModeProps {
    onPromptGenerated: (prompt: { type: PromptType; prompt: string }) => void;
    language: 'en' | 'sr';
    aiContext: string;
    ragSources: RagSource[];
    user: User | null;
    onAttemptGeneration: (generationFn: () => Promise<void>) => void;
    onContentGenerated: (page: Page, content: any) => void;
}

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v2a1 1 0 110 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a1 1 0 110-2V5zm3 4a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zm5 0a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

export const ThinkingMode: React.FC<ThinkingModeProps> = ({ onPromptGenerated, language, aiContext, ragSources, user, onAttemptGeneration, onContentGenerated }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt) {
            setError("Please enter a prompt or question.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResponse(null);

        onPromptGenerated({ type: PromptType.ThinkingMode, prompt });

        try {
            const ai = getGeminiClient();
            const contextPrefix = aiContext ? `ARTIST CONTEXT: "${aiContext}". Use this to inform the response. ` : '';
            const textRagSources = ragSources.filter(s => s.mimeType.startsWith('text/'));
            const ragContext = textRagSources.length > 0
                ? `USER-PROVIDED CONTEXT:\n---\n${textRagSources.map(s => `Source (${s.type}: ${s.name}):\n${s.content}`).join('\n---\n')}\n---\n\n`
                : '';
            
            const fullPrompt = `${ragContext}${contextPrefix}The user has a complex query and requires a detailed, well-reasoned response. Here is the query: "${prompt}". ${language === 'sr' ? 'The entire response must be in Serbian.' : ''}`;
            
            const genAIResponse = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: fullPrompt,
                config: {
                    thinkingConfig: { thinkingBudget: 32768 },
                },
            });

            setResponse(genAIResponse.text);
            onContentGenerated('Thinking Mode', genAIResponse.text);

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
    
    return (
        <div className="space-y-6">
            <div className="text-center">
                 <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">Thinking Mode</h2>
                <p className="text-gray-400 mt-2 max-w-2xl mx-auto">Ask complex questions, generate detailed plans, or explore intricate ideas. Powered by Gemini 2.5 Pro for deep reasoning.</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
                 <div>
                    <label htmlFor="thinking-prompt" className="font-bold text-gray-300">Enter your complex query</label>
                    <textarea
                        id="thinking-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Generate a 12-month strategic plan for me as an independent audio-visual artist. Include milestones for creating a new body of work, securing three gallery exhibitions, and increasing my online following by 5,000. Provide a month-by-month breakdown..."
                        className="mt-2 w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                        rows={8}
                    />
                </div>
                 {error && <p className="text-sm text-red-400">{error}</p>}
                 <button
                    onClick={triggerGenerate}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <BrainIcon />
                    {isLoading ? 'Thinking...' : 'Engage AI'}
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="ml-3">The AI is thinking deeply...</p>
                </div>
            )}

            {response && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 md:p-6 space-y-4 animate-fade-in">
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">Response</h2>
                    <pre className="text-gray-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">{response}</pre>
                     {user && (
                        <div className="pt-4 border-t border-gray-700">
                            <SaveToDriveButton
                                user={user}
                                content={response}
                                fileName={`thinking_mode_${prompt.substring(0,20).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`}
                                mimeType="text/plain"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};