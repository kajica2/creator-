import React, { useState } from 'react';
import { PromptType, RagSource, User, Page } from '../types';
import { SaveToDriveButton } from './SaveToDriveButton';
import { getGeminiClient } from '../utils/geminiClient';

interface TextToImageGeneratorProps {
    onPromptGenerated: (prompt: { type: PromptType; prompt: string }) => void;
    language: 'en' | 'sr';
    aiContext: string;
    ragSources: RagSource[];
    user: User | null;
    onAttemptGeneration: (generationFn: () => Promise<void>) => void;
    onContentGenerated: (page: Page, content: any) => void;
}

type AspectRatio = "1:1" | "16:9" | "9:16";

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 001.414 1.414L5 6.414V10l-2.293 2.293a1 1 0 001.414 1.414L5 12.414V17a1 1 0 102 0v-4.586l1.293 1.293a1 1 0 001.414-1.414L8 11.414V10l2.293-2.293a1 1 0 00-1.414-1.414L8 7.586V3a1 1 0 10-2 0v4.586L4.707 6.293a1 1 0 00-1.414-1.414L5 3.586V3a1 1 0 00-1-1zm11 0a1 1 0 00-1 1v2.586l-1.293-1.293a1 1 0 00-1.414 1.414L13 6.414V10l-2.293 2.293a1 1 0 001.414 1.414L13 12.414V17a1 1 0 102 0v-4.586l1.293 1.293a1 1 0 001.414-1.414L16 11.414V10l2.293-2.293a1 1 0 00-1.414-1.414L16 7.586V3a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);


export const TextToImageGenerator: React.FC<TextToImageGeneratorProps> = ({ onPromptGenerated, language, aiContext, ragSources, user, onAttemptGeneration, onContentGenerated }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt) {
            setError('Please enter a prompt to generate an image.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setEnhancedPrompt(null);

        onPromptGenerated({ type: PromptType.TextToImage, prompt });

        try {
            const ai = getGeminiClient();
            const contextPrefix = aiContext ? `Style context: ${aiContext}. ` : '';
            const textRagSources = ragSources.filter(s => s.mimeType.startsWith('text/'));
            const ragContext = textRagSources.length > 0
                ? `REFERENCE CONTEXT:\n---\n${textRagSources.map(s => s.content).join('\n---\n')}\n---\n\n`
                : '';

            // Since Gemini doesn't generate images directly, we'll create an enhanced prompt for external image generators
            const enhancePrompt = `${ragContext}${contextPrefix}Enhance and expand the following image prompt for an AI image generator like DALL-E, Midjourney, or Stable Diffusion. Make it highly detailed, specific about style, lighting, composition, and artistic elements. Include technical photography terms and artistic styles that would create a stunning ${aspectRatio} aspect ratio image.

Original prompt: ${prompt}

Enhanced prompt:`;

            const model = ai.getGenerativeModel({
                model: 'gemini-1.5-flash'
            });

            const response = await model.generateContent(enhancePrompt);
            const enhancedPromptText = response.response.text().trim();
            setEnhancedPrompt(enhancedPromptText);

            // Create a placeholder image with the enhanced prompt
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas size based on aspect ratio
            let width = 512, height = 512;
            if (aspectRatio === '16:9') {
                width = 640;
                height = 360;
            } else if (aspectRatio === '9:16') {
                width = 360;
                height = 640;
            }

            canvas.width = width;
            canvas.height = height;

            if (ctx) {
                // Create gradient background
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#6366f1');
                gradient.addColorStop(1, '#ec4899');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);

                // Add text overlay
                ctx.fillStyle = 'white';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Enhanced Prompt Generated', width/2, height/2 - 20);
                ctx.font = '12px Arial';
                ctx.fillText('Use the enhanced prompt below', width/2, height/2 + 10);
                ctx.fillText('with your preferred AI image generator', width/2, height/2 + 30);
            }

            const imageUrl = canvas.toDataURL('image/jpeg');
            setGeneratedImage(imageUrl);
            onContentGenerated('Text-to-Image', {
                enhancedPrompt: enhancedPromptText,
                originalPrompt: prompt,
                aspectRatio,
                placeholderImage: imageUrl
            });

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
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
                <div>
                    <label htmlFor="t2i-prompt" className="font-bold text-gray-300">Describe the image you want to create</label>
                    <textarea
                        id="t2i-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A neon hologram of a cat driving a retro car at top speed, cinematic lighting, vaporwave aesthetic..."
                        className="mt-2 w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                        rows={3}
                    />
                </div>

                <div>
                    <label className="font-bold text-gray-300 block mb-2">Aspect Ratio</label>
                    <div className="flex items-center justify-start space-x-1 bg-gray-900 p-1 rounded-lg border border-gray-600 w-full md:w-auto">
                        {(["1:1", "16:9", "9:16"] as AspectRatio[]).map(ratio => (
                            <button
                                key={ratio}
                                onClick={() => setAspectRatio(ratio)}
                                className={`flex-1 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${aspectRatio === ratio ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                            >
                                {ratio}
                            </button>
                        ))}
                    </div>
                </div>
                
                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                    onClick={triggerGenerate}
                    disabled={isLoading || !prompt}
                    className="w-full flex items-center justify-center text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <SparklesIcon />
                    {isLoading ? 'Generating...' : 'Generate Image'}
                </button>
            </div>

            <div 
                className="bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-xl flex flex-col justify-center items-center text-center p-4 min-h-[300px] w-full max-w-lg mx-auto transition-all duration-300"
                style={{ aspectRatio: aspectRatio.replace(':', ' / ') }}
            >
                {isLoading && (
                    <div className="flex flex-col items-center justify-center z-10">
                        <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-2 text-sm text-gray-300">Generating your vision...</p>
                    </div>
                )}
                {!isLoading && generatedImage && (
                    <img src={generatedImage} alt="Generated by AI" className="w-full h-full object-contain rounded-lg animate-fade-in" />
                )}
                {!isLoading && !generatedImage && (
                    <div className="text-gray-500">
                        <SparklesIcon />
                        <p className="font-semibold mt-2">Your generated image will appear here</p>
                    </div>
                )}
            </div>
            {enhancedPrompt && !isLoading && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4 animate-fade-in">
                    <h3 className="text-lg font-bold text-purple-300">Enhanced Prompt for AI Image Generators</h3>
                    <p className="text-sm text-gray-400">Copy this enhanced prompt to use with DALL-E, Midjourney, Stable Diffusion, or other AI image generators:</p>
                    <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <p className="text-gray-300 text-sm font-mono whitespace-pre-wrap">{enhancedPrompt}</p>
                    </div>
                    <button
                        onClick={() => navigator.clipboard.writeText(enhancedPrompt)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                        Copy Enhanced Prompt
                    </button>
                </div>
            )}

            {user && enhancedPrompt && !isLoading && (
                 <div className="max-w-lg mx-auto">
                     <SaveToDriveButton
                        user={user}
                        content={`Original Prompt: ${prompt}\n\nEnhanced Prompt:\n${enhancedPrompt}`}
                        fileName={`enhanced_prompt_${prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`}
                        mimeType="text/plain"
                     />
                 </div>
            )}
        </div>
    );
};