import React, { useState, useRef } from 'react';
import { PromptType, RagSource, User, Page } from '../types';
import { SaveToDriveButton } from './SaveToDriveButton';
import { getGeminiClient } from '../utils/geminiClient';

interface AudioTranscriberProps {
    onPromptGenerated: (prompt: { type: PromptType; prompt: string }) => void;
    language: 'en' | 'sr';
    aiContext: string;
    ragSources: RagSource[];
    user: User | null;
    onAttemptGeneration: (generationFn: () => Promise<void>) => void;
    onContentGenerated: (page: Page, content: any) => void;
}

const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" />
    </svg>
);

const StopIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);


const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // remove the header from the data URL
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const AudioTranscriber: React.FC<AudioTranscriberProps> = ({ onPromptGenerated, language, aiContext, ragSources, user, onAttemptGeneration, onContentGenerated }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        setError(null);
        setTranscript(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                audioChunksRef.current = [];
                stream.getTracks().forEach(track => track.stop()); // Stop the microphone access
                await handleTranscription(audioBlob);
            };
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone. Please check your browser permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsLoading(true);
        }
    };

    const handleTranscription = async (audioBlob: Blob) => {
        onAttemptGeneration(async () => {
            try {
                const base64Audio = await blobToBase64(audioBlob);
                const ai = getGeminiClient();

                const prompt = `Transcribe the following audio. ${language === 'sr' ? 'The transcription should be in Serbian.' : ''}`;
                
                onPromptGenerated({ type: PromptType.AudioTranscriber, prompt: `[Audio input of ${(audioBlob.size / 1024).toFixed(2)} KB]` });
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: 'audio/webm',
                                data: base64Audio,
                            },
                        },
                    ],
                });
                
                const transcriptText = response.text;
                setTranscript(transcriptText);
                onContentGenerated('Audio Transcriber', transcriptText);

            } catch (e) {
                console.error(e);
                setError(`An error occurred during transcription: ${(e as Error).message}`);
            } finally {
                setIsLoading(false);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                 <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">Audio Transcriber</h2>
                <p className="text-gray-400 mt-2 max-w-2xl mx-auto">Record your voice to capture ideas, notes, or draft content. Powered by Gemini 2.5 Flash.</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4 text-center">
                <div className="flex justify-center items-center h-20">
                    {isRecording && (
                        <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-red-400 font-semibold">Recording...</span>
                        </div>
                    )}
                     {isLoading && !isRecording && (
                        <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-purple-300 font-semibold">Transcribing...</span>
                        </div>
                     )}
                </div>

                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        disabled={isLoading}
                        className="w-full max-w-xs mx-auto flex items-center justify-center text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        <MicIcon />
                        Start Recording
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        className="w-full max-w-xs mx-auto flex items-center justify-center text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                    >
                        <StopIcon />
                        Stop Recording
                    </button>
                )}
                 {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
            </div>

            {transcript && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 md:p-6 space-y-4 animate-fade-in">
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">Transcript</h2>
                    <p className="text-gray-300 whitespace-pre-wrap text-base leading-relaxed">{transcript}</p>
                     {user && (
                        <div className="pt-4 border-t border-gray-700">
                            <SaveToDriveButton
                                user={user}
                                content={transcript}
                                fileName={`transcript_${new Date().toISOString()}.txt`}
                                mimeType="text/plain"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};