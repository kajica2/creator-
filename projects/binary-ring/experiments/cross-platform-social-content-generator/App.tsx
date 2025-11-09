
import React, { useState } from 'react';
import { generateSocialContent, generateImageForPost } from './services/geminiService';
import type { TextContent, ImageContent, AspectRatios } from './types';
import { SocialPlatform } from './types';
import SocialPostCard from './components/SocialPostCard';
import Loader from './components/Loader';

const TONES = ['Professional', 'Witty', 'Urgent', 'Casual', 'Inspirational'];
const ASPECT_RATIO_OPTIONS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const App: React.FC = () => {
  const [idea, setIdea] = useState('');
  const [tone, setTone] = useState(TONES[0]);
  const [aspectRatios, setAspectRatios] = useState<AspectRatios>({
    [SocialPlatform.LinkedIn]: '16:9',
    [SocialPlatform.Twitter]: '16:9',
    [SocialPlatform.Instagram]: '1:1',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<TextContent | null>(null);
  const [imageContent, setImageContent] = useState<ImageContent | null>(null);

  const handleAspectRatioChange = (platform: SocialPlatform, value: string) => {
    setAspectRatios(prev => ({ ...prev, [platform]: value }));
  };

  const handleGenerate = async () => {
    if (!idea.trim()) {
      setError('Please enter a content idea.');
      return;
    }
    setLoading(true);
    setError(null);
    setTextContent(null);
    setImageContent(null);

    try {
      const textPromise = generateSocialContent(idea, tone);

      const imagePromises = [
        generateImageForPost(idea, aspectRatios[SocialPlatform.LinkedIn]),
        generateImageForPost(idea, aspectRatios[SocialPlatform.Twitter]),
        generateImageForPost(idea, aspectRatios[SocialPlatform.Instagram]),
      ];
      
      const [generatedText, ...generatedImages] = await Promise.all([textPromise, ...imagePromises]);
      
      setTextContent(generatedText);
      setImageContent({
        [SocialPlatform.LinkedIn]: generatedImages[0],
        [SocialPlatform.Twitter]: generatedImages[1],
        [SocialPlatform.Instagram]: generatedImages[2],
      });

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const platforms = [SocialPlatform.LinkedIn, SocialPlatform.Twitter, SocialPlatform.Instagram];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            AI Social Content Studio
          </h1>
          <p className="mt-3 text-lg text-gray-400">
            Generate tailored posts for all your platforms from a single idea.
          </p>
        </header>

        <main>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-8 rounded-2xl shadow-2xl mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div>
                  <label htmlFor="idea" className="block text-sm font-medium text-gray-300 mb-2">
                    1. Your Content Idea
                  </label>
                  <textarea
                    id="idea"
                    rows={4}
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="e.g., Launching a new productivity app that helps users focus..."
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-2">
                    2. Select a Tone
                  </label>
                  <select
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-6">
                 <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">
                        3. Customize Image Aspect Ratios
                    </h3>
                    <div className="space-y-3">
                    {platforms.map(p => (
                         <div key={p} className="flex items-center justify-between">
                            <label htmlFor={`${p}-aspect`} className="text-gray-400">{p}</label>
                            <select
                                id={`${p}-aspect`}
                                value={aspectRatios[p]}
                                onChange={(e) => handleAspectRatioChange(p, e.target.value)}
                                className="w-1/2 bg-gray-900 border border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                            >
                                {ASPECT_RATIO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    ))}
                    </div>
                </div>
              </div>
            </div>
             <div className="mt-8 text-center">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-10 rounded-full text-lg transition-all duration-300 shadow-lg shadow-indigo-600/30 w-full sm:w-auto"
              >
                {loading ? <span className="flex items-center justify-center"><Loader size="sm" /> <span className="ml-3">Generating...</span></span> : '✨ Generate Content'}
              </button>
            </div>
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
          </div>

          {(loading || textContent) && (
            <div className="space-y-8">
              {platforms.map((platform) => (
                <SocialPostCard
                  key={platform}
                  platform={platform}
                  text={
                    textContent?.[
                      platform === SocialPlatform.LinkedIn ? 'linkedinPost' :
                      platform === SocialPlatform.Twitter ? 'twitterPost' : 'instagramCaption'
                    ] || ''
                  }
                  imageUrl={imageContent?.[platform] ?? null}
                  isLoading={loading || !textContent || !imageContent?.[platform]}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
