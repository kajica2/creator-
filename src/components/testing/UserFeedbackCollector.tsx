import React, { useState, useCallback } from 'react';
import { TestSuite } from './UXTestSuite';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface UserFeedback {
  id: string;
  timestamp: number;
  email: string;
  rating: number;
  category: 'bug' | 'feature' | 'performance' | 'usability' | 'accessibility' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo: {
    userAgent: string;
    viewport: string;
    url: string;
  };
  attachedTests?: string[];
  deviceInfo?: any;
}

interface UserFeedbackCollectorProps {
  testResults: TestSuite[];
  onClose: () => void;
  onFeedbackSubmit: (feedback: UserFeedback) => void;
}

export const UserFeedbackCollector: React.FC<UserFeedbackCollectorProps> = ({
  testResults,
  onClose,
  onFeedbackSubmit
}) => {
  const { announce } = useAccessibility();
  const [formData, setFormData] = useState({
    email: '',
    rating: 5,
    category: 'general' as const,
    priority: 'medium' as const,
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: ''
  });

  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get browser and device info
  const getBrowserInfo = useCallback(() => {
    return {
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href
    };
  }, []);

  const getDeviceInfo = useCallback(() => {
    return {
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      touchPoints: navigator.maxTouchPoints || 0,
      memory: (navigator as any).deviceMemory || 'unknown',
      connection: (navigator as any).connection || {},
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth
      },
      timestamp: Date.now()
    };
  }, []);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleTestSelection = useCallback((testId: string) => {
    setSelectedTests(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  }, []);

  const validateForm = useCallback(() => {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push('Title is required');
    }

    if (!formData.description.trim()) {
      errors.push('Description is required');
    }

    if (formData.category === 'bug' && !formData.stepsToReproduce.trim()) {
      errors.push('Steps to reproduce are required for bug reports');
    }

    if (!formData.email.trim()) {
      errors.push('Email is required for follow-up');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.push('Please enter a valid email address');
      }
    }

    return errors;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      announce(`Form validation failed: ${errors.join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const feedback: UserFeedback = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...formData,
        browserInfo: getBrowserInfo(),
        deviceInfo: getDeviceInfo(),
        attachedTests: selectedTests
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      onFeedbackSubmit(feedback);
      announce('Feedback submitted successfully. Thank you!');

      // Reset form
      setFormData({
        email: '',
        rating: 5,
        category: 'general',
        priority: 'medium',
        title: '',
        description: '',
        stepsToReproduce: '',
        expectedBehavior: '',
        actualBehavior: ''
      });
      setSelectedTests([]);

    } catch (error) {
      announce('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedTests, validateForm, getBrowserInfo, getDeviceInfo, onFeedbackSubmit, announce]);

  // Auto-fill based on failed tests
  const suggestFeedbackFromFailedTests = useCallback(() => {
    const failedTests = testResults.flatMap(suite =>
      suite.tests.filter(test => test.status === 'failed')
    );

    if (failedTests.length > 0) {
      const firstFailed = failedTests[0];
      setFormData(prev => ({
        ...prev,
        category: 'bug',
        title: `Issue with ${firstFailed.testName}`,
        description: firstFailed.details,
        priority: 'high'
      }));

      setSelectedTests([firstFailed.id]);
      announce('Pre-filled form with failed test information');
    }
  }, [testResults, announce]);

  // Quick feedback templates
  const feedbackTemplates = [
    {
      name: 'Bug Report',
      data: {
        category: 'bug' as const,
        priority: 'high' as const,
        title: 'Found a bug in...',
        description: 'I encountered an issue when...'
      }
    },
    {
      name: 'Feature Request',
      data: {
        category: 'feature' as const,
        priority: 'medium' as const,
        title: 'Feature request: ',
        description: 'It would be helpful if...'
      }
    },
    {
      name: 'Performance Issue',
      data: {
        category: 'performance' as const,
        priority: 'medium' as const,
        title: 'Performance problem with...',
        description: 'The app feels slow when...'
      }
    },
    {
      name: 'Accessibility Issue',
      data: {
        category: 'accessibility' as const,
        priority: 'high' as const,
        title: 'Accessibility barrier in...',
        description: 'I cannot access... using...'
      }
    }
  ];

  const applyTemplate = useCallback((template: typeof feedbackTemplates[0]) => {
    setFormData(prev => ({ ...prev, ...template.data }));
    announce(`Applied ${template.name} template`);
  }, [announce]);

  const failedTestsCount = testResults.reduce((acc, suite) => acc + suite.failedTests, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">User Feedback</h2>
            <p className="text-gray-300">Help us improve the user experience</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 text-white"
            aria-label="Close feedback form"
          >
            Close
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Quick Actions */}
          <div className="mb-6 space-y-4">
            {failedTestsCount > 0 && (
              <div className="bg-red-900/30 border border-red-500 p-4 rounded-lg">
                <h3 className="font-medium text-red-300 mb-2">
                  Found {failedTestsCount} Failed Tests
                </h3>
                <p className="text-red-200 text-sm mb-3">
                  Would you like to report issues based on the failed tests?
                </p>
                <button
                  onClick={suggestFeedbackFromFailedTests}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                  aria-label="Auto-fill feedback from failed tests"
                >
                  Auto-fill from Failed Tests
                </button>
              </div>
            )}

            {/* Quick Templates */}
            <div>
              <h3 className="font-medium text-white mb-3">Quick Templates</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {feedbackTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => applyTemplate(template)}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    aria-label={`Apply ${template.name} template`}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email (for follow-up)
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-300 mb-2">
                  Overall Rating
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleInputChange('rating', star)}
                      className={`text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${
                        star <= formData.rating ? 'text-yellow-400' : 'text-gray-600'
                      }`}
                      aria-label={`Rate ${star} stars`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-gray-300">({formData.rating}/5)</span>
                </div>
              </div>
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="performance">Performance Issue</option>
                  <option value="usability">Usability Problem</option>
                  <option value="accessibility">Accessibility Issue</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Title and Description */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the issue or suggestion"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed description of your feedback"
                required
              />
            </div>

            {/* Advanced Fields */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label="Toggle advanced options"
              >
                <span>Advanced Options</span>
                <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 p-4 bg-gray-800 rounded-lg">
                  {formData.category === 'bug' && (
                    <>
                      <div>
                        <label htmlFor="stepsToReproduce" className="block text-sm font-medium text-gray-300 mb-2">
                          Steps to Reproduce
                        </label>
                        <textarea
                          id="stepsToReproduce"
                          value={formData.stepsToReproduce}
                          onChange={(e) => handleInputChange('stepsToReproduce', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="1. Click on...&#10;2. Enter...&#10;3. Notice..."
                        />
                      </div>

                      <div>
                        <label htmlFor="expectedBehavior" className="block text-sm font-medium text-gray-300 mb-2">
                          Expected Behavior
                        </label>
                        <textarea
                          id="expectedBehavior"
                          value={formData.expectedBehavior}
                          onChange={(e) => handleInputChange('expectedBehavior', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="What should have happened?"
                        />
                      </div>

                      <div>
                        <label htmlFor="actualBehavior" className="block text-sm font-medium text-gray-300 mb-2">
                          Actual Behavior
                        </label>
                        <textarea
                          id="actualBehavior"
                          value={formData.actualBehavior}
                          onChange={(e) => handleInputChange('actualBehavior', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="What actually happened?"
                        />
                      </div>
                    </>
                  )}

                  {/* Test Results Selection */}
                  {testResults.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        Related Test Results (optional)
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {testResults.flatMap(suite =>
                          suite.tests.map(test => (
                            <label key={test.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedTests.includes(test.id)}
                                onChange={() => handleTestSelection(test.id)}
                                className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                              />
                              <span className={`text-sm ${
                                test.status === 'passed' ? 'text-green-400' :
                                test.status === 'failed' ? 'text-red-400' :
                                'text-yellow-400'
                              }`}>
                                {test.testName} ({test.status})
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 text-white"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-white flex items-center space-x-2"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                )}
                <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            </div>
          </form>

          {/* Privacy Note */}
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-300 mb-2">Privacy Note</h4>
            <p className="text-gray-400 text-sm">
              Your feedback helps us improve the application. We collect browser and device information
              to help diagnose technical issues. Personal information is only used for follow-up communication
              and is not shared with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};