/**
 * Binary Ring Configuration System
 * Inspired by Hugging Face Spaces architecture for centralized configuration
 */

// Global Configuration Object (inspired by window.hubConfig)
window.binaryRingConfig = {
  // Environment Settings
  environment: 'development', // 'development' | 'production' | 'staging'
  version: '2.0.0',
  buildDate: new Date().toISOString(),

  // Feature Flags
  features: {
    neuralConnections: true,
    communityVoting: true,
    storeIntegration: true,
    analyticsTracking: true,
    darkMode: true,
    experimentalFeatures: false,
    webglSupport: true,
    audioReactivity: true,
    exportTools: true,
    collaborativeEditing: false
  },

  // Theme Management (inspired by Hugging Face theme system)
  theme: {
    defaultTheme: 'auto', // 'light' | 'dark' | 'auto'
    cookieName: 'binary-ring-theme',
    cookieExpiry: 365, // days
    enableSystemDetection: true,
    enableColorSchemeQuery: true
  },

  // API Configuration
  api: {
    supabase: {
      url: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
      anonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key'
    },
    neural: {
      endpoint: '/api/neural',
      timeout: 30000,
      batchSize: 50
    },
    store: {
      stripe: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_...',
        currency: 'usd'
      },
      paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID || 'your-paypal-client-id'
      }
    }
  },

  // Analytics (lightweight approach inspired by Plausible)
  analytics: {
    enabled: true,
    provider: 'plausible', // 'plausible' | 'google' | 'custom'
    domain: 'binaryring.art',
    trackOutboundLinks: true,
    trackFileDownloads: true,
    trackPageViews: true,
    respectDNT: true, // Do Not Track
    goals: {
      projectView: 'Project View',
      storeCheckout: 'Store Checkout',
      neuralConnection: 'Neural Connection',
      communityVote: 'Community Vote',
      contentExport: 'Content Export'
    }
  },

  // Project Categories and Metadata
  projects: {
    categories: {
      fractals: { name: 'Fractals', color: '#ff6b6b', icon: '🌀' },
      attractors: { name: 'Attractors', color: '#4ecdc4', icon: '🌊' },
      particles: { name: 'Particles', color: '#45b7d1', icon: '✨' },
      organic: { name: 'Organic', color: '#96ceb4', icon: '🌱' },
      networks: { name: 'Networks', color: '#ffeaa7', icon: '🕸️' },
      geometric: { name: 'Geometric', color: '#dda0dd', icon: '📐' },
      space: { name: 'Space', color: '#74b9ff', icon: '🌌' },
      emotional: { name: 'Emotional', color: '#fd79a8', icon: '💫' }
    },
    defaultParams: {
      resolution: { width: 800, height: 600 },
      quality: 'medium', // 'low' | 'medium' | 'high' | 'ultra'
      frameRate: 60,
      audioReactive: false,
      exportFormat: 'png'
    }
  },

  // User Interface Settings
  ui: {
    animations: {
      enabled: true,
      duration: 300,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      respectReducedMotion: true
    },
    layout: {
      maxWidth: '1440px',
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
      }
    },
    accessibility: {
      focusVisible: true,
      highContrast: false,
      largeText: false,
      screenReaderSupport: true
    }
  },

  // Performance Settings
  performance: {
    lazyLoading: true,
    webWorkers: true,
    caching: {
      enabled: true,
      duration: 3600000, // 1 hour in ms
      storageType: 'localStorage' // 'localStorage' | 'sessionStorage'
    },
    webgl: {
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    }
  },

  // Community Features
  community: {
    voting: {
      enabled: true,
      maxVotesPerUser: 100,
      cooldownPeriod: 1000 // ms between votes
    },
    comments: {
      enabled: true,
      maxLength: 1000,
      moderationEnabled: false
    },
    sharing: {
      enabled: true,
      platforms: ['twitter', 'facebook', 'linkedin', 'reddit', 'discord']
    }
  },

  // Development Tools
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    logLevel: 'info', // 'error' | 'warn' | 'info' | 'debug'
    performanceMonitoring: true,
    errorReporting: true
  }
};

/**
 * Configuration Utility Functions
 */
class BinaryRingConfig {
  constructor() {
    this.config = window.binaryRingConfig;
    this.initialize();
  }

  initialize() {
    this.setupTheme();
    this.setupAnalytics();
    this.setupErrorReporting();
    this.validateConfiguration();
  }

  // Theme Management (inspired by Hugging Face approach)
  setupTheme() {
    const savedTheme = this.getCookie(this.config.theme.cookieName);
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    let theme = savedTheme || this.config.theme.defaultTheme;
    if (theme === 'auto') {
      theme = systemTheme;
    }

    this.applyTheme(theme);

    // Listen for system theme changes
    if (this.config.theme.enableSystemDetection) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.getTheme() === 'auto') {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.className = document.documentElement.className.replace(/theme-\w+/, `theme-${theme}`);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#ffffff');
    }
  }

  toggleTheme() {
    const currentTheme = this.getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  setTheme(theme) {
    this.setCookie(this.config.theme.cookieName, theme, this.config.theme.cookieExpiry);
    this.applyTheme(theme);
    this.trackEvent('Theme Change', { theme });
  }

  getTheme() {
    return this.getCookie(this.config.theme.cookieName) || this.config.theme.defaultTheme;
  }

  // Analytics Setup (lightweight approach)
  setupAnalytics() {
    if (!this.config.analytics.enabled) return;

    // Respect Do Not Track
    if (this.config.analytics.respectDNT && navigator.doNotTrack === '1') {
      return;
    }

    switch (this.config.analytics.provider) {
      case 'plausible':
        this.setupPlausible();
        break;
      case 'google':
        this.setupGoogleAnalytics();
        break;
      default:
        this.setupCustomAnalytics();
    }
  }

  setupPlausible() {
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = 'https://plausible.io/js/plausible.js';
    script.setAttribute('data-domain', this.config.analytics.domain);

    if (this.config.analytics.trackOutboundLinks) {
      script.setAttribute('data-plausible', 'plausible,outbound-links');
    }

    document.head.appendChild(script);
  }

  trackEvent(eventName, properties = {}) {
    if (!this.config.analytics.enabled) return;

    // Track based on provider
    switch (this.config.analytics.provider) {
      case 'plausible':
        if (window.plausible) {
          window.plausible(eventName, { props: properties });
        }
        break;
      case 'google':
        if (window.gtag) {
          window.gtag('event', eventName, properties);
        }
        break;
      default:
        console.log('Analytics Event:', eventName, properties);
    }
  }

  // Feature Flag Management
  isFeatureEnabled(feature) {
    return this.config.features[feature] === true;
  }

  enableFeature(feature) {
    this.config.features[feature] = true;
    this.saveConfig();
  }

  disableFeature(feature) {
    this.config.features[feature] = false;
    this.saveConfig();
  }

  // Configuration Validation
  validateConfiguration() {
    const required = ['environment', 'version', 'features', 'theme'];
    const missing = required.filter(key => !this.config[key]);

    if (missing.length > 0) {
      console.warn('Binary Ring Config: Missing required configuration keys:', missing);
    }

    // Validate API endpoints
    if (this.config.api.supabase.url === 'https://your-project.supabase.co') {
      console.warn('Binary Ring Config: Please update Supabase configuration');
    }
  }

  // Utility Functions
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  saveConfig() {
    if (this.config.performance.caching.enabled) {
      const storage = this.config.performance.caching.storageType === 'localStorage' ?
        localStorage : sessionStorage;
      storage.setItem('binary-ring-config', JSON.stringify(this.config));
    }
  }

  loadConfig() {
    if (this.config.performance.caching.enabled) {
      const storage = this.config.performance.caching.storageType === 'localStorage' ?
        localStorage : sessionStorage;
      const saved = storage.getItem('binary-ring-config');
      if (saved) {
        return { ...this.config, ...JSON.parse(saved) };
      }
    }
    return this.config;
  }

  // Error Reporting
  setupErrorReporting() {
    if (!this.config.debug.errorReporting) return;

    window.addEventListener('error', (event) => {
      this.reportError('JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.reportError('Unhandled Promise Rejection', {
        reason: event.reason
      });
    });
  }

  reportError(type, details) {
    if (this.config.debug.enabled) {
      console.error(`Binary Ring ${type}:`, details);
    }

    this.trackEvent('Error', { type, ...details });
  }
}

// Initialize configuration
const binaryRingConfig = new BinaryRingConfig();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BinaryRingConfig;
}

// Global utility functions
window.BinaryRing = {
  config: binaryRingConfig,
  isFeatureEnabled: (feature) => binaryRingConfig.isFeatureEnabled(feature),
  trackEvent: (event, props) => binaryRingConfig.trackEvent(event, props),
  toggleTheme: () => binaryRingConfig.toggleTheme(),
  getTheme: () => binaryRingConfig.getTheme(),
  setTheme: (theme) => binaryRingConfig.setTheme(theme)
};