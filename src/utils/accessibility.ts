/**
 * Accessibility utilities and constants for WCAG 2.1 AA compliance
 */

// ARIA roles and properties
export const ARIA_ROLES = {
  MAIN: 'main',
  NAVIGATION: 'navigation',
  BANNER: 'banner',
  CONTENTINFO: 'contentinfo',
  COMPLEMENTARY: 'complementary',
  REGION: 'region',
  SEARCH: 'search',
  DIALOG: 'dialog',
  TABLIST: 'tablist',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  BUTTON: 'button',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  LISTBOX: 'listbox',
  OPTION: 'option',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  ALERT: 'alert',
  STATUS: 'status',
  LOG: 'log',
  MARQUEE: 'marquee',
  TIMER: 'timer',
  PROGRESSBAR: 'progressbar'
} as const;

export const ARIA_STATES = {
  EXPANDED: 'aria-expanded',
  SELECTED: 'aria-selected',
  CHECKED: 'aria-checked',
  PRESSED: 'aria-pressed',
  DISABLED: 'aria-disabled',
  HIDDEN: 'aria-hidden',
  CURRENT: 'aria-current',
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic',
  RELEVANT: 'aria-relevant',
  BUSY: 'aria-busy'
} as const;

export const ARIA_PROPERTIES = {
  LABEL: 'aria-label',
  LABELLEDBY: 'aria-labelledby',
  DESCRIBEDBY: 'aria-describedby',
  CONTROLS: 'aria-controls',
  OWNS: 'aria-owns',
  ACTIVEDESCENDANT: 'aria-activedescendant',
  HASPOPUP: 'aria-haspopup',
  LEVEL: 'aria-level',
  POSINSET: 'aria-posinset',
  SETSIZE: 'aria-setsize',
  ROWCOUNT: 'aria-rowcount',
  COLCOUNT: 'aria-colcount',
  ROWSPAN: 'aria-rowspan',
  COLSPAN: 'aria-colspan'
} as const;

// Keyboard navigation constants
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace'
} as const;

// Focus management utilities
export const focusManagement = {
  trapFocus: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === KEYBOARD_KEYS.TAB) {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    return () => element.removeEventListener('keydown', handleTabKey);
  },

  restoreFocus: (elementToFocus?: HTMLElement | null) => {
    setTimeout(() => {
      if (elementToFocus && elementToFocus.focus) {
        elementToFocus.focus();
      } else {
        const focusTarget = document.querySelector('[data-restore-focus="true"]') as HTMLElement;
        if (focusTarget) {
          focusTarget.focus();
        }
      }
    }, 0);
  },

  moveFocusTo: (selector: string, container?: HTMLElement) => {
    const target = (container || document).querySelector(selector) as HTMLElement;
    if (target) {
      target.focus();
      return true;
    }
    return false;
  }
};

// Screen reader announcements
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  document.body.appendChild(announcer);

  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
};

// Color contrast utilities
export const colorContrast = {
  // Calculate relative luminance
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio between two colors
  getContrastRatio: (color1: string, color2: string): number => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb1 || !rgb2) return 1;

    const l1 = colorContrast.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = colorContrast.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  },

  // Check if contrast meets WCAG AA standards
  meetsWCAGAA: (foreground: string, background: string, isLargeText: boolean = false): boolean => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  },

  // Check if contrast meets WCAG AAA standards
  meetsWCAGAAA: (foreground: string, background: string, isLargeText: boolean = false): boolean => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
};

// Text alternatives for complex elements
export const textAlternatives = {
  hashtagCloud: (hashtags: string[], totalCount: number) =>
    `Interactive hashtag cloud with ${totalCount} hashtags: ${hashtags.slice(0, 5).join(', ')}${hashtags.length > 5 ? ` and ${hashtags.length - 5} others` : ''}. Use arrow keys to navigate.`,

  generateButton: (isLoading: boolean, creditCost: number) =>
    isLoading ? 'Generating content, please wait' : `Generate content (costs ${creditCost} credit${creditCost === 1 ? '' : 's'})`,

  imageGallery: (imageCount: number) =>
    `Image gallery with ${imageCount} images. Use arrow keys or tab to navigate.`,

  audioPlayer: (isPlaying: boolean, duration?: number) =>
    `Audio player ${isPlaying ? 'playing' : 'paused'}${duration ? `, duration ${Math.round(duration)} seconds` : ''}`,

  progressIndicator: (progress: number, total: number) =>
    `Progress: ${progress} of ${total} steps completed`
};

// Keyboard shortcuts
export const keyboardShortcuts = {
  SKIP_TO_MAIN: { key: 'Enter', description: 'Skip to main content' },
  OPEN_MENU: { key: 'Alt+M', description: 'Open navigation menu' },
  SEARCH: { key: 'Alt+S', description: 'Focus search input' },
  SETTINGS: { key: 'Alt+,', description: 'Open accessibility settings' },
  HELP: { key: 'Alt+H', description: 'Open help dialog' },
  TOGGLE_HIGH_CONTRAST: { key: 'Alt+C', description: 'Toggle high contrast mode' },
  INCREASE_FONT_SIZE: { key: 'Alt+=', description: 'Increase font size' },
  DECREASE_FONT_SIZE: { key: 'Alt+-', description: 'Decrease font size' },
  TOGGLE_MOTION: { key: 'Alt+R', description: 'Toggle reduced motion' }
};

// Motor accessibility helpers
export const motorAccessibility = {
  enlargeClickTargets: (minSize: number = 44) => `
    .motor-accessible-target {
      min-width: ${minSize}px;
      min-height: ${minSize}px;
      padding: 8px;
    }
  `,

  reduceMotionSensitivity: () => `
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `,

  addHoverStates: () => `
    .hover-target:hover,
    .hover-target:focus {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
    }
  `
};

// Voice control integration
export const voiceControl = {
  commands: {
    NAVIGATE_MAIN: 'go to main',
    OPEN_MENU: 'open menu',
    SELECT_HASHTAG: 'select hashtag',
    GENERATE_CONTENT: 'generate',
    CLEAR_SELECTION: 'clear all',
    SAVE_CONTENT: 'save',
    PLAY_AUDIO: 'play',
    PAUSE_AUDIO: 'pause',
    INCREASE_VOLUME: 'volume up',
    DECREASE_VOLUME: 'volume down'
  },

  setupVoiceRecognition: () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      return recognition;
    }
    return null;
  }
};

// High contrast color schemes
export const highContrastColors = {
  light: {
    background: '#ffffff',
    surface: '#f8f9fa',
    primary: '#000000',
    secondary: '#666666',
    accent: '#0066cc',
    success: '#006600',
    warning: '#cc6600',
    error: '#cc0000',
    text: '#000000',
    textSecondary: '#333333',
    border: '#000000',
    focus: '#0066cc'
  },
  dark: {
    background: '#000000',
    surface: '#1a1a1a',
    primary: '#ffffff',
    secondary: '#cccccc',
    accent: '#66b3ff',
    success: '#66ff66',
    warning: '#ffcc66',
    error: '#ff6666',
    text: '#ffffff',
    textSecondary: '#cccccc',
    border: '#ffffff',
    focus: '#66b3ff'
  }
};

// Accessibility testing utilities
export const accessibilityTesting = {
  checkFocusable: (element: HTMLElement) => {
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return element.matches(focusableSelector) || element.querySelector(focusableSelector) !== null;
  },

  checkAriaLabels: (element: HTMLElement) => {
    const hasLabel = element.hasAttribute('aria-label') ||
                    element.hasAttribute('aria-labelledby') ||
                    element.querySelector('label') !== null;
    return hasLabel;
  },

  checkColorContrast: (element: HTMLElement) => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    // Implementation would need a more sophisticated color parsing
    return { color, backgroundColor, needsCheck: true };
  },

  generateAccessibilityReport: (rootElement: HTMLElement = document.body) => {
    const issues: string[] = [];
    const elements = rootElement.querySelectorAll('*');

    elements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;

      // Check for missing alt text on images
      if (element.tagName === 'IMG' && !element.hasAttribute('alt')) {
        issues.push(`Image ${index} missing alt text`);
      }

      // Check for missing labels on form elements
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
        if (!accessibilityTesting.checkAriaLabels(htmlElement)) {
          issues.push(`Form element ${index} missing accessible label`);
        }
      }

      // Check for interactive elements without keyboard access
      if (element.hasAttribute('onclick') && !accessibilityTesting.checkFocusable(htmlElement)) {
        issues.push(`Interactive element ${index} not keyboard accessible`);
      }
    });

    return {
      totalElements: elements.length,
      issuesFound: issues.length,
      issues,
      score: Math.max(0, 100 - (issues.length * 10))
    };
  }
};

// Reduced motion preferences
export const motionPreferences = {
  respectsReducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,

  createSafeAnimation: (element: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
    if (motionPreferences.respectsReducedMotion()) {
      // Reduce duration and disable complex animations
      return element.animate(keyframes, {
        ...options,
        duration: Math.min(options.duration as number || 0, 200),
        iterations: 1
      });
    }
    return element.animate(keyframes, options);
  }
};

export default {
  ARIA_ROLES,
  ARIA_STATES,
  ARIA_PROPERTIES,
  KEYBOARD_KEYS,
  focusManagement,
  announceToScreenReader,
  colorContrast,
  textAlternatives,
  keyboardShortcuts,
  motorAccessibility,
  voiceControl,
  highContrastColors,
  accessibilityTesting,
  motionPreferences
};