import React from 'react';
import { Page } from '../types';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  console.log('LandingPage component rendering'); // Debug log

  const quickActions = [
    { title: 'Generate Story', page: 'AI Story' as Page, icon: '📖' },
    { title: 'Create Music', page: 'Audio Agents' as Page, icon: '🎵' },
    { title: 'Design Image', page: 'Text-to-Image' as Page, icon: '🖼️' },
    { title: 'Manage Hashtags', page: 'Hashtag Manager' as Page, icon: '#️⃣' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          KaiDjuric AI Tools - Landing Page
        </span>
      </h1>

      <div className="text-center">
        <p className="text-xl text-gray-300 mb-8">
          Choose your creative journey:
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.page}
              onClick={() => onNavigate(action.page)}
              className="p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <span className="text-2xl block mb-2">{action.icon}</span>
              <span className="text-sm font-semibold">{action.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;