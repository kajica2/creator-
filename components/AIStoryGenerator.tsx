import React, { useState, useEffect } from 'react';
import { Type } from '@google/genai';
import { AIStoryResponse, Hashtag, PromptType, RagSource, User, Page } from '../types';
import { SaveToDriveButton } from './SaveToDriveButton';
import { getGeminiClient } from '../utils/geminiClient';

interface AIStoryGeneratorProps {
    selectedHashtags: Hashtag[];
    onPromptGenerated: (prompt: { type: PromptType; prompt: string }) => void;
    language: 'en' | 'sr';
    aiContext: string;
    ragSources: RagSource[];
    user: User | null;
    onAttemptGeneration: (generationFn: () => Promise<void>) => void;
    onContentGenerated: (page: Page, content: any) => void;
}

const StoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm2 1a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const CopyIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM5 11a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z" />
    </svg>
);

const TweakIcons = {
    Flow: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" /></svg>,
    Shorten: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>,
    Emoji: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.293 5.707a1 1 0 01-1.414 0v-.001a3.003 3.003 0 00-4.573 0 1 1 0 01-1.414-1.414 5.003 5.003 0 017.4-0 1 1 0 010 1.414z" clipRule="evenodd" /></svg>,
    Poetic: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.5 2A1.5 1.5 0 002 3.5v13A1.5 1.5 0 003.5 18h13a1.5 1.5 0 001.5-1.5V6.528A1.5 1.5 0 0017 5.028V3.5A1.5 1.5 0 0015.5 2h-12zM3 3.5a.5.5 0 01.5-.5h12a.5.5 0 01.5.5v1.516a.5.5 0 01-.146.354l-1.5 1.5a.5.5 0 01-.708 0L13 6.172V16.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-13z" clipRule="evenodd" /></svg>,
    Technical: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
    Energetic: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
};


export const AIStoryGenerator: React.FC<AIStoryGeneratorProps> = ({ selectedHashtags, onPromptGenerated, language, aiContext, ragSources, user, onAttemptGeneration, onContentGenerated }) => {
    const [storyHashtags, setStoryHashtags] = useState<string[]>([]);
    const [newTagInput, setNewTagInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [storyData, setStoryData] = useState<AIStoryResponse | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        setStoryHashtags(selectedHashtags.map(h => h.name));
        setStoryData(null); // Reset story when selection changes
    }, [selectedHashtags]);

    const handleGenerate = async (tweakInstruction?: string) => {
        if (storyHashtags.length === 0) {
            setError("Please select some hashtags first from the 'Hashtags' or 'Sets' tab.");
            return;
        }
        setIsLoading(true);
        setError(null);

        const hashtagNames = storyHashtags.join(', ');
        const contextPrefix = aiContext ? `ARTIST CONTEXT: "${aiContext}". Use this to inform the tone and content. ` : '';
        const textRagSources = ragSources.filter(s => s.mimeType.startsWith('text/'));
        const ragContext = textRagSources.length > 0
            ? `USER-PROVIDED CONTEXT:\n---\n${textRagSources.map(s => `Source (${s.type}: ${s.name}):\n${s.content}`).join('\n---\n')}\n---\n\n`
            : '';

        if (!tweakInstruction) {
             onPromptGenerated({ type: PromptType.AIStory, prompt: `Hashtags: ${hashtagNames}` });
        }
        
        try {
            const ai = getGeminiClient();
            
            let prompt = `${ragContext}${contextPrefix}As a social media expert for an audio-visual artist, craft a compelling Instagram caption. The post showcases a new piece of work. Weave the following themes and keywords seamlessly into a narrative: ${hashtagNames}. The story should be engaging, provide context to the art, and encourage viewers to comment, share, or save the post. Keep it concise and impactful. ${language === 'sr' ? 'The entire response, including all keys and values in the JSON schema, must be in Serbian.' : ''}`;
            
            if (tweakInstruction && storyData) {
                prompt = `${ragContext}${contextPrefix}As a social media expert, refine the following Instagram caption: "${storyData.story}". The user wants to: "${tweakInstruction}". The core themes, based on hashtags, are: ${hashtagNames}. Generate a new, improved caption and a catchy title. ${language === 'sr' ? 'The entire response, including all keys and values in the JSON schema, must be in Serbian.' : ''}`;
            }

            const model = ai.getGenerativeModel({
                model: 'gemini-1.5-flash',
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "A catchy, short title for the Instagram post." },
                            story: { type: Type.STRING, description: "The full caption/story for the post, written in an engaging and artistic tone." }
                        },
                        required: ["title", "story"]
                    },
                },
            });

            const response = await model.generateContent(prompt);
            const jsonStr = response.response.text().trim();
            const parsedData = JSON.parse(jsonStr) as AIStoryResponse;
            setStoryData(parsedData);
            onContentGenerated('AI Story', parsedData);

        } catch (e) {
            console.error(e);
            setError(`An error occurred: ${(e as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const triggerGenerate = (tweak?: string) => {
        onAttemptGeneration(() => handleGenerate(tweak));
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setStoryHashtags(prev => prev.filter(tag => tag !== tagToRemove));
    };

    const handleAddTags = () => {
        if (!newTagInput.trim()) return;
        const newTags = newTagInput.split(',').map(t => t.trim().startsWith('#') ? t.trim() : `#${t.trim()}`).filter(Boolean);
        setStoryHashtags(prev => [...new Set([...prev, ...newTags])]);
        setNewTagInput('');
    };

    const handleCopy = () => {
        if (!storyData) return;
        const fullText = `${storyData.title}\n\n${storyData.story}`;
        navigator.clipboard.writeText(fullText);
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
                    <h3 className="font-bold text-gray-300">Hashtags for Your Story ({storyHashtags.length})</h3>
                    {storyHashtags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                             {storyHashtags.map(tag => (
                                <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-md">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 pt-2">Select hashtags from the 'Hashtags' or 'Sets' tab to create a story around them.</p>
                    )}
                </div>
                 {error && <p className="text-sm text-red-400">{error}</p>}
                 <button
                    onClick={() => triggerGenerate()}
                    disabled={isLoading || storyHashtags.length === 0}
                    className="w-full flex items-center justify-center text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <StoryIcon />
                    {isLoading ? 'Crafting Story...' : 'Generate AI Story'}
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {storyData && !isLoading && (
                <div className="space-y-4">
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 md:p-6 space-y-4 animate-fade-in">
                        <div className="flex justify-between items-start">
                            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">{storyData.title}</h2>
                            <button
                                onClick={handleCopy}
                                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-1.5 px-3 rounded-full transition-colors"
                            >
                                <CopyIcon />
                                <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                            </button>
                        </div>
                        <p className="text-gray-300 whitespace-pre-wrap">{storyData.story}</p>
                        {user && (
                            <div className="pt-4 border-t border-gray-700">
                                <SaveToDriveButton
                                    user={user}
                                    content={`${storyData.title}\n\n${storyData.story}`}
                                    fileName={`${storyData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`}
                                    mimeType="text/plain"
                                />
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4 animate-fade-in">
                        <h3 className="font-bold text-lg text-gray-300">Tweak & Regenerate</h3>
                        <div>
                            <label className="text-sm font-semibold text-gray-400">Edit Hashtags</label>
                            <div className="flex flex-wrap gap-1.5 pt-2">
                                {storyHashtags.map(tag => (
                                    <span key={tag} className="flex items-center text-xs bg-gray-700 text-gray-300 pl-2 pr-1 py-0.5 rounded-md">
                                        {tag}
                                        <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 text-gray-500 hover:text-white">&times;</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                                <input 
                                    type="text"
                                    value={newTagInput}
                                    onChange={(e) => setNewTagInput(e.target.value)}
                                    placeholder="Add tags, comma separated"
                                    className="flex-grow p-2 bg-gray-900 border border-gray-600 rounded-md text-sm focus:ring-1 focus:ring-purple-500 focus:outline-none"
                                />
                                <button onClick={handleAddTags} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-4 rounded-md text-sm">Add</button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-400">Refine Story</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                                <button onClick={() => triggerGenerate('Improve the narrative flow and transitions.')} className="flex items-center justify-center text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors">
                                    <TweakIcons.Flow /> Improve Flow
                                </button>
                                <button onClick={() => triggerGenerate('Condense the story to be more punchy and brief.')} className="flex items-center justify-center text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors">
                                    <TweakIcons.Shorten /> Make Shorter
                                </button>
                                <button onClick={() => triggerGenerate('Incorporate relevant and artistic emojis to enhance the message.')} className="flex items-center justify-center text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors">
                                    <TweakIcons.Emoji /> Add Emojis
                                </button>
                                <button onClick={() => triggerGenerate('Rewrite the caption with a more poetic, abstract, and evocative tone.')} className="flex items-center justify-center text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors">
                                    <TweakIcons.Poetic /> Make it Poetic
                                </button>
                                <button onClick={() => triggerGenerate('Revise the caption to focus on the technical process and tools used, making it more informative for a tech-savvy audience.')} className="flex items-center justify-center text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors">
                                    <TweakIcons.Technical /> More Technical
                                </button>
                                <button onClick={() => triggerGenerate('Inject more energy and excitement into the caption. Make it suitable for a high-energy club or festival atmosphere.')} className="flex items-center justify-center text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors">
                                    <TweakIcons.Energetic /> More Energetic
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};