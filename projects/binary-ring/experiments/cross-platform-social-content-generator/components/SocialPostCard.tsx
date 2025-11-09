
import React, { useState } from 'react';
// FIX: Changed 'import type' to 'import' to allow 'SocialPlatform' to be used as a value.
import { SocialPlatform } from '../types';
import Loader from './Loader';

interface SocialPostCardProps {
  platform: SocialPlatform;
  text: string;
  imageUrl: string | null;
  isLoading: boolean;
}

const platformConfig = {
  [SocialPlatform.LinkedIn]: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
    ),
    bg: 'bg-blue-800',
    text: 'text-blue-300',
  },
  [SocialPlatform.Twitter]: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    ),
    bg: 'bg-gray-700',
    text: 'text-gray-300',
  },
  [SocialPlatform.Instagram]: {
    icon: (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
    ),
    bg: 'bg-purple-800',
    text: 'text-purple-300',
  },
};

const SocialPostCard: React.FC<SocialPostCardProps> = ({ platform, text, imageUrl, isLoading }) => {
    const [copied, setCopied] = useState(false);
    const config = platformConfig[platform];

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
  
    return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg overflow-hidden flex flex-col">
      <div className={`flex items-center p-4 ${config.bg}`}>
        {config.icon}
        <h3 className="text-xl font-bold ml-3">{platform}</h3>
      </div>
      <div className="p-5 flex-grow flex flex-col md:flex-row gap-5">
        <div className="flex-1">
          <div className="relative">
             <button
                onClick={handleCopy}
                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-all duration-200"
                title="Copy text"
              >
                  {copied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  )}
            </button>
            <p className="text-gray-300 whitespace-pre-wrap font-mono bg-gray-900/50 p-4 rounded-lg h-full min-h-[200px]">{isLoading ? 'Generating text...' : text}</p>
          </div>
        </div>
        <div className="w-full md:w-1/3 aspect-square bg-gray-900/50 rounded-lg flex items-center justify-center">
          {isLoading || !imageUrl ? (
            <div className="text-center">
              <Loader />
              <p className="mt-2 text-sm text-gray-400">Generating image...</p>
            </div>
          ) : (
            <img src={imageUrl} alt={`${platform} post`} className="w-full h-full object-cover rounded-lg" />
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialPostCard;
