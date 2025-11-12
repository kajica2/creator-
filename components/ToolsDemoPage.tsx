import React from 'react';
import { Page } from '../types';

interface ToolsDemoPageProps {
  onPageChange: (page: Page) => void;
}

const ToolsDemoPage: React.FC<ToolsDemoPageProps> = ({ onPageChange }) => {
  const toolCategories = [
    {
      title: 'Content Creation',
      description: 'AI-powered tools for generating various types of content',
      color: 'from-purple-500 to-pink-500',
      tools: [
        {
          name: 'AI Story Generator',
          description: 'Create engaging stories and narratives using selected hashtags',
          page: 'AI Story' as Page,
          icon: '📖'
        },
        {
          name: 'AI Lyrics Generator',
          description: 'Generate song lyrics and musical compositions',
          page: 'AI Lyrics' as Page,
          icon: '🎵'
        },
        {
          name: 'AI Strategy Generator',
          description: 'Develop business and marketing strategies',
          page: 'AI Strategy' as Page,
          icon: '🎯'
        },
        {
          name: 'AI Skill Generator',
          description: 'Create learning paths and skill development plans',
          page: 'AI Skill' as Page,
          icon: '🧠'
        },
        {
          name: 'AI Concept Generator',
          description: 'Generate innovative concepts and ideas',
          page: 'AI Concept' as Page,
          icon: '💡'
        },
        {
          name: 'Tensor Mutator',
          description: 'Advanced AI transformations and mutations',
          page: 'AI Mutator' as Page,
          icon: '⚡'
        },
        {
          name: 'Thinking Mode',
          description: 'Deep thinking and analysis tools',
          page: 'Thinking Mode' as Page,
          icon: '🤔'
        }
      ]
    },
    {
      title: 'Image & Media',
      description: 'Visual content creation and manipulation tools',
      color: 'from-blue-500 to-cyan-500',
      tools: [
        {
          name: 'Text-to-Image Generator',
          description: 'Generate images from text descriptions',
          page: 'Text-to-Image' as Page,
          icon: '🎨'
        },
        {
          name: 'Image Editor',
          description: 'Edit and enhance existing images with AI',
          page: 'Image Edit' as Page,
          icon: '✏️'
        },
        {
          name: 'Batch Image Generator',
          description: 'Generate multiple images at once',
          page: 'Batch Images' as Page,
          icon: '🖼️'
        },
        {
          name: 'Batch Prompt Generator',
          description: 'Create multiple prompts for batch processing',
          page: 'Batch Prompts' as Page,
          icon: '📝'
        },
        {
          name: 'Audio Transcriber',
          description: 'Convert audio to text with AI transcription',
          page: 'Audio Transcriber' as Page,
          icon: '🎤'
        },
        {
          name: 'Media Library',
          description: 'Manage and organize your media assets',
          page: 'Media Library' as Page,
          icon: '📚'
        }
      ]
    },
    {
      title: 'Website & Development',
      description: 'Web development and deployment tools',
      color: 'from-green-500 to-emerald-500',
      tools: [
        {
          name: 'AI Website Generator',
          description: 'Generate complete websites with AI',
          page: 'AI Website' as Page,
          icon: '🌐'
        },
        {
          name: 'React Projects Gallery',
          description: 'Browse and explore React project examples',
          page: 'React Projects Gallery' as Page,
          icon: '⚛️'
        },
        {
          name: 'Google Developer Console',
          description: 'Access Google development tools and APIs',
          page: 'Google Developer Console' as Page,
          icon: '🔧'
        }
      ]
    },
    {
      title: 'Hashtags & Social',
      description: 'Social media and hashtag management tools',
      color: 'from-orange-500 to-red-500',
      tools: [
        {
          name: 'Hashtag Manager',
          description: 'Manage and organize your hashtag collections',
          page: 'Hashtag Manager' as Page,
          icon: '#️⃣'
        },
        {
          name: 'Ready Sets',
          description: 'Pre-built hashtag sets for quick use',
          page: 'Hashtag Manager' as Page,
          icon: '📋'
        },
        {
          name: 'Sentry Navigation Cloud',
          description: 'Interactive navigation and content discovery',
          page: 'Sentry Navigation Cloud' as Page,
          icon: '☁️'
        },
        {
          name: 'Social Worker Dashboard',
          description: 'Manage social media content and scheduling',
          page: 'Social Worker Dashboard' as Page,
          icon: '📱'
        }
      ]
    },
    {
      title: 'Advanced & Integration',
      description: 'Advanced tools and system integrations',
      color: 'from-indigo-500 to-purple-500',
      tools: [
        {
          name: 'Audio Agents',
          description: 'Advanced audio processing and AI agents',
          page: 'Audio Agents' as Page,
          icon: '🎧'
        },
        {
          name: 'Synaptic Symphony',
          description: 'Neural network and AI orchestration tools',
          page: 'Synaptic Symphony' as Page,
          icon: '🎼'
        },
        {
          name: 'Obsidian Sync',
          description: 'Sync with Obsidian for knowledge management',
          page: 'Documentation' as Page,
          icon: '📓'
        },
        {
          name: 'Markdown File Reader',
          description: 'Read and process markdown documentation',
          page: 'Markdown File Reader' as Page,
          icon: '📄'
        },
        {
          name: 'Context Modifier',
          description: 'Modify AI context and persona settings',
          page: 'Hashtag Manager' as Page, // This opens the context modal
          icon: '🎭'
        },
        {
          name: 'RAG Source Manager',
          description: 'Manage external knowledge sources for AI',
          page: 'Hashtag Manager' as Page, // This opens the RAG modal
          icon: '📚'
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-4">
          AI Tools Demo Gallery
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Explore all the powerful AI tools available in our ecosystem. Click on any tool to try it out instantly.
        </p>
      </div>

      {/* Tool Categories */}
      <div className="space-y-8">
        {toolCategories.map((category, categoryIndex) => (
          <section key={categoryIndex} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="mb-6">
              <h2 className={`text-2xl font-bold bg-gradient-to-r ${category.color} bg-clip-text text-transparent mb-2`}>
                {category.title}
              </h2>
              <p className="text-gray-400">{category.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.tools.map((tool, toolIndex) => (
                <button
                  key={toolIndex}
                  onClick={() => onPageChange(tool.page)}
                  className="group bg-gray-900/70 hover:bg-gray-800/80 border border-gray-700 hover:border-purple-500/50 rounded-xl p-4 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl group-hover:scale-110 transition-transform">
                      {tool.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {tool.description}
                      </p>
                      <div className="mt-2 text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to try →
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-500/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-300">{toolCategories.reduce((acc, cat) => acc + cat.tools.length, 0)}</div>
            <div className="text-sm text-gray-400">Total Tools</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-300">{toolCategories.length}</div>
            <div className="text-sm text-gray-400">Categories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-300">AI-Powered</div>
            <div className="text-sm text-gray-400">All Tools</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-300">Instant</div>
            <div className="text-sm text-gray-400">Access</div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Getting Started</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-semibold text-white mb-2">Choose Your Tool</h4>
            <p className="text-sm text-gray-400">
              Browse through our categories and select the tool that fits your needs.
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-2xl mb-2">⚡</div>
            <h4 className="font-semibold text-white mb-2">Click to Launch</h4>
            <p className="text-sm text-gray-400">
              Simply click on any tool card to instantly launch it in the main workspace.
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-2xl mb-2">🚀</div>
            <h4 className="font-semibold text-white mb-2">Start Creating</h4>
            <p className="text-sm text-gray-400">
              Use the tool's interface to generate content, edit media, or build projects.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsDemoPage;