import React, { useState } from 'react';
import { createCustomSet } from '../utils/hashtagStorage';
import { generateHashtagsFromUrl } from '../api/generate-hashtags-from-url';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

interface UrlHashtagGeneratorProps {
  onSetUpdate?: () => void;
}

interface GeneratedSet {
  personaName: string;
  description: string;
  primarySet: string[];
  secondarySet: string[];
  nicheSet: string[];
}

const UrlHashtagGenerator: React.FC<UrlHashtagGeneratorProps> = ({ onSetUpdate }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedSets, setGeneratedSets] = useState<GeneratedSet[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { user, session } = useSupabaseAuth();

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleGenerate = async () => {
    if (!validateUrl(url)) {
      setError('Please enter a valid URL (http:// or https://)');
      return;
    }

    if (!session?.access_token) {
      setError('Please sign in to generate hashtag sets.');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedSets([]);

    try {
      // Try server-side API first
      const result = await generateHashtagsFromUrl(url, session.access_token);
      
      if (result.success) {
        setGeneratedSets(result.sets);
      } else {
        // Fallback to client-side generation with URL analysis
        console.log('Server API failed, using client-side fallback');
        const fallbackSets = generateFallbackHashtagSets(url);
        setGeneratedSets(fallbackSets);
      }
    } catch (err) {
      console.log('Error using server API, falling back to client-side:', err);
      // Fallback to client-side generation
      const fallbackSets = generateFallbackHashtagSets(url);
      setGeneratedSets(fallbackSets);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackHashtagSets = (url: string): GeneratedSet[] => {
    // Extract path for analysis
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();
    
    // Content type mapping for URL pattern analysis
    const contentTypeMappings = [
      { patterns: ['blog', 'article', 'post'], type: 'blog' },
      { patterns: ['design', 'creative', 'art'], type: 'design' },
      { patterns: ['tech', 'code', 'developer'], type: 'tech' },
      { patterns: ['photo', 'gallery', 'image'], type: 'photo' },
      { patterns: ['video', 'youtube', 'film'], type: 'video' },
      { patterns: ['social', 'instagram', 'tiktok'], type: 'social' },
      { patterns: ['business', 'startup', 'entrepreneur'], type: 'business' }
    ];

    // Find matching content type
    const matchedType = contentTypeMappings.find(({ patterns }) =>
      patterns.some(pattern => path.includes(pattern))
    )?.type || 'general';

    // Predefined hashtag sets for each content type
    const hashtagSets: Record<string, GeneratedSet[]> = {
      blog: [
        {
          personaName: 'Content Writer',
          description: 'Professional writer creating blog posts and articles',
          primarySet: ['#contentwriter', '#blogger', '#writing', '#content', '#blog'],
          secondarySet: ['#contentcreation', '#copywriting', '#blogging', '#article', '#writer'],
          nicheSet: ['#contentstrategist', '#freelancewriter', '#blogpost', '#writingcommunity', '#contentmarketing']
        },
        {
          personaName: 'Digital Marketer',
          description: 'Marketing professional focused on content strategy',
          primarySet: ['#digitalmarketing', '#marketing', '#seo', '#contentmarketing', '#socialmedia'],
          secondarySet: ['#digitalstrategy', '#contentstrategy', '#marketingtips', '#onlinemarketing', '#brand'],
          nicheSet: ['#marketingagency', '#contentcreator', '#marketingexpert', '#digitalagency', '#growthhacking']
        }
      ],
      design: [
        {
          personaName: 'Graphic Designer',
          description: 'Creative professional designing visual content',
          primarySet: ['#graphicdesign', '#design', '#creative', '#art', '#designer'],
          secondarySet: ['#graphicdesigner', '#visualdesign', '#creativedesign', '#designinspiration', '#artwork'],
          nicheSet: ['#designcommunity', '#graphicart', '#digitaldesign', '#designstudio', '#creativeprocess']
        },
        {
          personaName: 'UI/UX Designer',
          description: 'User interface and experience design specialist',
          primarySet: ['#uiux', '#uxdesign', '#uidesign', '#userexperience', '#userinterface'],
          secondarySet: ['#uxui', '#designsystem', '#productdesign', '#interactiondesign', '#webdesign'],
          nicheSet: ['#uxresearch', '#uiinspiration', '#designthinking', '#prototyping', '#designsprint']
        }
      ],
      tech: [
        {
          personaName: 'Software Developer',
          description: 'Programmer and software engineer',
          primarySet: ['#softwaredeveloper', '#programming', '#coding', '#developer', '#tech'],
          secondarySet: ['#softwareengineer', '#webdevelopment', '#programmer', '#code', '#javascript'],
          nicheSet: ['#fullstack', '#webdeveloper', '#codinglife', '#devcommunity', '#softwaredevelopment']
        },
        {
          personaName: 'Tech Enthusiast',
          description: 'Technology lover and early adopter',
          primarySet: ['#technology', '#tech', '#innovation', '#futuretech', '#digital'],
          secondarySet: ['#techenthusiast', '#gadgets', '#technews', '#ai', '#emergingtech'],
          nicheSet: ['#techcommunity', '#techtalk', '#techlover', '#innovationlab', '#digitaltransformation']
        }
      ],
      photo: [
        {
          personaName: 'Photographer',
          description: 'Professional capturing and editing photographs',
          primarySet: ['#photographer', '#photography', '#photo', '#camera', '#photos'],
          secondarySet: ['#photoshoot', '#photographytips', '#photographylove', '#cameragear', '#photographyworkshop'],
          nicheSet: ['#photographerlife', '#photographycommunity', '#photographylovers', '#photographyskills', '#photographyart']
        }
      ],
      video: [
        {
          personaName: 'Video Creator',
          description: 'Content creator producing video content',
          primarySet: ['#videocreator', '#video', '#contentcreator', '#youtube', '#filmmaker'],
          secondarySet: ['#videoproduction', '#videography', '#videoediting', '#contentcreation', '#youtuber'],
          nicheSet: ['#videomaker', '#videocontent', '#creativevideo', '#videographer', '#youtubecreator']
        }
      ],
      social: [
        {
          personaName: 'Social Media Influencer',
          description: 'Content creator building personal brand on social platforms',
          primarySet: ['#influencer', '#socialmedia', '#contentcreator', '#instagram', '#tiktok'],
          secondarySet: ['#influencermarketing', '#socialmediainfluencer', '#contentcreation', '#creator', '#socialmedia'],
          nicheSet: ['#influencerlife', '#socialmediatips', '#contentcreatorlife', '#instagrammer', '#tiktokcreator']
        }
      ],
      business: [
        {
          personaName: 'Business Owner',
          description: 'Entrepreneur running a business or startup',
          primarySet: ['#entrepreneur', '#business', '#startup', '#businessowner', '#entrepreneurship'],
          secondarySet: ['#smallbusiness', '#businessgrowth', '#startuplife', '#entrepreneurmindset', '#businessstrategy'],
          nicheSet: ['#entrepreneurlife', '#businesssuccess', '#startupfounder', '#businessdevelopment', '#entrepreneurjourney']
        }
      ],
      general: [
        {
          personaName: 'Content Creator',
          description: 'Multi-platform content creator and digital strategist',
          primarySet: ['#contentcreator', '#digital', '#creative', '#content', '#socialmedia'],
          secondarySet: ['#contentcreation', '#digitalcreator', '#creativelife', '#contentstrategy', '#digitalcontent'],
          nicheSet: ['#creatorcommunity', '#contentcreators', '#digitalstrategy', '#creativecontent', '#contentmarketing']
        },
        {
          personaName: 'Digital Entrepreneur',
          description: 'Business owner in the digital space',
          primarySet: ['#entrepreneur', '#business', '#digital', '#startup', '#entrepreneurship'],
          secondarySet: ['#digitalentrepreneur', '#businessowner', '#startuplife', '#entrepreneurmindset', '#digitalbusiness'],
          nicheSet: ['#entrepreneurlife', '#businessgrowth', '#digitaltransformation', '#startupfounder', '#businessstrategy']
        }
      ]
    };

    return hashtagSets[matchedType] || hashtagSets.general;
  };

  const handleSaveSet = (set: GeneratedSet, setType: 'primary' | 'secondary' | 'niche') => {
    const hashtags = setType === 'primary' ? set.primarySet : 
                    setType === 'secondary' ? set.secondarySet : set.nicheSet;
    
    const setName = `${set.personaName} - ${setType.charAt(0).toUpperCase() + setType.slice(1)} Set`;
    createCustomSet(setName, 'Generated', hashtags);
    onSetUpdate?.();
  };

  const handleSaveAllSets = (set: GeneratedSet) => {
    createCustomSet(`${set.personaName} - Primary Set`, 'Generated', set.primarySet);
    createCustomSet(`${set.personaName} - Secondary Set`, 'Generated', set.secondarySet);
    createCustomSet(`${set.personaName} - Niche Set`, 'Generated', set.nicheSet);
    onSetUpdate?.();
  };

  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/50 rounded-xl p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-purple-300">Generate Hashtags from URL</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL with creative personas or descriptions..."
              className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading || !url.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-700/50 rounded-lg p-3">
              {error}
            </div>
          )}

          {generatedSets.length > 0 && (
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold text-green-300">Generated Hashtag Sets</h4>
              {generatedSets.map((set, index) => (
                <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-bold text-white text-lg">{set.personaName}</h5>
                      <p className="text-gray-400 text-sm">{set.description}</p>
                    </div>
                    <button
                      onClick={() => handleSaveAllSets(set)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Save All Sets
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Primary Set */}
                    <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h6 className="font-semibold text-purple-300">Primary Set</h6>
                        <button
                          onClick={() => handleSaveSet(set, 'primary')}
                          className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {set.primarySet.map((tag, tagIndex) => (
                          <span key={tagIndex} className="text-xs bg-purple-800/50 text-purple-200 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Secondary Set */}
                    <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h6 className="font-semibold text-blue-300">Secondary Set</h6>
                        <button
                          onClick={() => handleSaveSet(set, 'secondary')}
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {set.secondarySet.map((tag, tagIndex) => (
                          <span key={tagIndex} className="text-xs bg-blue-800/50 text-blue-200 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Niche Set */}
                    <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h6 className="font-semibold text-green-300">Niche Set</h6>
                        <button
                          onClick={() => handleSaveSet(set, 'niche')}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {set.nicheSet.map((tag, tagIndex) => (
                          <span key={tagIndex} className="text-xs bg-green-800/50 text-green-200 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="ml-3 text-purple-300">Analyzing content and generating hashtag sets...</span>
            </div>
          )}
        </div>
      )}

      {!isExpanded && (
        <p className="text-gray-400 text-sm">
          Enter a URL containing creative persona templates or descriptions to generate optimized hashtag sets.
          {!user && ' Sign in to unlock scraping-powered suggestions.'}
        </p>
      )}
    </div>
  );
};

export default UrlHashtagGenerator;