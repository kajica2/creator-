import React from 'react';
import { Page } from '../types';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const entryPoints = [
    {
      id: 'content-creation',
      title: '🎨 Content Creation Studio',
      description: 'Create viral stories, lyrics, and strategies with AI',
      color: 'from-purple-500 to-pink-500',
      pages: ['AI Story', 'AI Lyrics', 'AI Strategy', 'AI Concept'],
      icon: '🎬'
    },
    {
      id: 'hashtag-manager',
      title: '☁️ Hashtag Cloud Manager',
      description: 'Interactive hashtag visualization and trending analytics',
      color: 'from-blue-500 to-cyan-500',
      pages: ['Hashtag Manager'],
      icon: '#️⃣'
    },
    {
      id: 'audio-studio',
      title: '🎵 Neural Audio Studio',
      description: 'AI-powered music creation and audio generation',
      color: 'from-green-500 to-emerald-500',
      pages: ['Audio Agents', 'Synaptic Symphony', 'Audio Transcriber'],
      icon: '🎼'
    },
    {
      id: 'image-studio',
      title: '🖼️ Image Generation Lab',
      description: 'Advanced AI image creation and editing tools',
      color: 'from-orange-500 to-red-500',
      pages: ['Text-to-Image', 'Image Edit', 'Batch Images'],
      icon: '🎨'
    },
    {
      id: 'media-library',
      title: '📚 Media Library',
      description: 'Organize and manage all your AI-generated content',
      color: 'from-indigo-500 to-purple-500',
      pages: ['Media Library', 'Gallery'],
      icon: '📁'
    },
    {
      id: 'advanced-tools',
      title: '🔧 Advanced Tools',
      description: 'Professional content analysis and batch processing',
      color: 'from-teal-500 to-blue-500',
      pages: ['Thinking Mode', 'Batch Prompts', 'AI Mutator'],
      icon: '⚙️'
    }
  ];

  const quickActions = [
    { title: 'Generate Story', page: 'AI Story' as Page, icon: '📖' },
    { title: 'Create Music', page: 'Audio Agents' as Page, icon: '🎵' },
    { title: 'Design Image', page: 'Text-to-Image' as Page, icon: '🖼️' },
    { title: 'Manage Hashtags', page: 'Hashtag Manager' as Page, icon: '#️⃣' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                KaiDjuric AI Tools
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Your complete AI-powered content creation platform with neural music generation,
              hashtag analytics, and advanced agent coordination
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.page}
                  onClick={() => onNavigate(action.page)}
                  className="flex items-center space-x-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 border border-white/20"
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="font-semibold">{action.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Entry Points */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Choose Your Creative Journey</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {entryPoints.map((entry) => (
            <div
              key={entry.id}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-1 hover:scale-105 transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${entry.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
              <div className="relative bg-gray-800 rounded-2xl p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{entry.icon}</span>
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${entry.color}`}></div>
                </div>
                <h3 className="text-xl font-bold mb-3">{entry.title}</h3>
                <p className="text-gray-300 mb-6">{entry.description}</p>
                <div className="space-y-2">
                  {entry.pages.map((page) => (
                    <button
                      key={page}
                      onClick={() => onNavigate(page as Page)}
                      className="w-full text-left px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 text-sm"
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Highlights */}
      <div className="bg-black/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Powered by Advanced AI</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold mb-2">AI Agent Coordination</h3>
              <p className="text-gray-300">Daily agent routines with video, audio, and live mixer groups working together</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎼</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Neural Music Generation</h3>
              <p className="text-gray-300">Google Magenta integration for AI-powered melody creation and composition</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">☁️</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Interactive Visualizations</h3>
              <p className="text-gray-300">Real-time hashtag clouds and navigation systems with trending analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">20+</div>
            <div className="text-gray-300">AI Generators</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">76%</div>
            <div className="text-gray-300">Faster Loading</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">54</div>
            <div className="text-gray-300">Agent Types</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-400 mb-2">98%</div>
            <div className="text-gray-300">Accessibility</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;