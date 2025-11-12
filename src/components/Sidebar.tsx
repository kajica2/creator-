import React, { useState } from 'react';
import { X, Hash, Wand2, Image, Music, Mic, Video, Heart, Star, Brain, Palette, Grid3x3, Settings, CreditCard, Map, Trophy, Cloud, FileText } from 'lucide-react';
import type { Page } from '../../types';

interface SidebarProps {
  activePage: Page;
  onPageChange: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
}

const navigationSections: NavSection[] = [
  {
    title: 'Core Tools',
    items: [
      {
        id: 'Hashtag Manager',
        label: 'Hashtag Manager',
        icon: <Hash className="w-5 h-5" />,
        description: 'Manage and organize hashtags'
      },
      {
        id: 'App Gallery',
        label: 'App Gallery',
        icon: <Grid3x3 className="w-5 h-5" />,
        description: 'Browse all available applications',
        badge: 'New'
      }
    ]
  },
  {
    title: 'AI Content Creation',
    items: [
      {
        id: 'AI Story',
        label: 'AI Story Generator',
        icon: <Wand2 className="w-5 h-5" />,
        description: 'Generate engaging stories with AI'
      },
      {
        id: 'AI Lyrics',
        label: 'AI Lyrics',
        icon: <Music className="w-5 h-5" />,
        description: 'Create song lyrics with AI'
      },
      {
        id: 'AI Strategy',
        label: 'Website Strategy',
        icon: <Brain className="w-5 h-5" />,
        description: 'Plan website strategy with AI'
      },
      {
        id: 'AI Skill',
        label: 'Skill Generator',
        icon: <Heart className="w-5 h-5" />,
        description: 'Generate skill recommendations'
      },
      {
        id: 'AI Mutator',
        label: 'Tensor Mutator',
        icon: <Wand2 className="w-5 h-5" />,
        description: 'AI-powered creative mutations'
      },
      {
        id: 'AI Concept',
        label: 'Concept Generator',
        icon: <Brain className="w-5 h-5" />,
        description: 'Generate creative concepts'
      }
    ]
  },
  {
    title: 'Image & Media Studio',
    items: [
      {
        id: 'Text-to-Image',
        label: 'Text to Image',
        icon: <Image className="w-5 h-5" />,
        description: 'Generate images from text prompts'
      },
      {
        id: 'Image Edit',
        label: 'Image Editor',
        icon: <Palette className="w-5 h-5" />,
        description: 'Edit and enhance images'
      },
      {
        id: 'Batch Images',
        label: 'Batch Images',
        icon: <Grid3x3 className="w-5 h-5" />,
        description: 'Generate multiple images'
      },
      {
        id: 'Media Library',
        label: 'Media Library',
        icon: <Image className="w-5 h-5" />,
        description: 'Manage media files'
      }
    ]
  },
  {
    title: 'Audio & Video',
    items: [
      {
        id: 'Audio Transcriber',
        label: 'Audio Transcriber',
        icon: <Mic className="w-5 h-5" />,
        description: 'Transcribe audio to text'
      },
      {
        id: 'Audio Agents',
        label: 'Audio Agents',
        icon: <Mic className="w-5 h-5" />,
        description: 'AI audio processing agents'
      },
      {
        id: 'Synaptic Symphony',
        label: 'Synaptic Symphony',
        icon: <Music className="w-5 h-5" />,
        description: 'Advanced audio synthesis'
      }
    ]
  },
  {
    title: 'Advanced Tools',
    items: [
      {
        id: 'Thinking Mode',
        label: 'Thinking Mode',
        icon: <Brain className="w-5 h-5" />,
        description: 'Advanced AI reasoning'
      },
      {
        id: 'AI Website',
        label: 'Website Generator',
        icon: <Palette className="w-5 h-5" />,
        description: 'Generate complete websites'
      },
      {
        id: 'Sentry Navigation Cloud',
        label: 'Navigation Cloud',
        icon: <Star className="w-5 h-5" />,
        description: 'Visual navigation interface'
      }
    ]
  },
  {
    title: 'Developer Tools',
    items: [
      {
        id: 'Google Developer Console',
        label: 'Google Console',
        icon: <Cloud className="w-5 h-5" />,
        description: 'Manage Google Cloud APIs and services',
        badge: 'New'
      },
      {
        id: 'Markdown File Reader',
        label: 'Markdown Reader',
        icon: <FileText className="w-5 h-5" />,
        description: 'Read and explore project documentation',
        badge: 'New'
      }
    ]
  },
  {
    title: 'Account & Settings',
    items: [
      {
        id: 'Settings',
        label: 'Settings',
        icon: <Settings className="w-5 h-5" />,
        description: 'Configure application settings'
      },
      {
        id: 'Subscription',
        label: 'Subscription',
        icon: <CreditCard className="w-5 h-5" />,
        description: 'Manage subscription and billing'
      },
      {
        id: 'Gamification',
        label: 'Progress & Achievements',
        icon: <Trophy className="w-5 h-5" />,
        description: 'Track your progress'
      },
      {
        id: 'Roadmap',
        label: 'Product Roadmap',
        icon: <Map className="w-5 h-5" />,
        description: 'See upcoming features'
      }
    ]
  }
];

export function Sidebar({ activePage, onPageChange, isOpen, onClose }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Core Tools', 'AI Content Creation']));

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionTitle)) {
        newSet.delete(sectionTitle);
      } else {
        newSet.add(sectionTitle);
      }
      return newSet;
    });
  };

  const handleItemClick = (pageId: Page) => {
    onPageChange(pageId);
    onClose();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-80 bg-gray-900 border-r border-gray-700 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
        flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Navigation</h2>
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {navigationSections.map((section) => {
            const isExpanded = expandedSections.has(section.title);

            return (
              <div key={section.title} className="space-y-2">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  <span>{section.title}</span>
                  <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>

                {/* Section Items */}
                {isExpanded && (
                  <div className="space-y-1 ml-2">
                    {section.items.map((item) => {
                      const isActive = activePage === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-lg text-left
                            transition-all duration-200 group
                            ${isActive
                              ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300'
                              : 'hover:bg-gray-800 text-gray-300 hover:text-white border border-transparent'
                            }
                          `}
                        >
                          <div className={`flex-shrink-0 ${isActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-white'}`}>
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{item.label}</span>
                              {item.badge && (
                                <span className="px-1.5 py-0.5 text-xs bg-purple-600 text-purple-100 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 group-hover:text-gray-400 truncate">
                              {item.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-500 text-center">
            <p>KaiDjuric AI Tools</p>
            <p>v2.0.0 - ReAmp Edition</p>
          </div>
        </div>
      </div>
    </>
  );
}