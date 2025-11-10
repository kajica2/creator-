/**
 * Cognitive accessibility components for clear navigation and simplified interactions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../hooks/useAccessibility';
import { ARIA_ROLES } from '../utils/accessibility';

// Help and Guidance Component
export interface HelpGuidanceProps {
  isOpen: boolean;
  onClose: () => void;
  contextualHelp?: {
    title: string;
    content: string;
    steps?: string[];
  };
}

export const HelpGuidance: React.FC<HelpGuidanceProps> = ({
  isOpen,
  onClose,
  contextualHelp
}) => {
  const { announceMessage } = useAccessibility();

  useEffect(() => {
    if (isOpen) {
      announceMessage('Help dialog opened');
    }
  }, [isOpen, announceMessage]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
    >
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-gray-800 rounded-xl shadow-xl border border-gray-700">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 id="help-title" className="text-xl font-bold text-white">
              {contextualHelp?.title || 'Help & Guidance'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-md p-1"
              aria-label="Close help dialog"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {contextualHelp ? (
              <div>
                <p className="text-gray-300 mb-4">{contextualHelp.content}</p>

                {contextualHelp.steps && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">Step-by-step guide:</h3>
                    <ol className="space-y-2">
                      {contextualHelp.steps.map((step, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white text-sm rounded-full flex items-center justify-center font-medium">
                            {index + 1}
                          </span>
                          <span className="text-gray-300">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <section>
                  <h3 className="text-white font-semibold mb-2">Getting Started</h3>
                  <p className="text-gray-300">
                    Welcome to KaiDjuric AI Tools! This application helps you generate content
                    using AI technologies. Navigate using the sidebar menu or keyboard shortcuts.
                  </p>
                </section>

                <section>
                  <h3 className="text-white font-semibold mb-2">Keyboard Shortcuts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Open menu</span>
                        <code className="bg-gray-700 px-2 py-1 rounded text-sm">Alt+M</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Open help</span>
                        <code className="bg-gray-700 px-2 py-1 rounded text-sm">Alt+H</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Settings</span>
                        <code className="bg-gray-700 px-2 py-1 rounded text-sm">Alt+S</code>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-white font-semibold mb-2">Accessibility Features</h3>
                  <p className="text-gray-300">
                    This app includes comprehensive accessibility features including screen reader support,
                    keyboard navigation, high contrast mode, and voice control. Access settings with Alt+S.
                  </p>
                </section>
              </div>
            )}
          </div>

          <div className="flex justify-end p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Progress Indicator Component
export interface ProgressIndicatorProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    completed?: boolean;
  }>;
  currentStep: string;
  onStepClick?: (stepId: string) => void;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  onStepClick
}) => {
  const { announceMessage } = useAccessibility();
  const currentIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  useEffect(() => {
    const current = steps.find(step => step.id === currentStep);
    if (current) {
      announceMessage(`Step ${currentIndex + 1} of ${steps.length}: ${current.title}`);
    }
  }, [currentStep, currentIndex, steps, announceMessage]);

  return (
    <div
      className="bg-gray-800 rounded-lg p-4 space-y-4"
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuetext={`Step ${currentIndex + 1} of ${steps.length}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Progress</h3>
        <span className="text-sm text-gray-400">
          {currentIndex + 1} of {steps.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps List */}
      <ol className="space-y-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.completed || index < currentIndex;
          const isClickable = onStepClick && (isCompleted || isActive);

          return (
            <li key={step.id}>
              <div
                className={`flex items-center space-x-3 p-2 rounded-md transition-colors ${
                  isClickable ? 'cursor-pointer hover:bg-gray-700' : ''
                } ${isActive ? 'bg-purple-500/20 border border-purple-500' : ''}`}
                onClick={() => isClickable && onStepClick(step.id)}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onStepClick(step.id);
                  }
                }}
                aria-current={isActive ? 'step' : undefined}
              >
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isActive
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-sm font-medium ${
                      isActive ? 'text-white' : isCompleted ? 'text-green-300' : 'text-gray-300'
                    }`}
                  >
                    {step.title}
                  </h4>
                  {step.description && (
                    <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

// Clear Button Component
export interface ClearButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  className?: string;
}

export const ClearButton: React.FC<ClearButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  onClick,
  disabled = false,
  loading = false,
  ariaLabel,
  className = ''
}) => {
  const { announceMessage } = useAccessibility();

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900';

  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500 disabled:bg-gray-600',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500 disabled:bg-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-gray-600'
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm min-h-[32px]',
    medium: 'px-4 py-2 text-sm min-h-[40px]',
    large: 'px-6 py-3 text-base min-h-[48px]'
  };

  const handleClick = useCallback(() => {
    if (!disabled && !loading && onClick) {
      onClick();
      if (ariaLabel) {
        announceMessage(`${ariaLabel} activated`);
      }
    }
  }, [disabled, loading, onClick, ariaLabel, announceMessage]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled || loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Tooltip Component
export interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isKeyboardFocus, setIsKeyboardFocus] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = useCallback(() => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  }, [disabled]);

  const hideTooltip = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  }, [disabled]);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {React.cloneElement(children, {
        onFocus: (e: React.FocusEvent) => {
          children.props.onFocus?.(e);
          setIsKeyboardFocus(true);
          showTooltip();
        },
        onBlur: (e: React.FocusEvent) => {
          children.props.onBlur?.(e);
          setIsKeyboardFocus(false);
          hideTooltip();
        },
        'aria-describedby': isVisible ? 'tooltip' : undefined
      })}

      {isVisible && (
        <div
          id="tooltip"
          role="tooltip"
          className={`absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap pointer-events-none ${positionClasses[position]} ${
            isKeyboardFocus ? 'ring-2 ring-purple-500' : ''
          }`}
          style={{
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {content}
          <div
            className={`absolute w-0 h-0 border-solid ${
              position === 'top'
                ? 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent border-t-4 border-l-4 border-r-4'
                : position === 'bottom'
                ? 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent border-b-4 border-l-4 border-r-4'
                : position === 'left'
                ? 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900 border-t-transparent border-b-transparent border-r-transparent border-l-4 border-t-4 border-b-4'
                : 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent border-r-4 border-t-4 border-b-4'
            }`}
          />
        </div>
      )}
    </div>
  );
};

// Breadcrumb Navigation
export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const { announceMessage } = useAccessibility();

  return (
    <nav
      className={`flex ${className}`}
      aria-label="Breadcrumb"
      role="navigation"
    >
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isClickable = item.href || item.onClick;

          return (
            <li key={item.id} className="flex items-center">
              {index > 0 && (
                <svg
                  className="w-4 h-4 mx-2 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}

              {isClickable && !isLast ? (
                <a
                  href={item.href}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                      announceMessage(`Navigated to ${item.label}`);
                    }
                  }}
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={isLast ? 'text-white font-medium' : 'text-gray-400'}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default {
  HelpGuidance,
  ProgressIndicator,
  ClearButton,
  Tooltip,
  Breadcrumb
};