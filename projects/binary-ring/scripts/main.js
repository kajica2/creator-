/**
 * Binary Ring - Main Site Interactions
 * Handles navigation, theme toggle, hero animations, and core functionality
 */

class BinaryRingCore {
    constructor() {
        this.isInitialized = false;
        this.theme = localStorage.getItem('br-theme') || 'light';
        this.animations = new Map();
        this.observers = new Map();
        this.perfMetrics = {
            navigationStart: performance.now(),
            firstPaint: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0
        };

        this.init();
    }

    async init() {
        try {
            // Initialize core systems
            await this.initTheme();
            await this.initNavigation();
            await this.initAnimations();
            await this.initPerformanceMonitoring();
            await this.initAccessibility();
            await this.initAnalytics();

            this.isInitialized = true;
            this.emit('core:initialized');
            console.log('Binary Ring Core initialized successfully');
        } catch (error) {
            console.error('Binary Ring Core initialization failed:', error);
            this.handleError(error);
        }
    }

    // Theme Management
    async initTheme() {
        const themeToggle = document.querySelector('[data-theme-toggle]');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

        // Apply initial theme
        this.applyTheme(this.theme);

        // Theme toggle handler
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
            themeToggle.setAttribute('aria-label', `Switch to ${this.theme === 'light' ? 'dark' : 'light'} mode`);
        }

        // Listen for system theme changes
        prefersDark.addEventListener('change', (e) => {
            if (!localStorage.getItem('br-theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.setProperty('color-scheme', theme);

        // Update meta theme-color for mobile browsers
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#f8f8f8');
        }
    }

    toggleTheme() {
        this.setTheme(this.theme === 'light' ? 'dark' : 'light');
    }

    setTheme(theme) {
        this.theme = theme;
        localStorage.setItem('br-theme', theme);
        this.applyTheme(theme);
        this.emit('theme:changed', { theme });

        // Update toggle button aria-label
        const toggle = document.querySelector('[data-theme-toggle]');
        if (toggle) {
            toggle.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`);
        }
    }

    // Navigation Management
    async initNavigation() {
        const nav = document.querySelector('[data-nav]');
        const mobileToggle = document.querySelector('[data-nav-toggle]');
        const navLinks = document.querySelectorAll('[data-nav-link]');

        if (!nav) return;

        // Mobile navigation toggle
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => this.toggleMobileNav());
        }

        // Enhanced navigation with smooth scrolling
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });

        // Auto-hide nav on scroll (mobile)
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            if (window.innerWidth <= 768) {
                nav.style.transform = currentScrollY > lastScrollY ? 'translateY(-100%)' : 'translateY(0)';
            }
            lastScrollY = currentScrollY;
        }, { passive: true });

        // Keyboard navigation
        this.initKeyboardNavigation();
    }

    toggleMobileNav() {
        const nav = document.querySelector('[data-nav]');
        const toggle = document.querySelector('[data-nav-toggle]');

        if (nav && toggle) {
            const isOpen = nav.getAttribute('data-mobile-open') === 'true';
            nav.setAttribute('data-mobile-open', !isOpen);
            toggle.setAttribute('aria-expanded', !isOpen);

            // Prevent body scroll when nav is open
            document.body.style.overflow = isOpen ? 'auto' : 'hidden';
        }
    }

    handleNavClick(e) {
        const link = e.currentTarget;
        const href = link.getAttribute('href');

        // Handle internal anchor links with smooth scrolling
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                this.smoothScrollTo(target, { offset: -100, duration: 800 });
                this.trackEvent('navigation', 'anchor_click', href);
            }
        }

        // Close mobile nav after click
        if (window.innerWidth <= 768) {
            setTimeout(() => this.toggleMobileNav(), 150);
        }
    }

    initKeyboardNavigation() {
        // Escape to close mobile nav
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const nav = document.querySelector('[data-nav]');
                if (nav && nav.getAttribute('data-mobile-open') === 'true') {
                    this.toggleMobileNav();
                }
            }
        });

        // Tab trap for mobile nav
        this.initTabTrap('[data-nav]');
    }

    initTabTrap(selector) {
        const container = document.querySelector(selector);
        if (!container) return;

        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && container.getAttribute('data-mobile-open') === 'true') {
                const first = focusableElements[0];
                const last = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
    }

    // Animation System
    async initAnimations() {
        // Hero animations
        this.initHeroAnimations();

        // Scroll-triggered animations
        this.initScrollAnimations();

        // Loading animations
        this.initLoadingAnimations();

        // Interactive animations
        this.initInteractiveAnimations();
    }

    initHeroAnimations() {
        const hero = document.querySelector('[data-hero]');
        if (!hero) return;

        // Parallax effect for hero background
        const heroBackground = hero.querySelector('[data-hero-bg]');
        if (heroBackground) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.3;
                heroBackground.style.transform = `translate3d(0, ${rate}px, 0)`;
            }, { passive: true });
        }

        // Typewriter effect for hero text
        const heroText = hero.querySelector('[data-hero-text]');
        if (heroText) {
            this.typewriterEffect(heroText, {
                speed: 50,
                cursor: true,
                delay: 1000
            });
        }

        // Floating elements animation
        const floatingElements = hero.querySelectorAll('[data-float]');
        floatingElements.forEach((element, index) => {
            this.floatingAnimation(element, {
                duration: 3000 + (index * 500),
                amplitude: 10 + (index * 5)
            });
        });
    }

    initScrollAnimations() {
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    this.trackEvent('scroll', 'element_visible', entry.target.tagName);
                } else {
                    entry.target.classList.remove('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '-50px'
        });

        // Observe elements with animation attributes
        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });

        this.observers.set('scroll', observer);
    }

    initLoadingAnimations() {
        // Skeleton loading for dynamic content
        const skeletons = document.querySelectorAll('[data-skeleton]');
        skeletons.forEach(skeleton => {
            this.createSkeletonAnimation(skeleton);
        });

        // Progressive image loading
        this.initProgressiveImages();
    }

    initInteractiveAnimations() {
        // Ripple effect for buttons
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-ripple]');
            if (button) {
                this.createRipple(e, button);
            }
        });

        // Hover effects for project cards
        document.querySelectorAll('[data-project-card]').forEach(card => {
            card.addEventListener('mouseenter', () => this.animateCardHover(card, true));
            card.addEventListener('mouseleave', () => this.animateCardHover(card, false));
        });
    }

    // Animation Utilities
    typewriterEffect(element, options = {}) {
        const text = element.textContent;
        const speed = options.speed || 50;
        const cursor = options.cursor || false;
        const delay = options.delay || 0;

        element.textContent = '';
        if (cursor) element.classList.add('typing-cursor');

        setTimeout(() => {
            let i = 0;
            const timer = setInterval(() => {
                element.textContent = text.slice(0, i + 1);
                i++;

                if (i === text.length) {
                    clearInterval(timer);
                    if (cursor) {
                        setTimeout(() => element.classList.remove('typing-cursor'), 1000);
                    }
                }
            }, speed);
        }, delay);
    }

    floatingAnimation(element, options = {}) {
        const duration = options.duration || 3000;
        const amplitude = options.amplitude || 10;

        const animate = () => {
            element.style.animation = `float ${duration}ms ease-in-out infinite`;
            element.style.setProperty('--float-amplitude', `${amplitude}px`);
        };

        // Start animation after a random delay to stagger
        setTimeout(animate, Math.random() * 1000);
    }

    createRipple(event, element) {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: currentColor;
            border-radius: 50%;
            opacity: 0.3;
            pointer-events: none;
            transform: scale(0);
            animation: ripple-animation 600ms ease-out;
        `;

        element.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    animateCardHover(card, isHovering) {
        const image = card.querySelector('img, [data-image]');
        const content = card.querySelector('[data-content]');

        if (isHovering) {
            card.style.transform = 'translateY(-8px) scale(1.02)';
            if (image) image.style.transform = 'scale(1.1)';
            if (content) content.style.transform = 'translateY(-4px)';
        } else {
            card.style.transform = '';
            if (image) image.style.transform = '';
            if (content) content.style.transform = '';
        }
    }

    createSkeletonAnimation(element) {
        element.classList.add('skeleton-loading');

        // Add shimmer effect
        const shimmer = document.createElement('div');
        shimmer.className = 'skeleton-shimmer';
        element.appendChild(shimmer);
    }

    // Progressive Image Loading
    initProgressiveImages() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img).then(() => {
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    });
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    loadImage(img) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                img.src = image.src;
                resolve();
            };
            image.onerror = reject;
            image.src = img.getAttribute('data-src');
        });
    }

    // Performance Monitoring
    async initPerformanceMonitoring() {
        // Web Vitals
        this.measureWebVitals();

        // Custom metrics
        this.trackCustomMetrics();

        // Resource timing
        this.trackResourceTiming();
    }

    measureWebVitals() {
        // First Contentful Paint
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.perfMetrics.firstContentfulPaint = entry.startTime;
                    this.trackEvent('performance', 'fcp', entry.startTime);
                }
            }
        });
        observer.observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.perfMetrics.largestContentfulPaint = lastEntry.startTime;
            this.trackEvent('performance', 'lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    this.trackEvent('performance', 'cls', clsValue);
                }
            }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    trackCustomMetrics() {
        // Time to Interactive (simplified)
        window.addEventListener('load', () => {
            setTimeout(() => {
                const tti = performance.now();
                this.trackEvent('performance', 'tti', tti);
            }, 0);
        });

        // Memory usage (if available)
        if ('memory' in performance) {
            setInterval(() => {
                const memory = (performance as any).memory;
                this.trackEvent('performance', 'memory_used', memory.usedJSHeapSize);
            }, 30000);
        }
    }

    trackResourceTiming() {
        window.addEventListener('load', () => {
            const resources = performance.getEntriesByType('resource');
            resources.forEach(resource => {
                if (resource.duration > 1000) { // Track slow resources
                    this.trackEvent('performance', 'slow_resource', {
                        name: resource.name,
                        duration: resource.duration
                    });
                }
            });
        });
    }

    // Accessibility
    async initAccessibility() {
        // Focus management
        this.initFocusManagement();

        // ARIA live regions
        this.initLiveRegions();

        // Reduced motion support
        this.initReducedMotion();

        // High contrast support
        this.initHighContrast();
    }

    initFocusManagement() {
        // Skip link
        const skipLink = document.querySelector('[data-skip-link]');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(skipLink.getAttribute('href'));
                if (target) {
                    target.focus();
                    target.scrollIntoView();
                }
            });
        }

        // Focus visible management
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('using-keyboard');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('using-keyboard');
        });
    }

    initLiveRegions() {
        // Create announcement region if it doesn't exist
        if (!document.querySelector('[data-live-region]')) {
            const liveRegion = document.createElement('div');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.setAttribute('data-live-region', '');
            liveRegion.style.cssText = `
                position: absolute;
                left: -10000px;
                width: 1px;
                height: 1px;
                overflow: hidden;
            `;
            document.body.appendChild(liveRegion);
        }
    }

    announce(message) {
        const liveRegion = document.querySelector('[data-live-region]');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => liveRegion.textContent = '', 1000);
        }
    }

    initReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        const handleReducedMotion = () => {
            if (prefersReducedMotion.matches) {
                document.documentElement.classList.add('reduced-motion');
                // Disable complex animations
                this.observers.forEach(observer => observer.disconnect());
            } else {
                document.documentElement.classList.remove('reduced-motion');
            }
        };

        handleReducedMotion();
        prefersReducedMotion.addEventListener('change', handleReducedMotion);
    }

    initHighContrast() {
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');

        const handleHighContrast = () => {
            if (prefersHighContrast.matches) {
                document.documentElement.classList.add('high-contrast');
            } else {
                document.documentElement.classList.remove('high-contrast');
            }
        };

        handleHighContrast();
        prefersHighContrast.addEventListener('change', handleHighContrast);
    }

    // Analytics and Tracking
    async initAnalytics() {
        this.analytics = {
            sessionStart: Date.now(),
            pageViews: [],
            events: [],
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };

        // Track page view
        this.trackPageView();

        // Track user interactions
        this.trackUserInteractions();

        // Track errors
        this.trackErrors();
    }

    trackPageView() {
        const pageView = {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now(),
            referrer: document.referrer
        };

        this.analytics.pageViews.push(pageView);
        this.trackEvent('page', 'view', pageView);
    }

    trackEvent(category, action, data = {}) {
        const event = {
            category,
            action,
            data,
            timestamp: Date.now(),
            url: window.location.href
        };

        this.analytics.events.push(event);

        // Send to analytics service (implement based on your needs)
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: JSON.stringify(data)
            });
        }

        console.log('Analytics Event:', event);
    }

    trackUserInteractions() {
        // Click tracking
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button, [data-track]');
            if (target) {
                this.trackEvent('interaction', 'click', {
                    element: target.tagName,
                    text: target.textContent?.trim(),
                    href: target.href,
                    id: target.id,
                    className: target.className
                });
            }
        });

        // Scroll depth tracking
        let maxScrollDepth = 0;
        window.addEventListener('scroll', () => {
            const scrollDepth = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
            if (scrollDepth > maxScrollDepth) {
                maxScrollDepth = scrollDepth;
                if (scrollDepth > 0.25 && scrollDepth <= 0.5) {
                    this.trackEvent('engagement', 'scroll_25');
                } else if (scrollDepth > 0.5 && scrollDepth <= 0.75) {
                    this.trackEvent('engagement', 'scroll_50');
                } else if (scrollDepth > 0.75 && scrollDepth <= 0.9) {
                    this.trackEvent('engagement', 'scroll_75');
                } else if (scrollDepth > 0.9) {
                    this.trackEvent('engagement', 'scroll_90');
                }
            }
        }, { passive: true });

        // Time on page
        let timeOnPage = 0;
        setInterval(() => {
            timeOnPage += 1000;
            if (timeOnPage % 30000 === 0) { // Every 30 seconds
                this.trackEvent('engagement', 'time_on_page', { seconds: timeOnPage / 1000 });
            }
        }, 1000);
    }

    trackErrors() {
        window.addEventListener('error', (e) => {
            this.trackEvent('error', 'javascript', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno
            });
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.trackEvent('error', 'promise_rejection', {
                reason: e.reason?.toString()
            });
        });
    }

    // Utility Methods
    smoothScrollTo(element, options = {}) {
        const offset = options.offset || 0;
        const duration = options.duration || 500;

        const targetPosition = element.offsetTop + offset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();

        const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        const animation = (currentTime) => {
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const ease = easeInOutQuad(progress);

            window.scrollTo(0, startPosition + distance * ease);

            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        };

        requestAnimationFrame(animation);
    }

    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return (...args) => {
            if (!lastRan) {
                func.apply(this, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(this, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }

    // Event System
    on(event, callback) {
        if (!this.events) this.events = {};
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    emit(event, data) {
        if (!this.events || !this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }

    off(event, callback) {
        if (!this.events || !this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    // Error Handling
    handleError(error) {
        console.error('Binary Ring Core Error:', error);
        this.trackEvent('error', 'core', {
            message: error.message,
            stack: error.stack
        });

        // Show user-friendly error message
        this.announce('An error occurred. Please refresh the page.');
    }

    // Cleanup
    destroy() {
        // Remove event listeners
        this.observers.forEach(observer => observer.disconnect());

        // Clear animations
        this.animations.forEach(animation => {
            if (animation.cancel) animation.cancel();
        });

        this.isInitialized = false;
        this.emit('core:destroyed');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.BinaryRing = new BinaryRingCore();
    });
} else {
    window.BinaryRing = new BinaryRingCore();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BinaryRingCore;
}

// CSS Animation keyframes (to be included in CSS)
const animationStyles = `
@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(var(--float-amplitude, -10px)); }
}

@keyframes ripple-animation {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

.skeleton-loading {
    background: linear-gradient(90deg, #f0f0f0 25%, transparent 37%, #f0f0f0 63%);
    background-size: 400% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
    0% { background-position: 100% 50%; }
    100% { background-position: -100% 50%; }
}

.typing-cursor::after {
    content: '|';
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}

/* Reduced motion styles */
.reduced-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
}

/* High contrast styles */
.high-contrast {
    filter: contrast(1.5);
}

/* Focus styles for keyboard navigation */
.using-keyboard :focus {
    outline: 3px solid #4A90E2;
    outline-offset: 2px;
}
`;

// Inject styles if not already present
if (!document.querySelector('#binary-ring-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'binary-ring-styles';
    styleSheet.textContent = animationStyles;
    document.head.appendChild(styleSheet);
}