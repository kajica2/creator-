import React, { useState, useRef, useEffect } from 'react';
import { Page } from '../types';
import { PersonaTemplate } from '../utils/personaTemplates';
import { 
  getUserTemplates, 
  systemTemplates as systemTemplatesData 
} from '../utils/personaTemplates';

interface PersonaDropdownProps {
  currentContext: string;
  onSetContext: (context: string) => void;
  onPageChange: (page: Page) => void;
}

const PersonaDropdown: React.FC<PersonaDropdownProps> = ({
  currentContext,
  onSetContext,
  onPageChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userTemplates, setUserTemplates] = useState<PersonaTemplate[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserTemplates(getUserTemplates());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTemplateSelect = (template: PersonaTemplate) => {
    onSetContext(template.context);
    setIsOpen(false);
  };

  const handleManageTemplates = () => {
    onPageChange('Persona Templates');
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    // This will open the context modal for creating a new persona
    // We'll need to trigger the existing modal, but for now we'll just close the dropdown
    setIsOpen(false);
  };

  const PersonaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
    </svg>
  );

  const ChevronIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`hidden sm:flex items-center text-sm font-semibold py-1.5 px-3 rounded-full transition-all border ${
          currentContext 
            ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/10' 
            : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
        }`}
      >
        <PersonaIcon />
        Set Persona
        <ChevronIcon />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Quick Templates Section */}
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Quick Templates</h3>
            
            {/* User Templates */}
            {userTemplates.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs text-gray-400 mb-1">Your Templates</h4>
                {userTemplates.slice(0, 3).map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full text-left p-2 rounded hover:bg-gray-700 text-sm text-gray-200 flex items-center"
                  >
                    <span className="mr-2">{template.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{template.name}</div>
                      {template.description && (
                        <div className="text-xs text-gray-400 truncate">
                          {template.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* System Templates */}
            <div>
              <h4 className="text-xs text-gray-400 mb-1">System Templates</h4>
              {systemTemplatesData.slice(0, 3).map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="w-full text-left p-2 rounded hover:bg-gray-700 text-sm text-gray-200 flex items-center"
                >
                  <span className="mr-2">{template.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{template.name}</div>
                    {template.description && (
                      <div className="text-xs text-gray-400 truncate">
                        {template.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-2">
            <button
              onClick={handleManageTemplates}
              className="w-full text-left p-2 rounded hover:bg-gray-700 text-sm text-purple-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Manage All Templates
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaDropdown;