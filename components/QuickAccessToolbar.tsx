import React, { useState } from 'react';

interface QuickAccessToolbarProps {
  onToolSelect: (tool: string) => void;
  onCreateTemplate: () => void;
  onCreatePersona: () => void;
}

export const QuickAccessToolbar: React.FC<QuickAccessToolbarProps> = ({
  onToolSelect,
  onCreateTemplate,
  onCreatePersona
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const quickTools = [
    { id: 'hashtag', name: 'Hashtags', icon: '🏷️', color: 'from-purple-500 to-pink-500' },
    { id: 'story', name: 'Story', icon: '📖', color: 'from-blue-500 to-cyan-500' },
    { id: 'image', name: 'Image', icon: '🖼️', color: 'from-green-500 to-emerald-500' },
    { id: 'website', name: 'Website', icon: '🌐', color: 'from-orange-500 to-red-500' },
    { id: 'strategy', name: 'Strategy', icon: '🎯', color: 'from-indigo-500 to-purple-500' }
  ];

  const quickActions = [
    { id: 'template', name: 'New Template', icon: '📋', action: onCreateTemplate },
    { id: 'persona', name: 'New Persona', icon: '👤', action: onCreatePersona }
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        >
          <span className="text-xl">
            {isExpanded ? '✕' : '⚡'}
          </span>
        </button>

        {/* Quick Tools Menu */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 mb-4 space-y-2 animate-slide-up">
            {/* Quick Actions */}
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  action.action();
                  setIsExpanded(false);
                }}
                className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg shadow-lg border border-gray-600 transition-all duration-200 hover:scale-105 w-48"
              >
                <span className="text-lg">{action.icon}</span>
                <span className="font-medium">{action.name}</span>
              </button>
            ))}

            {/* Divider */}
            <div className="border-t border-gray-600 my-2"></div>

            {/* Quick Tools */}
            {quickTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  onToolSelect(tool.id);
                  setIsExpanded(false);
                }}
                className={`flex items-center gap-3 bg-gradient-to-r ${tool.color} hover:opacity-90 text-white px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 w-48`}
              >
                <span className="text-lg">{tool.icon}</span>
                <span className="font-medium">{tool.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};