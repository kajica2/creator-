import React, { useState } from 'react';
import { Type } from '@google/genai';
import { TensorMutationResponse, PromptType, RagSource, User, Page } from '../types';
import { SaveToDriveButton } from './SaveToDriveButton';
import { getGeminiClient } from '../utils/geminiClient';

interface TensorMutatorProps {
    onPromptGenerated: (prompt: { type: PromptType; prompt: string }) => void;
    language: 'en' | 'sr';
    aiContext: string;
    ragSources: RagSource[];
    user: User | null;
    onAttemptGeneration: (generationFn: () => Promise<void>) => void;
    onContentGenerated: (page: Page, content: any) => void;
}

const MutationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const DimensionIcons: { [key: string]: React.FC } = {
    'Visual Cortex': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
    'Sonic Spectrum': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>,
    'Temporal Echo': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    'Philosophical Core': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};


export const TensorMutator: React.FC<TensorMutatorProps> = ({ onPromptGenerated, language, aiContext, ragSources, user, onAttemptGeneration, onContentGenerated }) => {
    const [concept, setConcept] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mutationData, setMutationData] = useState<TensorMutationResponse | null>(null);

    const handleGenerate = async () => {
        if (!concept) {
            setError("Please enter a concept to mutate.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setMutationData(null);

        onPromptGenerated({ type: PromptType.TensorMutation, prompt: concept });

        try {
            const ai = getGeminiClient();
            const contextPrefix = aiContext ? `The artist's persona is: "${aiContext}". The mutation should reflect this style. ` : '';
            const textRagSources = ragSources.filter(s => s.mimeType.startsWith('text/'));
            const ragContext = textRagSources.length > 0
                ? `USER-PROVIDED CONTEXT:\n---\n${textRagSources.map(s => `Source (${s.type}: ${s.name}):\n${s.content}`).join('\n---\n')}\n---\n\n`
                : '';

            const prompt = `${ragContext}You are an AI muse for avant-garde audio-visual artists. Your task is to perform a 'Tensor Mutation' on a given concept. This means you take a simple idea and expand it into multiple creative dimensions. ${contextPrefix}For the concept "${concept}", generate a new 'mutatedConcept' title and then break it down into four dimensions: 'Visual Cortex' (visual ideas), 'Sonic Spectrum' (sound & music ideas), 'Temporal Echo' (ideas about time, interaction, duration), and 'Philosophical Core' (the deeper meaning or question). Provide 3-4 concrete ideas for each dimension. The response must be structured and creative. ${language === 'sr' ? 'The entire response, including all keys and values in the JSON schema, must be in Serbian. The dimension names (Visual Cortex, Sonic Spectrum, etc.) can be translated as well.' : ''}`;
            
            const model = ai.getGenerativeModel({
                model: 'gemini-1.5-flash',
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            initialConcept: { type: Type.STRING },
                            mutatedConcept: { type: Type.STRING },
                            dimensions: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        dimensionName: { type: Type.STRING },
                                        ideas: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    },
                                    required: ["dimensionName", "ideas"]
                                }
                            }
                        },
                        required: ["initialConcept", "mutatedConcept", "dimensions"]
                    },
                },
            });

            const response = await model.generateContent(prompt);
            const jsonStr = response.response.text().trim();
            const parsedData = JSON.parse(jsonStr) as TensorMutationResponse;
            setMutationData(parsedData);
            onContentGenerated('AI Mutator', parsedData);

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

    const formatMutationForSave = (mutation: TensorMutationResponse): string => {
        let content = `Tensor Mutation Report\n`;
        content += `========================\n\n`;
        content += `Initial Concept: ${mutation.initialConcept}\n`;
        content += `Mutated Concept: ${mutation.mutatedConcept}\n\n`;
        
        mutation.dimensions.forEach(dim => {
            content += `--- ${dim.dimensionName.toUpperCase()} ---\n`;
            dim.ideas.forEach(idea => {
                content += `- ${idea}\n`;
            });
            content += `\n`;
        });
        
        return content;
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
                 <div>
                    <label htmlFor="concept-input" className="font-bold text-gray-300">Enter a Concept to Mutate</label>
                    <input
                        id="concept-input"
                        type="text"
                        value={concept}
                        onChange={(e) => setConcept(e.target.value)}
                        placeholder="e.g., Ethereal, Glitch, Cosmic Echo, Sacred Geometry..."
                        className="mt-2 w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                    />
                </div>
                 {error && <p className="text-sm text-red-400">{error}</p>}
                 <button
                    onClick={triggerGenerate}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <MutationIcon />
                    {isLoading ? 'Mutating Concept...' : 'Mutate to Next Dimension'}
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {mutationData && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 md:p-6 space-y-6 animate-fade-in">
                    <div className="text-center border-b border-gray-700 pb-4">
                        <p className="text-sm text-gray-400">Concept: {mutationData.initialConcept}</p>
                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">{mutationData.mutatedConcept}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mutationData.dimensions.map((dim) => {
                             const Icon = DimensionIcons[dim.dimensionName] || DimensionIcons[Object.keys(DimensionIcons).find(k => dim.dimensionName.includes(k.split(' ')[0])) || ''] || (() => null);
                             return (
                                <div key={dim.dimensionName} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 space-y-2">
                                    <div className="flex items-center space-x-2 text-purple-300">
                                        <Icon />
                                        <h3 className="font-bold text-lg">{dim.dimensionName}</h3>
                                    </div>
                                    <ul className="list-disc list-inside text-sm text-gray-300 pl-2 space-y-1.5">
                                        {dim.ideas.map((idea, i) => <li key={i}>{idea}</li>)}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                    
                    {user && (
                        <div className="pt-4 border-t border-gray-700">
                            <SaveToDriveButton
                                user={user}
                                content={formatMutationForSave(mutationData)}
                                fileName={`mutation_${mutationData.initialConcept.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`}
                                mimeType="text/plain"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};