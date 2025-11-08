import React from 'react';
import { Page } from '../types';

interface SectionTabsProps {
  activePage: Page;
  onPageChange: (page: Page) => void;
}

type TabGroup = 'Hashtag Manager' | 'Content Creation' | 'Image Studio' | 'AI Website' | 'Advanced Tools';

const SectionTabs: React.FC<SectionTabsProps> = ({ activePage, onPageChange }) => {
  const tabs = [
    { id: 'Hashtag Manager' as TabGroup, label: 'Hashtags', icon: '#' },
    { id: 'Content Creation' as TabGroup, label: 'Content', icon: '✍️' },
    { id: 'Image Studio' as TabGroup, label: 'Images', icon: '🖼️' },
    { id: 'AI Website' as TabGroup, label: 'Website', icon: '🌐' },
    { id: 'Advanced Tools' as TabGroup, label: 'Tools', icon: '🧠' }
  ];

  const contentCreationPages: Page[] = ['AI Story', 'AI Lyrics', 'AI Strategy', 'AI Skill', 'AI Mutator', 'AI Concept'];
  const imageStudioPages: Page[] = ['Text-to-Image', 'Image Edit', 'Batch Images', 'Batch Prompts'];
  const advancedToolsPages: Page[] = ['Thinking Mode', 'Audio Transcriber'];

  const getActiveTab = (page: Page): TabGroup => {
    if (contentCreationPages.includes(page)) return 'Content Creation';
    if (imageStudioPages.includes(page)) return 'Image Studio';
    if (advancedToolsPages.includes(page)) return 'Advanced Tools';
    return page as TabGroup;
  };

  const activeTab = getActiveTab(activePage);

  const handleTabClick = (tabId: TabGroup) => {
    if (tabId === 'Content Creation') {
      onPageChange('AI Story');
    } else if (tabId === 'Image Studio') {
      onPageChange('Text-to-Image');
    } else if (tabId === 'Advanced Tools') {
      onPageChange('Thinking Mode');
    } else {
      onPageChange(tabId as Page);
    }
  };

  return (
    <div className="section-tabs">
      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <style jsx="true">{`
        .section-tabs {
          background: rgba(31, 41, 55, 0.8);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(55, 65, 81, 0.5);
          padding: 0.5rem 1rem;
          margin-bottom: 1.5rem;
        }

        .tabs-container {
          display: flex;
          gap: 0.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 0.5rem;
          background: transparent;
          color: #9ca3af;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .tab:hover {
          background: rgba(55, 65, 81, 0.5);
          color: #e5e7eb;
        }

        .tab.active {
          background: rgba(139, 92, 246, 0.2);
          color: #c4b5fd;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -0.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          background: #8b5cf6;
          border-radius: 50%;
        }

        .tab-icon {
          font-size: 1rem;
        }

        .tab-label {
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .tabs-container {
            overflow-x: auto;
            padding-bottom: 0.25rem;
          }

          .tab {
            flex-shrink: 0;
            padding: 0.5rem 0.75rem;
          }

          .tab-label {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SectionTabs;