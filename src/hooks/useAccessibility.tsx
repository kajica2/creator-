/**
 * Comprehensive accessibility hooks for managing accessibility features
 */

import { useState, useEffect, useCallback, useRef, useContext, createContext, ReactNode } from 'react';
import { announceToScreenReader, focusManagement, KEYBOARD_KEYS, motionPreferences } from '../utils/accessibility';

// Accessibility preferences interface
export interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  voiceControl: boolean;
  fontSize: number; // 12-24px range
  colorTheme: 'light' | 'dark' | 'auto';
  audioDescriptions: boolean;
  captionsEnabled: boolean;
  focusIndicators: boolean;
  motorAssist: boolean;
  cognitiveAssist: boolean;
}

// Default accessibility preferences
const defaultPreferences: AccessibilityPreferences = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReader: false,
  keyboardNavigation: false,
  voiceControl: false,
  fontSize: 16,
  colorTheme: 'auto',
  audioDescriptions: false,
  captionsEnabled: false,
  focusIndicators: true,
  motorAssist: false,
  cognitiveAssist: false
};

// Accessibility context
interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void;
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  isScreenReaderActive: boolean;
  focusTrap: (element: HTMLElement) => () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

// Accessibility provider component
export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    try {
      const saved = localStorage.getItem('accessibilityPreferences');
      return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
    } catch {
      return defaultPreferences;
    }
  });

  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  // Detect if screen reader is active
  useEffect(() => {
    const testElement = document.createElement('div');
    testElement.setAttribute('aria-hidden', 'true');
    testElement.style.position = 'absolute';
    testElement.style.left = '-10000px';
    testElement.textContent = 'Screen reader test';
    document.body.appendChild(testElement);

    const timer = setTimeout(() => {
      setIsScreenReaderActive(testElement.offsetHeight > 0);
      document.body.removeChild(testElement);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (document.body.contains(testElement)) {
        document.body.removeChild(testElement);
      }
    };
  }, []);

  // Auto-detect system preferences
  useEffect(() => {
    const mediaQueries = [
      { query: '(prefers-reduced-motion: reduce)', key: 'reducedMotion' as const },
      { query: '(prefers-contrast: high)', key: 'highContrast' as const },
      { query: '(prefers-color-scheme: dark)', key: 'colorTheme' as const }
    ];

    const listeners: (() => void)[] = [];

    mediaQueries.forEach(({ query, key }) => {
      const mql = window.matchMedia(query);
      const handler = () => {
        if (key === 'colorTheme') {
          if (preferences.colorTheme === 'auto') {
            setPreferences(prev => ({
              ...prev,
              [key]: mql.matches ? 'dark' : 'light'
            }));
          }
        } else {
          setPreferences(prev => ({
            ...prev,
            [key]: mql.matches
          }));
        }
      };

      mql.addListener(handler);
      handler(); // Call initially
      listeners.push(() => mql.removeListener(handler));
    });

    return () => listeners.forEach(cleanup => cleanup());
  }, [preferences.colorTheme]);

  // Save preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('accessibilityPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error);
    }
  }, [preferences]);

  const updatePreference = useCallback(<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const announceMessage = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  }, []);

  const focusTrap = useCallback((element: HTMLElement) => {
    return focusManagement.trapFocus(element);
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        preferences,
        updatePreference,
        announceMessage,
        isScreenReaderActive,
        focusTrap
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (
  onEnter?: () => void,
  onSpace?: () => void,
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void,
  onEscape?: () => void
) => {
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case KEYBOARD_KEYS.ENTER:
        if (onEnter) {
          event.preventDefault();
          onEnter();
        }
        break;
      case KEYBOARD_KEYS.SPACE:
        if (onSpace) {
          event.preventDefault();
          onSpace();
        }
        break;
      case KEYBOARD_KEYS.ARROW_UP:
        if (onArrowKeys) {
          event.preventDefault();
          onArrowKeys('up');
        }
        break;
      case KEYBOARD_KEYS.ARROW_DOWN:
        if (onArrowKeys) {
          event.preventDefault();
          onArrowKeys('down');
        }
        break;
      case KEYBOARD_KEYS.ARROW_LEFT:
        if (onArrowKeys) {
          event.preventDefault();
          onArrowKeys('left');
        }
        break;
      case KEYBOARD_KEYS.ARROW_RIGHT:
        if (onArrowKeys) {
          event.preventDefault();
          onArrowKeys('right');
        }
        break;
      case KEYBOARD_KEYS.ESCAPE:
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;
    }
  }, [onEnter, onSpace, onArrowKeys, onEscape]);

  return { handleKeyDown };
};

// Hook for focus management
export const useFocusManagement = () => {
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    lastFocusedElementRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (lastFocusedElementRef.current) {
      focusManagement.restoreFocus(lastFocusedElementRef.current);
    }
  }, []);

  const moveFocusTo = useCallback((selector: string, container?: HTMLElement) => {
    return focusManagement.moveFocusTo(selector, container);
  }, []);

  return {
    saveFocus,
    restoreFocus,
    moveFocusTo,
    lastFocusedElement: lastFocusedElementRef.current
  };
};

// Hook for live regions (screen reader announcements)
export const useLiveRegion = () => {
  const [liveMessages, setLiveMessages] = useState<{
    polite: string;
    assertive: string;
  }>({ polite: '', assertive: '' });

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setLiveMessages(prev => ({
      ...prev,
      [priority]: message
    }));

    // Clear the message after announcement
    setTimeout(() => {
      setLiveMessages(prev => ({
        ...prev,
        [priority]: ''
      }));
    }, 1000);
  }, []);

  const LiveRegion = useCallback(() => (
    <>
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessages.polite}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessages.assertive}
      </div>
    </>
  ), [liveMessages]);

  return { announce, LiveRegion };
};

// Hook for voice control
export const useVoiceControl = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { announceMessage } = useAccessibility();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
    }
  }, []);

  const startListening = useCallback((commands: Record<string, () => void>) => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onresult = (event: any) => {
      const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();

      Object.entries(commands).forEach(([phrase, action]) => {
        if (command.includes(phrase.toLowerCase())) {
          action();
          announceMessage(`Voice command recognized: ${phrase}`);
        }
      });
    };

    recognitionRef.current.onerror = (event: any) => {
      console.warn('Voice recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
    setIsListening(true);
    announceMessage('Voice control activated');
  }, [announceMessage]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      announceMessage('Voice control deactivated');
    }
  }, [announceMessage]);

  return {
    isSupported,
    isListening,
    startListening,
    stopListening
  };
};

// Hook for reduced motion animations
export const useReducedMotion = () => {
  const { preferences } = useAccessibility();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches || preferences.reducedMotion);

    const handler = () => setPrefersReducedMotion(mediaQuery.matches || preferences.reducedMotion);
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [preferences.reducedMotion]);

  const createAnimation = useCallback((
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions
  ) => {
    return motionPreferences.createSafeAnimation(element, keyframes, options);
  }, []);

  return {
    prefersReducedMotion,
    createAnimation,
    shouldAnimate: !prefersReducedMotion
  };
};

// Hook for accessible form validation
export const useAccessibleForm = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { announceMessage } = useAccessibility();

  const validateField = useCallback((name: string, value: string, validator: (value: string) => string | null) => {
    const error = validator(value);
    setErrors(prev => ({
      ...prev,
      [name]: error || ''
    }));

    if (error) {
      announceMessage(`Validation error for ${name}: ${error}`, 'assertive');
    }

    return !error;
  }, [announceMessage]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const getFieldProps = useCallback((name: string) => ({
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${name}-error` : undefined
  }), [errors]);

  return {
    errors,
    validateField,
    clearErrors,
    getFieldProps,
    hasErrors: Object.keys(errors).some(key => errors[key])
  };
};

export default {
  useAccessibility,
  useKeyboardNavigation,
  useFocusManagement,
  useLiveRegion,
  useVoiceControl,
  useReducedMotion,
  useAccessibleForm,
  AccessibilityProvider
};