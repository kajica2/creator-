import React from 'react';

interface LanguageSwitcherProps {
  currentLanguage: 'en' | 'sr';
  onLanguageChange: (lang: 'en' | 'sr') => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLanguage, onLanguageChange }) => {
  return (
    <div className="flex items-center justify-center space-x-1 bg-gray-800 p-1 rounded-lg border border-gray-700">
      <button
        onClick={() => onLanguageChange('en')}
        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${currentLanguage === 'en' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
      >
        English
      </button>
      <button
        onClick={() => onLanguageChange('sr')}
        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${currentLanguage === 'sr' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
      >
        Srpski
      </button>
    </div>
  );
};
