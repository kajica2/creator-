import React, { useState } from 'react';
import { Type } from '@google/genai';
import { WebsiteStrategyResponse, PromptType, RagSource, User, Page } from '../types';
import { SaveToDriveButton } from './SaveToDriveButton';
import { getGeminiClient } from '../utils/geminiClient';

interface WebsiteStrategyGeneratorProps {
    onPromptGenerated: (prompt: { type: PromptType; prompt: string }) => void;
    language: 'en' | 'sr';
    aiContext: string;
    ragSources: RagSource[];
    user: User | null;
    onAttemptGeneration: (generationFn: () => Promise<void>) => void;
    onContentGenerated: (page: Page, content: any) => void;
}

const TargetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

export const WebsiteStrategyGenerator: React.FC<WebsiteStrategyGeneratorProps> = ({ onPromptGenerated, language, aiContext, ragSources, user, onAttemptGeneration, onContentGenerated }) => {
    const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
    const [artistDescription, setArtistDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [strategy, setStrategy] = useState<WebsiteStrategyResponse | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleTargetChange = (target: string) => {
        setSelectedTargets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(target)) {
                newSet.delete(target);
            } else {
                newSet.add(target);
            }
            return newSet;
        });
    };

    const handleGenerate = async () => {
        if (selectedTargets.size === 0 || !artistDescription) {
            setError("Please select at least one target audience and describe your work.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setStrategy(null);
        
        const historyPrompt = `Targets: ${Array.from(selectedTargets).join(', ')}\nDescription: ${artistDescription}`;
        onPromptGenerated({ type: PromptType.WebsiteStrategy, prompt: historyPrompt });

        try {
            const ai = getGeminiClient();
            const contextPrefix = aiContext ? `The artist's self-described persona is: "${aiContext}". This should heavily influence the strategy. ` : '';
            const textRagSources = ragSources.filter(s => s.mimeType.startsWith('text/'));
            const ragContext = textRagSources.length > 0
                ? `USER-PROVIDED CONTEXT:\n---\n${textRagSources.map(s => `Source (${s.type}: ${s.name}):\n${s.content}`).join('\n---\n')}\n---\n\n`
                : '';
            
            const prompt = `${ragContext}${contextPrefix}Generate a website strategy for an artist who creates: "${artistDescription}". The website needs to specifically target: ${Array.from(selectedTargets).join(', ')}. Focus on converting visitors from these groups into fans, clients, or collaborators. ${language === 'sr' ? 'The entire response, including all keys and values in the JSON schema, must be in Serbian.' : ''}`;
            
            const model = ai.getGenerativeModel({
                model: 'gemini-1.5-flash',
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            mainGoal: { type: Type.STRING, description: "The single, primary goal of the website." },
                            keySections: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING, description: "Name of a key website section (e.g., 'Homepage', 'Portfolio')." },
                                        contentIdeas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of content ideas for this section." }
                                    },
                                    required: ["name", "contentIdeas"]
                                }
                            },
                            toneAndStyle: { type: Type.STRING, description: "Description of the visual and textual tone." },
                            callToAction: {
                                type: Type.OBJECT,
                                properties: {
                                    text: { type: Type.STRING, description: "The main call-to-action button text." },
                                    description: { type: Type.STRING, description: "A brief explanation of the CTA's purpose." }
                                },
                                required: ["text", "description"]
                            },
                            targetAudienceEngagement: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        target: { type: Type.STRING, description: "The target audience." },
                                        strategy: { type: Type.STRING, description: "A specific strategy to engage this audience on the website." }
                                    },
                                    required: ["target", "strategy"]
                                }
                            }
                        },
                        required: ["mainGoal", "keySections", "toneAndStyle", "callToAction", "targetAudienceEngagement"]
                    },
                },
            });

            const response = await model.generateContent(prompt);
            const jsonStr = response.response.text().trim();
            const parsedStrategy = JSON.parse(jsonStr) as WebsiteStrategyResponse;
            setStrategy(parsedStrategy);
            onContentGenerated('AI Strategy', parsedStrategy);

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

    const formatStrategyForSave = (strategy: WebsiteStrategyResponse): string => {
        let content = `Website Strategy for: ${artistDescription}\n`;
        content += `=========================================\n\n`;
        content += `🎯 MAIN GOAL\n${strategy.mainGoal}\n\n`;
        content += `🎨 TONE & STYLE\n${strategy.toneAndStyle}\n\n`;
        content += `🚀 CALL TO ACTION\n[${strategy.callToAction.text}] - ${strategy.callToAction.description}\n\n`;
        
        content += `📑 KEY SECTIONS\n`;
        strategy.keySections.forEach(section => {
            content += `\n- ${section.name.toUpperCase()}\n`;
            section.contentIdeas.forEach(idea => {
                content += `  - ${idea}\n`;
            });
        });
        
        content += `\n💡 AUDIENCE ENGAGEMENT TACTICS\n`;
        strategy.targetAudienceEngagement.forEach(item => {
            content += `\n- FOR: ${item.target.toUpperCase()}\n`;
            content += `  - ${item.strategy}\n`;
        });
        
        return content;
      };
    
      const handleCopyStrategy = async () => {
        if (!strategy) return;
        
        try {
          const strategyText = formatStrategyForSave(strategy);
          await navigator.clipboard.writeText(strategyText);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
          console.error('Failed to copy strategy:', err);
        }
      };
    
    // FIX: Define the 'targets' array that was missing, causing a reference error.
    const targets = [
        'Art Collectors',
        'Galleries & Curators',
        'Event Organizers',
        'Music Labels',
        'Fellow Artists / Collaborators',
        'Students & Educators',
        'General Fans',
        'Brand Partnerships'
    ];
    
    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
                <div>
                    <label className="font-bold text-gray-300">1. Select Target Audiences</label>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {targets.map(target => (
                             <button key={target} onClick={() => handleTargetChange(target)}
                                className={`px-3 py-1.5 text-sm rounded-full transition-colors font-medium ${selectedTargets.has(target) ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                 {target}
                             </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <label htmlFor="artist-desc" className="font-bold text-gray-300">2. Describe Your Work</label>
                    <textarea
                        id="artist-desc"
                        value={artistDescription}
                        onChange={(e) => setArtistDescription(e.target.value)}
                        placeholder="e.g., immersive audio-visual installations using generative art and ambient electronic music..."
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
                    <TargetIcon />
                    {isLoading ? 'Generating Strategy...' : 'Generate AI Website Strategy'}
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {strategy && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 md:p-6 space-y-6 animate-fade-in">
                    <div className="text-center border-b border-gray-700 pb-4">
                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">Your AI-Generated Website Strategy</h2>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-bold text-lg text-purple-300">🎯 Main Goal</h3>
                            <p className="text-gray-300 mt-1">{strategy.mainGoal}</p>
                        </div>

                         <div>
                            <h3 className="font-bold text-lg text-purple-300">🎨 Tone & Style</h3>
                            <p className="text-gray-300 mt-1">{strategy.toneAndStyle}</p>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-purple-300">🚀 Call to Action</h3>
                             <p className="text-gray-300 mt-1"><span className="font-semibold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">{strategy.callToAction.text}</span> &mdash; {strategy.callToAction.description}</p>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-lg text-purple-300">📑 Key Sections</h3>
                            <div className="mt-2 space-y-3">
                                {strategy.keySections.map(section => (
                                    <div key={section.name} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                        <h4 className="font-semibold text-gray-200">{section.name}</h4>
                                        <ul className="list-disc list-inside text-sm text-gray-400 mt-1 pl-2 space-y-1">
                                            {section.contentIdeas.map((idea, i) => <li key={i}>{idea}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-purple-300">💡 Audience Engagement Tactics</h3>
                             <div className="mt-2 space-y-3">
                                {strategy.targetAudienceEngagement.map(item => (
                                     <div key={item.target} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                        <h4 className="font-semibold text-gray-200">{item.target}</h4>
                                        <p className="text-sm text-gray-400 mt-1">{item.strategy}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-700 flex gap-3">
                            <button
                                onClick={handleCopyStrategy}
                                disabled={copySuccess}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors disabled:bg-green-600 disabled:text-white"
                            >
                                {copySuccess ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                        </svg>
                                        Copy Strategy
                                    </>
                                )}
                            </button>
                            
                            {user && (
                                <SaveToDriveButton
                                    user={user}
                                    content={formatStrategyForSave(strategy)}
                                    fileName="website_strategy.txt"
                                    mimeType="text/plain"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};