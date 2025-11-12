import React, { useState } from 'react';
import { Type } from '@google/genai';
import { AIConceptResponse, PromptType, RagSource, User, Page } from '../types';
import { SaveToDriveButton } from './SaveToDriveButton';
import { getGeminiClient } from '../utils/geminiClient';
import { aiUtilities, AIPromptTemplates } from '../src/shared/ai/AIUtilitiesLibrary';
import { platformOptimization } from '../src/shared/platform/PlatformOptimizationLibrary';

interface AIConceptGeneratorProps {
    onPromptGenerated: (prompt: { type: PromptType; prompt: string }) => void;
    language: 'en' | 'sr';
    aiContext: string;
    ragSources: RagSource[];
    user: User | null;
    onAttemptGeneration: (generationFn: () => Promise<void>) => void;
    onContentGenerated: (page: Page, content: any) => void;
}

const LightbulbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 14.95a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM4 10a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1zM10 18a1 1 0 001-1v-1a1 1 0 10-2 0v1a1 1 0 001 1zM9.343 15.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707z" />
        <path d="M10 4a6 6 0 100 12 6 6 0 000-12zM10 14a4 4 0 110-8 4 4 0 010 8z" />
    </svg>
);

export const AIConceptGenerator: React.FC<AIConceptGeneratorProps> = ({ onPromptGenerated, language, aiContext, ragSources, user, onAttemptGeneration, onContentGenerated }) => {
    const [theme, setTheme] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conceptData, setConceptData] = useState<AIConceptResponse | null>(null);

    const handleGenerate = async () => {
        if (!theme) {
            setError("Please enter a theme or keyword to generate a concept.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setConceptData(null);
        
        onPromptGenerated({ type: PromptType.AIConcept, prompt: theme });

        try {
            const ai = getGeminiClient();
            const contextPrefix = aiContext ? `The artist's persona is: "${aiContext}". The concept should align with this style. ` : '';
            const textRagSources = ragSources.filter(s => s.mimeType.startsWith('text/'));
            const ragContext = textRagSources.length > 0
                ? `USER-PROVIDED CONTEXT:\n---\n${textRagSources.map(s => `Source (${s.type}: ${s.name}):\n${s.content}`).join('\n---\n')}\n---\n\n`
                : '';

            const prompt = `${ragContext}${contextPrefix}Generate a creative concept for an audio-visual art piece based on the theme: "${theme}". Provide a new, evocative name for the concept, a short artistic description, a list of related keywords for social media, and three distinct visual prompts for an AI image generator. ${language === 'sr' ? 'The entire response, including all keys and values in the JSON schema, must be in Serbian.' : ''}`;
            
            const model = ai.getGenerativeModel({
                model: 'gemini-1.5-flash',
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            concept: { type: Type.STRING, description: "The evocative name of the new concept." },
                            description: { type: Type.STRING, description: "A one-paragraph artistic description of the concept." },
                            keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 5-7 relevant keywords." },
                            visualPrompts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Three detailed visual prompts for an AI image generator." }
                        },
                        required: ["concept", "description", "keywords", "visualPrompts"]
                    },
                },
            });

            const response = await model.generateContent(prompt);
            const jsonStr = response.response.text().trim();
            const parsedData = JSON.parse(jsonStr) as AIConceptResponse;
            setConceptData(parsedData);
            onContentGenerated('AI Concept', parsedData);

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

    const formatConceptForSave = (concept: AIConceptResponse): string => {
        let content = `Creative Concept: ${concept.concept}\n`;
        content += `=========================================\n\n`;
        content += `DESCRIPTION\n${concept.description}\n\n`;
        
        content += `KEYWORDS\n- ${concept.keywords.join('\n- ')}\n\n`;
        
        content += `VISUAL PROMPTS\n`;
        concept.visualPrompts.forEach((prompt, i) => {
            content += `${i + 1}. ${prompt}\n`;
        });
        
        return content;
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
                 <div>
                    <label htmlFor="concept-theme" className="font-bold text-gray-300">Enter a Theme or Keyword</label>
                    <input
                        id="concept-theme"
                        type="text"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder="e.g., Entropy, Symbiosis, Digital Ghost, Lucid Dreams..."
                        className="mt-2 w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                    />
                </div>
                 {error && <p className="text-sm text-red-400">{error}</p>}
                 <button
                    onClick={triggerGenerate}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <LightbulbIcon />
                    {isLoading ? 'Generating Concept...' : 'Generate AI Concept'}
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {conceptData && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 md:p-6 space-y-6 animate-fade-in">
                    <div className="text-center border-b border-gray-700 pb-4">
                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">{conceptData.concept}</h2>
                        <p className="text-gray-400 mt-2">{conceptData.description}</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-bold text-lg text-purple-300">Keywords</h3>
                             <div className="flex flex-wrap gap-2 mt-2">
                                {conceptData.keywords.map((keyword, i) => (
                                    <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-md">{keyword}</span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-purple-300">Visual Prompts</h3>
                            <div className="mt-2 space-y-3">
                                {conceptData.visualPrompts.map((prompt, i) => (
                                     <div key={i} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                        <p className="text-sm text-gray-300 font-mono">{prompt}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {user && (
                            <div className="pt-4 border-t border-gray-700">
                                <SaveToDriveButton
                                    user={user}
                                    content={formatConceptForSave(conceptData)}
                                    fileName={`concept_${conceptData.concept.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`}
                                    mimeType="text/plain"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};