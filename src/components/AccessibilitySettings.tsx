/**
 * Comprehensive accessibility settings panel
 * Allows users to customize accessibility preferences
 */

import React, { useState } from 'react';
import { useAccessibility } from '../hooks/useAccessibility';
import { ARIA_ROLES, keyboardShortcuts, colorContrast } from '../utils/accessibility';

interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ isOpen, onClose }) => {
  const { preferences, updatePreference, announceMessage } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'visual' | 'audio' | 'motor' | 'cognitive'>('visual');

  const handlePreferenceChange = <K extends keyof typeof preferences>(
    key: K,
    value: typeof preferences[K]
  ) => {
    updatePreference(key, value);
    announceMessage(`${key} preference updated`);
  };

  const handleFontSizeChange = (increment: boolean) => {
    const newSize = Math.max(12, Math.min(24, preferences.fontSize + (increment ? 2 : -2)));
    updatePreference('fontSize', newSize);
    announceMessage(`Font size changed to ${newSize} pixels`);
  };

  const tabs = [
    { id: 'visual' as const, label: 'Visual', icon: '👁️' },
    { id: 'audio' as const, label: 'Audio', icon: '🔊' },
    { id: 'motor' as const, label: 'Motor', icon: '✋' },
    { id: 'cognitive' as const, label: 'Cognitive', icon: '🧠' }
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-settings-title"
    >
      <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-label="Close settings overlay" />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-gray-800 rounded-xl shadow-xl border border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 id="accessibility-settings-title" className="text-xl font-bold text-white">
              Accessibility Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-md p-1"
              aria-label="Close accessibility settings"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-purple-500 bg-purple-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
              >
                <span className="mr-2" aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div className="p-6">
            {/* Visual Settings */}
            {activeTab === 'visual' && (
              <div id="panel-visual" role="tabpanel" aria-labelledby="tab-visual" className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">Visual Accessibility</h3>

                {/* High Contrast */}
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="high-contrast" className="text-white font-medium">
                      High Contrast Mode
                    </label>
                    <p className="text-gray-400 text-sm">
                      Enhances contrast for better visibility
                    </p>
                  </div>
                  <button
                    id="high-contrast"
                    onClick={() => handlePreferenceChange('highContrast', !preferences.highContrast)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      preferences.highContrast ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={preferences.highContrast}
                    aria-describedby="high-contrast-description"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.highContrast ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Large Text */}
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="large-text" className="text-white font-medium">
                      Large Text
                    </label>
                    <p className="text-gray-400 text-sm">
                      Increases text size for better readability
                    </p>
                  </div>
                  <button
                    id="large-text"
                    onClick={() => handlePreferenceChange('largeText', !preferences.largeText)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      preferences.largeText ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={preferences.largeText}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.largeText ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-white font-medium block mb-2">
                    Font Size: {preferences.fontSize}px
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleFontSizeChange(false)}
                      disabled={preferences.fontSize <= 12}
                      className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                      aria-label="Decrease font size"
                    >
                      A-
                    </button>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      step="2"
                      value={preferences.fontSize}
                      onChange={(e) => updatePreference('fontSize', parseInt(e.target.value))}
                      className="flex-1"
                      aria-label="Font size slider"
                    />
                    <button
                      onClick={() => handleFontSizeChange(true)}
                      disabled={preferences.fontSize >= 24}
                      className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                      aria-label="Increase font size"
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* Color Theme */}
                <div>
                  <label htmlFor="color-theme" className="text-white font-medium block mb-2">
                    Color Theme
                  </label>
                  <select
                    id="color-theme"
                    value={preferences.colorTheme}
                    onChange={(e) => updatePreference('colorTheme', e.target.value as 'light' | 'dark' | 'auto')}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="auto">Auto (System)</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                {/* Reduced Motion */}
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="reduced-motion" className="text-white font-medium">
                      Reduce Motion
                    </label>
                    <p className="text-gray-400 text-sm">
                      Minimizes animations and transitions
                    </p>
                  </div>
                  <button
                    id="reduced-motion"
                    onClick={() => handlePreferenceChange('reducedMotion', !preferences.reducedMotion)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      preferences.reducedMotion ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={preferences.reducedMotion}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Audio Settings */}
            {activeTab === 'audio' && (
              <div id="panel-audio" role="tabpanel" aria-labelledby="tab-audio" className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">Audio Accessibility</h3>

                {/* Audio Descriptions */}
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="audio-descriptions" className="text-white font-medium">
                      Audio Descriptions
                    </label>
                    <p className="text-gray-400 text-sm">
                      Provides audio descriptions for visual content
                    </p>
                  </div>
                  <button
                    id="audio-descriptions"
                    onClick={() => handlePreferenceChange('audioDescriptions', !preferences.audioDescriptions)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      preferences.audioDescriptions ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={preferences.audioDescriptions}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.audioDescriptions ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Captions */}
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="captions" className="text-white font-medium">
                      Captions
                    </label>
                    <p className="text-gray-400 text-sm">
                      Shows text captions for audio content
                    </p>
                  </div>
                  <button
                    id="captions"
                    onClick={() => handlePreferenceChange('captionsEnabled', !preferences.captionsEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      preferences.captionsEnabled ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={preferences.captionsEnabled}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.captionsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Motor Settings */}
            {activeTab === 'motor' && (
              <div id="panel-motor" role="tabpanel" aria-labelledby="tab-motor" className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">Motor Accessibility</h3>

                {/* Motor Assistance */}
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="motor-assist" className="text-white font-medium">
                      Motor Assistance
                    </label>
                    <p className="text-gray-400 text-sm">
                      Larger click targets and enhanced interaction areas
                    </p>
                  </div>
                  <button
                    id="motor-assist"
                    onClick={() => handlePreferenceChange('motorAssist', !preferences.motorAssist)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      preferences.motorAssist ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={preferences.motorAssist}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.motorAssist ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Voice Control */}
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="voice-control" className="text-white font-medium">
                      Voice Control
                    </label>
                    <p className="text-gray-400 text-sm">
                      Enable voice commands for navigation and interaction
                    </p>
                  </div>
                  <button
                    id="voice-control"
                    onClick={() => handlePreferenceChange('voiceControl', !preferences.voiceControl)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      preferences.voiceControl ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={preferences.voiceControl}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.voiceControl ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Keyboard Navigation */}
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="keyboard-nav" className="text-white font-medium">
                      Enhanced Keyboard Navigation
                    </label>
                    <p className="text-gray-400 text-sm">
                      Improved keyboard shortcuts and navigation
                    </p>
                  </div>
                  <button
                    id="keyboard-nav"
                    onClick={() => handlePreferenceChange('keyboardNavigation', !preferences.keyboardNavigation)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      preferences.keyboardNavigation ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={preferences.keyboardNavigation}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.keyboardNavigation ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Cognitive Settings */}
            {activeTab === 'cognitive' && (
              <div id="panel-cognitive" role="tabpanel" aria-labelledby="tab-cognitive" className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">Cognitive Accessibility</h3>

                {/* Cognitive Assistance */}
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="cognitive-assist" className="text-white font-medium">
                      Cognitive Assistance
                    </label>
                    <p className="text-gray-400 text-sm">
                      Simplified layouts and clearer visual hierarchy
                    </p>
                  </div>
                  <button
                    id="cognitive-assist"
                    onClick={() => handlePreferenceChange('cognitiveAssist', !preferences.cognitiveAssist)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      preferences.cognitiveAssist ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={preferences.cognitiveAssist}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.cognitiveAssist ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Focus Indicators */}
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="focus-indicators" className="text-white font-medium">
                      Enhanced Focus Indicators
                    </label>
                    <p className="text-gray-400 text-sm">
                      More visible focus outlines and indicators
                    </p>
                  </div>
                  <button
                    id="focus-indicators"
                    onClick={() => handlePreferenceChange('focusIndicators', !preferences.focusIndicators)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      preferences.focusIndicators ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={preferences.focusIndicators}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.focusIndicators ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Keyboard Shortcuts */}
                <div>
                  <h4 className="text-white font-medium mb-2">Keyboard Shortcuts</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(keyboardShortcuts).map(([key, shortcut]) => (
                      <div key={key} className="flex justify-between text-gray-300">
                        <span>{shortcut.description}</span>
                        <code className="bg-gray-700 px-2 py-1 rounded">{shortcut.key}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-700 bg-gray-800/50">
            <div className="text-sm text-gray-400">
              Settings are automatically saved
            </div>
            <div className="space-x-3">
              <button
                onClick={() => {
                  // Reset to defaults
                  Object.entries({
                    highContrast: false,
                    largeText: false,
                    reducedMotion: false,
                    screenReader: false,
                    keyboardNavigation: false,
                    voiceControl: false,
                    fontSize: 16,
                    colorTheme: 'auto' as const,
                    audioDescriptions: false,
                    captionsEnabled: false,
                    focusIndicators: true,
                    motorAssist: false,
                    cognitiveAssist: false
                  }).forEach(([key, value]) => {
                    updatePreference(key as any, value);
                  });
                  announceMessage('Settings reset to defaults');
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Reset to Defaults
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilitySettings;