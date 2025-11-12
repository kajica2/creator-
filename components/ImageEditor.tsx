import React, { useState } from 'react';
import { Modality } from '@google/genai';
import { PromptType, RagSource, User, Page } from '../types';
import { SaveToDriveButton } from './SaveToDriveButton';
import { getGeminiClient } from '../utils/geminiClient';
import { imageProcessing, ImageUtils } from '../src/shared/image/ImageProcessingLibrary';

interface ImageEditorProps {
    onPromptGenerated: (prompt: { type: PromptType; prompt: string }) => void;
    aiContext: string;
    ragSources: RagSource[];
    user: User | null;
    onAttemptGeneration: (generationFn: () => Promise<void>) => void;
    onContentGenerated: (page: Page, content: any) => void;
}

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


export const ImageEditor: React.FC<ImageEditorProps> = ({ onPromptGenerated, aiContext, ragSources, user, onAttemptGeneration, onContentGenerated }) => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setOriginalImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setOriginalImage(reader.result as string);
                setEditedImage(null);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!originalImageFile || !prompt) {
            setError('Please upload an image and enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setEditedImage(null);

        onPromptGenerated({ type: PromptType.ImageEdit, prompt });

        try {
            const ai = getGeminiClient();
            const imagePart = await fileToGenerativePart(originalImageFile);
            
            const contextPrefix = aiContext ? `The artist's style is: "${aiContext}". Apply this style to the edit. ` : '';
            const textRagSources = ragSources.filter(s => s.mimeType.startsWith('text/'));
            const ragContext = textRagSources.length > 0
                ? `USER-PROVIDED CONTEXT FOR THE EDIT:\n---\n${textRagSources.map(s => `Source (${s.type}: ${s.name}):\n${s.content}`).join('\n---\n')}\n---\n\n`
                : '';

            const fullPrompt = `${ragContext}${contextPrefix}${prompt}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        imagePart,
                        { text: fullPrompt },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            const firstPart = response.candidates?.[0]?.content?.parts?.[0];
            if (firstPart && firstPart.inlineData) {
                const base64ImageBytes = firstPart.inlineData.data;
                const mimeType = firstPart.inlineData.mimeType;
                const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
                setEditedImage(imageUrl);
                onContentGenerated('Image Edit', imageUrl);
            } else {
                setError('Could not generate image. The model returned an empty response.');
            }

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
            {!originalImage && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                    <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center space-y-2 text-gray-400 hover:text-white transition-colors">
                            <UploadIcon />
                            <p className="font-semibold">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500">PNG, JPG, or WEBP</p>
                        </div>
                    </label>
                    <input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                 {originalImage && (
                     <div className="space-y-2">
                        <h3 className="font-bold text-gray-300 text-center">Original</h3>
                        <img src={originalImage} alt="Original" className="w-full h-auto rounded-xl object-contain" />
                     </div>
                 )}
                 {originalImage && (
                     <div className="space-y-2">
                         <h3 className="font-bold text-gray-300 text-center">Edited</h3>
                         <div className="w-full aspect-square rounded-xl bg-gray-800/50 flex items-center justify-center relative overflow-hidden">
                             {isLoading && (
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
                                    <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="mt-2 text-sm">Generating...</p>
                                </div>
                             )}
                             {editedImage ? (
                                <img src={editedImage} alt="Edited" className="w-full h-full object-contain" />
                             ) : !isLoading && (
                                <p className="text-gray-500 text-sm px-4 text-center">Your edited image will appear here.</p>
                             )}
                         </div>
                         {user && editedImage && !isLoading && (
                            <div className="mt-2">
                                <SaveToDriveButton
                                    user={user}
                                    content={editedImage}
                                    fileName={`edited_${prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`}
                                    mimeType="image/png"
                                />
                            </div>
                        )}
                     </div>
                 )}
            </div>
            
            {originalImage && (
                <div className="space-y-3">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the edit, e.g., 'Add a retro cinematic filter' or 'Remove the person in the background'"
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                        rows={3}
                        aria-label="Image editing prompt"
                    />
                     {error && <p className="text-sm text-red-400">{error}</p>}
                    <div className="flex gap-2">
                        <label htmlFor="image-upload-replace" className="w-1/3 cursor-pointer text-sm text-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                            Change Image
                        </label>
                         <input id="image-upload-replace" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
                        <button
                            onClick={triggerGenerate}
                            disabled={isLoading || !prompt}
                            className="w-2/3 flex items-center justify-center text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            <SparklesIcon />
                            {isLoading ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};