import React, { useState } from 'react';
import { Type } from '@google/genai';
import { AIWebsiteResponse, PromptType, RagSource, User, GeneratedContentStore, Page } from '../types';
import { SaveToDriveButton } from './SaveToDriveButton';
import { downloadWebsiteAsZip } from '../utils/zipDownload';
import { getGeminiClient } from '../utils/geminiClient';
import { aiUtilities, AIPromptTemplates } from '../src/shared/ai/AIUtilitiesLibrary';
import { platformOptimization } from '../src/shared/platform/PlatformOptimizationLibrary';

interface AIWebsiteGeneratorProps {
    onPromptGenerated: (prompt: { type: PromptType; prompt: string }) => void;
    language: 'en' | 'sr';
    aiContext: string;
    ragSources: RagSource[];
    user: User | null;
    onAttemptGeneration: (generationFn: () => Promise<void>) => void;
    generatedContent: GeneratedContentStore;
}

const WebIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9m-9 9a9 9 0 00-9-9" />
    </svg>
);

const DeployIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const GoogleSitesIcon = () => (
    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.82 8.33H18.5V18.5H15.82V8.33Z" fill="#4285F4"/>
        <path d="M5.5 5.5H13.17V18.5H5.5V5.5Z" fill="#1A73E8"/>
        <path d="M10.42 13.17V15.84H5.5V13.17H10.42Z" fill="#FFFFFF"/>
    </svg>
);


const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM5 11a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z" />
    </svg>
);

const VercelIcon = () => (
    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 116 101" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M57.5 0L115 100H0L57.5 0z"/></svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


// Mock deployment function
const mockDeploy = (htmlContent: string): Promise<string> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const randomSubdomain = Math.random().toString(36).substring(2, 10);
            resolve(`https://${randomSubdomain}.cloud-sites.app`);
        }, 2500);
    });
};

const mockDeployVercel = (htmlContent: string): Promise<string> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const randomSubdomain = Math.random().toString(36).substring(2, 10);
            resolve(`https://av-artist-${randomSubdomain}.vercel.app`);
        }, 3000);
    });
};


export const AIWebsiteGenerator: React.FC<AIWebsiteGeneratorProps> = ({ onPromptGenerated, language, aiContext, ragSources, user, onAttemptGeneration, generatedContent }) => {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [websiteData, setWebsiteData] = useState<AIWebsiteResponse | null>(null);
    const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
    const [isUrlCopied, setIsUrlCopied] = useState(false);
    const [isHtmlCopied, setIsHtmlCopied] = useState(false);
    const [isGoogleSitesModalOpen, setIsGoogleSitesModalOpen] = useState(false);
    const [isDeployingVercel, setIsDeployingVercel] = useState(false);
    const [vercelDeployedUrl, setVercelDeployedUrl] = useState<string | null>(null);
    const [isVercelUrlCopied, setIsVercelUrlCopied] = useState(false);
    const [isDownloadingZip, setIsDownloadingZip] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);


    const handleGenerate = async () => {
        if (!topic) {
            setError("Please enter a theme for your website.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setWebsiteData(null);
        setDeployedUrl(null);
        setVercelDeployedUrl(null);
        
        onPromptGenerated({ type: PromptType.AIWebsite, prompt: topic });

        try {
            // 1. Clean up the generated content for the prompt
            const cleanGeneratedContent = Object.entries(generatedContent).reduce((acc, [key, value]) => {
                if (value && (!Array.isArray(value) || value.length > 0)) {
                    acc[key as Page] = value;
                }
                return acc;
            }, {} as GeneratedContentStore);

            const ai = getGeminiClient();
            const contextPrefix = aiContext ? `The artist's persona/context is: "${aiContext}". This should be reflected in all the text content. ` : '';
            const textRagSources = ragSources.filter(s => s.mimeType.startsWith('text/'));
            const ragContext = textRagSources.length > 0
                ? `USER-PROVIDED CONTEXT FOR WEBSITE CONTENT:\n---\n${textRagSources.map(s => `Source (${s.type}: ${s.name}):\n${s.content}`).join('\n---\n')}\n---\n\n`
                : '';
            
            const prompt = `${ragContext}
You are an expert web developer specializing in websites for avant-garde audio-visual artists. Generate the complete HTML for a single-page portfolio website. It must be fully self-contained and use Tailwind CSS via a CDN link in the head. Use dark mode aesthetics with a modern, minimalist, futuristic feel.
${contextPrefix}

The website's theme is: "${topic}".

Most importantly, you MUST use the following content that the artist has already generated. Integrate it naturally into the website. If there are images, create a gallery. If there is text (stories, lyrics, concepts), create sections for them.

Here is the artist's generated content in JSON format:
${Object.keys(cleanGeneratedContent).length > 0 ? JSON.stringify(cleanGeneratedContent, null, 2) : "No content provided. Please create a portfolio with placeholder sections for a gallery and about me."}

Based on the provided content and theme, generate the complete HTML.
- For any images (found in 'Text-to-Image', 'Image Edit', or 'Batch Images'), use the provided data URLs directly in the \`src\` attribute of \`<img>\` tags. Make the gallery look good.
- For text content, format it readably within appropriate sections (e.g., 'Writings', 'Concepts').
- Create a simple navigation bar that links to the sections you create (e.g., Home, Gallery, Writings, About, Contact).
- If no content is provided for a certain type (e.g., no images), do not create a section for it.

The entire response must be a single JSON object with one key: "htmlContent", where the value is the complete HTML code as a string, starting with <!DOCTYPE html>.
${language === 'sr' ? 'The entire website content (text) must be in Serbian, but use the provided generated content as is.' : ''}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            htmlContent: { type: Type.STRING, description: "The full HTML content of the website." }
                        },
                        required: ["htmlContent"]
                    },
                },
            });

            const { htmlContent } = JSON.parse(response.text.trim()) as AIWebsiteResponse;
            setWebsiteData({ htmlContent });

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

    const handleDeploy = async () => {
        if (!websiteData) return;
        setIsDeploying(true);
        setError(null);

        try {
            const url = await mockDeploy(websiteData.htmlContent);
            setDeployedUrl(url);
        } catch (e) {
            setError(`Deployment failed: ${(e as Error).message}`);
        } finally {
            setIsDeploying(false);
        }
    };
    
    const handleVercelDeploy = async () => {
        if (!websiteData) return;
        setIsDeployingVercel(true);
        setError(null);

        try {
            const url = await mockDeployVercel(websiteData.htmlContent);
            setVercelDeployedUrl(url);
        } catch (e) {
            setError(`Vercel deployment failed: ${(e as Error).message}`);
        } finally {
            setIsDeployingVercel(false);
        }
    };

    const handleCopyUrl = () => {
        if (!deployedUrl) return;
        navigator.clipboard.writeText(deployedUrl);
        setIsUrlCopied(true);
        setTimeout(() => setIsUrlCopied(false), 2000);
    };
    
    const handleCopyVercelUrl = () => {
        if (!vercelDeployedUrl) return;
        navigator.clipboard.writeText(vercelDeployedUrl);
        setIsVercelUrlCopied(true);
        setTimeout(() => setIsVercelUrlCopied(false), 2000);
    };

    const handleCopyHtml = () => {
        if (!websiteData) return;
        navigator.clipboard.writeText(websiteData.htmlContent);
        setIsHtmlCopied(true);
        setTimeout(() => setIsHtmlCopied(false), 2000);
    };

    const handleDownloadZip = async () => {
        if (!websiteData || !topic) return;
        
        setIsDownloadingZip(true);
        setDownloadProgress(0);
        
        try {
            await downloadWebsiteAsZip(
                websiteData.htmlContent,
                topic,
                (progress) => setDownloadProgress(progress)
            );
        } catch (error) {
            console.error('Failed to download ZIP:', error);
            setError('Failed to create download. Please try again.');
        } finally {
            setIsDownloadingZip(false);
            setDownloadProgress(0);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
                 <div>
                    <label htmlFor="website-topic" className="font-bold text-gray-300">Enter a Theme for Your Website</label>
                    <input
                        id="website-topic"
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., Digital Ghosts, Echoes of Light, Urban Glitch..."
                        className="mt-2 w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                    />
                </div>
                 {error && <p className="text-sm text-red-400">{error}</p>}
                 <button
                    onClick={triggerGenerate}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <WebIcon />
                    {isLoading ? 'Generating Website...' : 'Generate AI Website'}
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                     <p className="ml-4">Building your vision...</p>
                </div>
            )}

            {websiteData && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                        <h3 className="text-lg font-bold text-purple-300 mb-2">Live Preview</h3>
                        <div className="w-full h-[500px] bg-gray-900 rounded-lg border border-gray-600 overflow-hidden">
                            <iframe 
                                srcDoc={websiteData.htmlContent}
                                title="Website Preview"
                                className="w-full h-full"
                                sandbox="allow-scripts allow-same-origin"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
                         <h3 className="text-lg font-bold text-purple-300">Save & Deploy</h3>
                         <div className="space-y-2">
                             <SaveToDriveButton
                                user={user}
                                content={websiteData.htmlContent}
                                fileName={`${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_portfolio.html`}
                                mimeType="text/html"
                            />
                             
                             {/* Download ZIP Button */}
                             <button
                                onClick={handleDownloadZip}
                                disabled={isDownloadingZip}
                                className="w-full flex items-center justify-center text-sm bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <DownloadIcon />
                                {isDownloadingZip ? `Downloading... ${downloadProgress}%` : 'Download as ZIP'}
                            </button>
                             
                             <button
                                onClick={() => setIsGoogleSitesModalOpen(true)}
                                className="w-full flex items-center justify-center text-sm bg-blue-600/80 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
                            >
                                <GoogleSitesIcon />
                                Deploy to Google Sites
                            </button>
                            
                            <button
                                onClick={handleVercelDeploy}
                                disabled={isDeployingVercel}
                                className="w-full flex items-center justify-center text-sm bg-white hover:bg-gray-200 text-black font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <VercelIcon />
                                {isDeployingVercel ? 'Deploying to Vercel...' : 'Deploy to Vercel'}
                            </button>

                            {vercelDeployedUrl && (
                                <div className="space-y-3 pt-2">
                                    <p className="text-green-400 text-sm">✅ Vercel deployment successful!</p>
                                    <div className="flex items-center space-x-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                                        <a href={vercelDeployedUrl} target="_blank" rel="noopener noreferrer" className="flex-grow text-purple-400 hover:underline truncate">{vercelDeployedUrl}</a>
                                        <button onClick={handleCopyVercelUrl} className="flex-shrink-0 flex items-center space-x-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-1 px-2.5 rounded-full transition-colors">
                                            <CopyIcon />
                                            <span>{isVercelUrlCopied ? 'Copied!' : 'Copy'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {deployedUrl ? (
                                <div className="space-y-3 pt-2">
                                    <p className="text-green-400 text-sm">✅ Quick cloud preview is live!</p>
                                    <div className="flex items-center space-x-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                                        <a href={deployedUrl} target="_blank" rel="noopener noreferrer" className="flex-grow text-purple-400 hover:underline truncate">{deployedUrl}</a>
                                        <button onClick={handleCopyUrl} className="flex-shrink-0 flex items-center space-x-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-1 px-2.5 rounded-full transition-colors">
                                            <CopyIcon />
                                            <span>{isUrlCopied ? 'Copied!' : 'Copy'}</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleDeploy}
                                    disabled={isDeploying}
                                    className="w-full flex items-center justify-center text-sm bg-green-600/80 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <DeployIcon />
                                    {isDeploying ? 'Deploying Preview...' : 'Quick Cloud Preview'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {isGoogleSitesModalOpen && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsGoogleSitesModalOpen(false)}>
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 transform animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Deploy to Google Sites</h2>
                            <p className="text-sm text-gray-400 mt-1">Follow these steps to publish your site for free.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="font-semibold text-gray-300">Step 1: Copy your website code</label>
                                <button onClick={handleCopyHtml} className="w-full text-sm bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                    {isHtmlCopied ? 'Copied to Clipboard!' : 'Copy HTML Code'}
                                </button>
                            </div>
                             <div className="space-y-2">
                                <label className="font-semibold text-gray-300">Step 2: Open Google Sites</label>
                                <a href="https://sites.google.com/new" target="_blank" rel="noopener noreferrer" className="block w-full text-center text-sm bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                    Open Google Sites in New Tab
                                </a>
                            </div>
                            <div className="space-y-2 text-sm text-gray-300">
                                <p><span className="font-semibold">Step 3:</span> In the Google Sites editor, find the <span className="font-mono bg-gray-700/50 px-1 rounded">Insert</span> panel on the right and click on <span className="font-mono bg-gray-700/50 px-1 rounded">&lt;&gt; Embed</span>.</p>
                                <p><span className="font-semibold">Step 4:</span> Select the <span className="font-mono bg-gray-700/50 px-1 rounded">Embed code</span> tab, and paste the code you copied.</p>
                                <p><span className="font-semibold">Step 5:</span> Click <span className="font-mono bg-gray-700/50 px-1 rounded">Next</span>, then <span className="font-mono bg-gray-700/50 px-1 rounded">Insert</span>. Resize the embed block to fill the page, and you're ready to publish!</p>
                            </div>
                        </div>

                        <button onClick={() => setIsGoogleSitesModalOpen(false)} className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                            Done
                        </button>
                    </div>
                 </div>
            )}
        </div>
    );
};