import React, { useState } from 'react';
import { Type } from '@google/genai';
import { AISkillResponse, PromptType, RagSource, User, Page } from '../types';
import { SaveToDriveButton } from './SaveToDriveButton';
import { getGeminiClient } from '../utils/geminiClient';

interface AISkillGeneratorProps {
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

export const AISkillGenerator: React.FC<AISkillGeneratorProps> = ({ onPromptGenerated, language, aiContext, ragSources, user, onAttemptGeneration, onContentGenerated }) => {
    const [skillTopic, setSkillTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [skillData, setSkillData] = useState<AISkillResponse | null>(null);

    const handleGenerate = async () => {
        if (!skillTopic) {
            setError("Please enter a skill or topic to learn about.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSkillData(null);

        onPromptGenerated({ type: PromptType.AISkill, prompt: skillTopic });

        try {
            const ai = getGeminiClient();
            const contextPrefix = aiContext ? `The learning guide should be structured for an audio-visual artist with the following persona: "${aiContext}". ` : 'The guide should be structured for an audio-visual artist. ';
            const textRagSources = ragSources.filter(s => s.mimeType.startsWith('text/'));
            const ragContext = textRagSources.length > 0
                ? `USER-PROVIDED CONTEXT:\n---\n${textRagSources.map(s => `Source (${s.type}: ${s.name}):\n${s.content}`).join('\n---\n')}\n---\n\n`
                : '';
            
            const prompt = `${ragContext}${contextPrefix}Generate a comprehensive learning guide for the following skill: "${skillTopic}". ${language === 'sr' ? 'The entire response, including all keys and values in the JSON schema, must be in Serbian.' : ''}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            skillName: { type: Type.STRING, description: "The official name of the skill." },
                            description: { type: Type.STRING, description: "A concise, one-paragraph overview of the skill." },
                            coreConcepts: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "A list of 3-5 fundamental concepts or terminologies."
                            },
                            learningPath: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        step: { type: Type.STRING, description: "The title of the learning step (e.g., '1. Master the Basics')." },
                                        description: { type: Type.STRING, description: "A brief explanation of what to do in this step." }
                                    },
                                    required: ["step", "description"]
                                }
                            },
                            projectIdeas: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "A list of 3 practical project ideas to apply the skill."
                            }
                        },
                        required: ["skillName", "description", "coreConcepts", "learningPath", "projectIdeas"]
                    },
                },
            });

            const jsonStr = response.text.trim();
            const parsedData = JSON.parse(jsonStr) as AISkillResponse;
            setSkillData(parsedData);
            onContentGenerated('AI Skill', parsedData);

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

    const formatSkillDataForSave = (skill: AISkillResponse): string => {
        let content = `Learning Guide: ${skill.skillName}\n`;
        content += `=========================================\n\n`;
        content += `${skill.description}\n\n`;
        
        content += `🧠 CORE CONCEPTS\n`;
        skill.coreConcepts.forEach(concept => {
            content += `- ${concept}\n`;
        });
        
        content += `\n🗺️ LEARNING PATH\n`;
        skill.learningPath.forEach(item => {
            content += `\n- ${item.step}\n`;
            content += `  - ${item.description}\n`;
        });
        
        content += `\n💡 PROJECT IDEAS\n`;
        skill.projectIdeas.forEach(idea => {
            content += `- ${idea}\n`;
        });
        
        return content;
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
                 <div>
                    <label htmlFor="skill-topic" className="font-bold text-gray-300">Enter a Skill or Technology</label>
                    <textarea
                        id="skill-topic"
                        value={skillTopic}
                        onChange={(e) => setSkillTopic(e.target.value)}
                        placeholder="e.g., Creative Coding with Three.js, Projection Mapping Basics, Live VJing..."
                        className="mt-2 w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                        rows={2}
                    />
                </div>
                 {error && <p className="text-sm text-red-400">{error}</p>}
                 <button
                    onClick={triggerGenerate}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <BrainIcon />
                    {isLoading ? 'Generating Guide...' : 'Generate AI Learning Guide'}
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {skillData && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 md:p-6 space-y-6 animate-fade-in">
                    <div className="text-center border-b border-gray-700 pb-4">
                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">{skillData.skillName}</h2>
                        <p className="text-gray-400 mt-2">{skillData.description}</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-bold text-lg text-purple-300">🧠 Core Concepts</h3>
                             <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {skillData.coreConcepts.map((concept, i) => (
                                    <div key={i} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 text-sm text-gray-300">{concept}</div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-purple-300">🗺️ Learning Path</h3>
                            <div className="mt-2 space-y-3">
                                {skillData.learningPath.map((item, i) => (
                                    <div key={i} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                        <h4 className="font-semibold text-gray-200">{item.step}</h4>
                                        <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-purple-300">💡 Project Ideas</h3>
                             <ul className="list-disc list-inside text-sm text-gray-300 mt-2 pl-2 space-y-1">
                                {skillData.projectIdeas.map((idea, i) => <li key={i}>{idea}</li>)}
                            </ul>
                        </div>

                        {user && (
                            <div className="pt-4 border-t border-gray-700">
                                <SaveToDriveButton
                                    user={user}
                                    content={formatSkillDataForSave(skillData)}
                                    fileName={`learning_guide_${skillData.skillName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`}
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