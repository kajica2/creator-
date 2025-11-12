import React, { useState } from 'react';
import { PromptType, RagSource, User, Page } from '../types';
import { SaveToDriveButton } from './SaveToDriveButton';
import { getGeminiClient } from '../utils/geminiClient';
import { imageProcessing, ImageUtils } from '../src/shared/image/ImageProcessingLibrary';
import { aiUtilities } from '../src/shared/ai/AIUtilitiesLibrary';

interface BatchImageGeneratorProps {
    onPromptGenerated: (prompt: { type: PromptType; prompt: string }) => void;
    language: 'en' | 'sr';
    aiContext: string;
    ragSources: RagSource[];
    user: User | null;
    onAttemptGeneration: (generationFn: () => Promise<void>, count: number) => void;
    onContentGenerated: (page: Page, content: any) => void;
}

type AspectRatio = "1:1" | "16:9" | "9:16";
type Result = {
    prompt: string;
    image: string | null;
    error?: string;
};

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 001.414 1.414L5 6.414V10l-2.293 2.293a1 1 0 001.414 1.414L5 12.414V17a1 1 0 102 0v-4.586l1.293 1.293a1 1 0 001.414-1.414L8 11.414V10l2.293-2.293a1 1 0 00-1.414-1.414L8 7.586V3a1 1 0 10-2 0v4.586L4.707 6.293a1 1 0 00-1.414-1.414L5 3.586V3a1 1 0 00-1-1zm11 0a1 1 0 00-1 1v2.586l-1.293-1.293a1 1 0 00-1.414 1.414L13 6.414V10l-2.293 2.293a1 1 0 001.414 1.414L13 12.414V17a1 1 0 102 0v-4.586l1.293 1.293a1 1 0 001.414-1.414L16 11.414V10l2.293-2.293a1 1 0 00-1.414-1.414L16 7.586V3a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

export const BatchImageGenerator: React.FC<BatchImageGeneratorProps> = ({ onPromptGenerated, language, aiContext, ragSources, user, onAttemptGeneration, onContentGenerated }) => {
    const [prompts, setPrompts] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<Result[]>([]);
    const [progressMessage, setProgressMessage] = useState('');

    const handleGenerate = async () => {
        const promptList = prompts.trim().split('\n').filter(p => p.trim() !== '');
        if (promptList.length === 0) {
            setError('Please enter at least one prompt.');
            return;
        }

        const generationFn = async () => {
            setIsLoading(true);
            setError(null);
            setResults([]);
            setProgressMessage(`Starting batch of ${promptList.length} images...`);

            promptList.forEach(p => onPromptGenerated({ type: PromptType.BatchImages, prompt: p }));

            try {
                const ai = getGeminiClient();
                const contextPrefix = aiContext ? `Style context: ${aiContext}. ` : '';
                const textRagSources = ragSources.filter(s => s.mimeType.startsWith('text/'));
                const ragContext = textRagSources.length > 0
                    ? `REFERENCE CONTEXT:\n---\n${textRagSources.map(s => s.content).join('\n---\n')}\n---\n\nPROMPT: `
                    : 'PROMPT: ';

                const imagePromises = promptList.map((prompt, index) => {
                    setProgressMessage(`Generating image ${index + 1} of ${promptList.length}...`);
                    const fullPrompt = `${ragContext}${contextPrefix}${prompt}`;
                    return ai.models.generateImages({
                        model: 'imagen-4.0-generate-001',
                        prompt: fullPrompt,
                        config: {
                            numberOfImages: 1,
                            outputMimeType: 'image/jpeg',
                            aspectRatio: aspectRatio,
                        },
                    }).then(response => ({
                        prompt,
                        image: `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`,
                    })).catch(e => ({
                        prompt,
                        image: null,
                        error: `Failed: ${(e as Error).message}`
                    }));
                });

                const settledResults = await Promise.all(imagePromises);
                setResults(settledResults);
                onContentGenerated('Batch Images', settledResults);

            } catch (e) {
                console.error(e);
                setError(`A critical error occurred during the batch generation: ${(e as Error).message}`);
            } finally {
                setIsLoading(false);
                setProgressMessage('');
            }
        };
        
        onAttemptGeneration(generationFn, promptList.length);
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
                <div>
                    <label htmlFor="batch-prompts" className="font-bold text-gray-300">Enter your image prompts (one per line)</label>
                    <textarea
                        id="batch-prompts"
                        value={prompts}
                        onChange={(e) => setPrompts(e.target.value)}
                        placeholder="A neon hologram of a cat driving a retro car...\nA serene alien landscape with two suns...\nAbstract geometric patterns in gold and marble..."
                        className="mt-2 w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow font-mono"
                        rows={6}
                    />
                </div>

                <div>
                    <label className="font-bold text-gray-300 block mb-2">Aspect Ratio for All Images</label>
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
                    onClick={handleGenerate}
                    disabled={isLoading || !prompts.trim()}
                    className="w-full flex items-center justify-center text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <SparklesIcon />
                    {isLoading ? progressMessage : `Generate Batch (${prompts.trim().split('\n').filter(p => p.trim() !== '').length} images)`}
                </button>
            </div>

            {isLoading && results.length === 0 && (
                <div className="flex justify-center items-center p-8">
                    <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="ml-4">{progressMessage}</p>
                </div>
            )}

            {results.length > 0 && (
                <div className="space-y-4">
                     <h3 className="text-xl font-bold text-gray-200">Generated Images</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((result, index) => (
                            <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 space-y-3 flex flex-col">
                                <p className="text-xs text-gray-400 font-mono flex-shrink-0"><strong>Prompt:</strong> {result.prompt}</p>
                                <div 
                                    className="bg-gray-900/50 rounded-lg flex-grow flex items-center justify-center"
                                    style={{ aspectRatio: aspectRatio.replace(':', ' / ') }}
                                >
                                    {result.image ? (
                                        <img src={result.image} alt={result.prompt} className="w-full h-full object-contain rounded-md" />
                                    ) : (
                                        <div className="text-center text-red-400 p-2">
                                            <p className="font-semibold">Generation Failed</p>
                                            <p className="text-xs">{result.error}</p>
                                        </div>
                                    )}
                                </div>
                                {user && result.image && (
                                    <div className="flex-shrink-0">
                                        <SaveToDriveButton
                                            user={user}
                                            content={result.image}
                                            fileName={`batch_${result.prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`}
                                            mimeType="image/jpeg"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};