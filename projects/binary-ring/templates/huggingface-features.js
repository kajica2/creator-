/**
 * Binary Ring Template Features
 * Enhanced functionality inspired by Hugging Face Spaces architecture
 */

class BinaryRingTemplate {
    constructor() {
        this.config = window.binaryRingConfig || {};
        this.features = new Map();
        this.observers = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            await this.setupFeatures();
            this.setupObservers();
            this.setupKeyboardShortcuts();
            this.setupAccessibility();
            this.setupPerformanceMonitoring();
            this.initialized = true;

            console.log('Binary Ring Template initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Binary Ring Template:', error);
            this.reportError('Template Initialization', error);
        }
    }

    // Feature Management System
    async setupFeatures() {
        const featurePromises = [
            this.initializeThemeSystem(),
            this.initializeSearch(),
            this.initializeNavigation(),
            this.initializeStats(),
            this.initializeNotifications(),
            this.initializeCanvas()
        ];

        await Promise.allSettled(featurePromises);
    }

    // Enhanced Theme System (inspired by Hugging Face)
    async initializeThemeSystem() {
        const themeFeature = {
            name: 'theme',
            initialized: false,

            init: () => {
                this.setupThemeToggle();
                this.setupThemeDetection();
                this.applyThemeStyles();
                themeFeature.initialized = true;
            },

            toggleTheme: () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                this.setTheme(newTheme);
            },

            setTheme: (theme) => {
                document.documentElement.setAttribute('data-theme', theme);
                document.documentElement.className =
                    document.documentElement.className.replace(/theme-\w+/, `theme-${theme}`);

                // Update theme icons
                this.updateThemeIcons(theme);

                // Save preference
                this.setCookie('binary-ring-theme', theme, 365);

                // Track event
                if (window.BinaryRing) {
                    BinaryRing.trackEvent('Theme Toggle', { theme });
                }

                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('themechange', {
                    detail: { theme }
                }));
            }
        };

        this.features.set('theme', themeFeature);
        featureFeature.init();
    }

    setupThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.features.get('theme').toggleTheme();
            });

            // Add keyboard support
            themeToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.features.get('theme').toggleTheme();
                }
            });
        }
    }

    updateThemeIcons(theme) {
        const icons = document.querySelectorAll('.theme-icon');
        icons.forEach(icon => icon.style.display = 'none');

        const activeIcon = document.querySelector(`.theme-icon-${theme}`);
        if (activeIcon) {
            activeIcon.style.display = 'inline-block';
        }
    }

    // Advanced Search System
    async initializeSearch() {
        const searchFeature = {
            name: 'search',
            initialized: false,
            debounceTimer: null,

            init: () => {
                this.setupSearchToggle();
                this.setupSearchInput();
                this.setupSearchSuggestions();
                searchFeature.initialized = true;
            },

            performSearch: async (query) => {
                if (!query || query.length < 2) return [];

                try {
                    // Simulate API call - replace with actual search API
                    const results = await this.searchProjects(query);
                    this.displaySearchSuggestions(results);
                    return results;
                } catch (error) {
                    console.error('Search failed:', error);
                    return [];
                }
            },

            clearSearch: () => {
                const suggestions = document.getElementById('searchSuggestions');
                if (suggestions) {
                    suggestions.innerHTML = '';
                }
            }
        };

        this.features.set('search', searchFeature);
        searchFeature.init();
    }

    setupSearchToggle() {
        const searchToggle = document.querySelector('.search-toggle');
        const searchOverlay = document.getElementById('searchOverlay');

        if (searchToggle && searchOverlay) {
            searchToggle.addEventListener('click', () => {
                searchOverlay.classList.toggle('active');
                const searchInput = searchOverlay.querySelector('.search-input');
                if (searchInput && searchOverlay.classList.contains('active')) {
                    setTimeout(() => searchInput.focus(), 100);
                }
            });

            // Close on escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                    searchOverlay.classList.remove('active');
                }
            });

            // Close on overlay click
            searchOverlay.addEventListener('click', (e) => {
                if (e.target === searchOverlay) {
                    searchOverlay.classList.remove('active');
                }
            });
        }
    }

    setupSearchInput() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const search = this.features.get('search');
                clearTimeout(search.debounceTimer);

                search.debounceTimer = setTimeout(() => {
                    search.performSearch(e.target.value);
                }, 300);
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearchSubmit(e.target.value);
                }
            });
        }
    }

    async searchProjects(query) {
        // Mock search results - replace with actual API
        const mockResults = [
            { id: 'buddhabrot', title: 'Buddhabrot', category: 'fractals', description: 'Fractal path tracing' },
            { id: 'node-garden', title: 'Node Garden', category: 'networks', description: 'Dynamic network visualization' },
            { id: 'substrate', title: 'Substrate', category: 'organic', description: 'Crack growth simulation' }
        ];

        return mockResults.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
        );
    }

    displaySearchSuggestions(results) {
        const suggestions = document.getElementById('searchSuggestions');
        if (!suggestions) return;

        if (results.length === 0) {
            suggestions.innerHTML = '<div class="search-no-results">No results found</div>';
            return;
        }

        const html = results.map(result => `
            <a href="/showcase/projects/${result.id}" class="search-suggestion">
                <div class="suggestion-icon">🎨</div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${result.title}</div>
                    <div class="suggestion-description">${result.description}</div>
                </div>
                <div class="suggestion-category">${result.category}</div>
            </a>
        `).join('');

        suggestions.innerHTML = html;
    }

    // Mobile Navigation
    setupNavigation() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobileMenu');

        if (mobileToggle && mobileMenu) {
            mobileToggle.addEventListener('click', () => {
                const isOpen = mobileMenu.classList.contains('active');

                if (isOpen) {
                    mobileMenu.classList.remove('active');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                } else {
                    mobileMenu.classList.add('active');
                    mobileToggle.setAttribute('aria-expanded', 'true');
                }
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!mobileToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
                    mobileMenu.classList.remove('active');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    // Animated Statistics Counter
    async initializeStats() {
        const statNumbers = document.querySelectorAll('[data-count]');

        const countUp = (element, target, duration = 2000) => {
            let start = 0;
            const increment = target / (duration / 16);

            const timer = setInterval(() => {
                start += increment;
                element.textContent = Math.floor(start).toLocaleString();

                if (start >= target) {
                    element.textContent = target.toLocaleString();
                    clearInterval(timer);
                }
            }, 16);
        };

        // Intersection Observer for triggering animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.dataset.count);
                    countUp(entry.target, target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => observer.observe(stat));
    }

    // Notification System
    async initializeNotifications() {
        this.notificationContainer = document.getElementById('notificationContainer');

        if (!this.notificationContainer) {
            console.warn('Notification container not found');
            return;
        }

        this.notificationQueue = [];
        this.maxNotifications = 5;
    }

    showNotification(message, type = 'info', duration = 5000) {
        if (!this.notificationContainer) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${this.getNotificationIcon(type)}
                </div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" aria-label="Close notification">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;

        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        // Auto-remove after duration
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        // Add to DOM
        this.notificationContainer.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('notification-show');
        }, 10);

        // Manage queue
        this.manageNotificationQueue();
    }

    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.classList.add('notification-hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }

    manageNotificationQueue() {
        const notifications = this.notificationContainer.children;
        while (notifications.length > this.maxNotifications) {
            this.removeNotification(notifications[0]);
        }
    }

    // Interactive Canvas Background
    async initializeCanvas() {
        const canvas = document.getElementById('heroCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationId;
        let particles = [];

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        const createParticle = () => ({
            x: Math.random() * canvas.offsetWidth,
            y: Math.random() * canvas.offsetHeight,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.3
        });

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < 50; i++) {
                particles.push(createParticle());
            }
        };

        const updateParticles = () => {
            particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;

                if (particle.x < 0 || particle.x > canvas.offsetWidth) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.offsetHeight) particle.vy *= -1;
            });
        };

        const drawParticles = () => {
            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

            particles.forEach(particle => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(79, 70, 229, ${particle.opacity})`;
                ctx.fill();
            });

            // Draw connections
            particles.forEach((particle, i) => {
                particles.slice(i + 1).forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = `rgba(79, 70, 229, ${0.2 * (1 - distance / 100)})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                });
            });
        };

        const animate = () => {
            updateParticles();
            drawParticles();
            animationId = requestAnimationFrame(animate);
        };

        // Initialize
        resizeCanvas();
        initParticles();
        animate();

        // Handle resize
        window.addEventListener('resize', () => {
            resizeCanvas();
            initParticles();
        });

        // Pause animation when not visible (performance optimization)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!animationId) animate();
                } else {
                    if (animationId) {
                        cancelAnimationFrame(animationId);
                        animationId = null;
                    }
                }
            });
        });

        observer.observe(canvas);
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + K for search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchToggle = document.querySelector('.search-toggle');
                if (searchToggle) searchToggle.click();
            }

            // Cmd/Ctrl + Shift + T for theme toggle
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                if (this.features.has('theme')) {
                    this.features.get('theme').toggleTheme();
                }
            }
        });
    }

    // Accessibility Enhancements
    setupAccessibility() {
        // Skip link functionality
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(skipLink.getAttribute('href'));
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Enhanced focus management
        this.setupFocusManagement();
    }

    setupFocusManagement() {
        // Track focus for better accessibility
        let focusTimeout;

        document.addEventListener('focusin', (e) => {
            clearTimeout(focusTimeout);
            document.body.classList.add('using-keyboard');
        });

        document.addEventListener('mousedown', () => {
            focusTimeout = setTimeout(() => {
                document.body.classList.remove('using-keyboard');
            }, 100);
        });
    }

    // Performance Monitoring
    setupPerformanceMonitoring() {
        if (!window.performance) return;

        // Web Vitals monitoring
        this.monitorWebVitals();

        // Custom performance markers
        this.setupPerformanceMarkers();
    }

    monitorWebVitals() {
        // First Contentful Paint
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.reportMetric('FCP', entry.startTime);
                }
            }
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.reportMetric('LCP', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
    }

    setupPerformanceMarkers() {
        // Mark template initialization
        performance.mark('template-init-start');

        window.addEventListener('load', () => {
            performance.mark('template-init-end');
            performance.measure('template-init', 'template-init-start', 'template-init-end');

            const measure = performance.getEntriesByName('template-init')[0];
            this.reportMetric('Template Init', measure.duration);
        });
    }

    reportMetric(name, value) {
        if (window.BinaryRing) {
            BinaryRing.trackEvent('Performance Metric', {
                metric: name,
                value: Math.round(value),
                timestamp: Date.now()
            });
        }
    }

    // Utility Functions
    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }

    reportError(context, error) {
        if (window.BinaryRing) {
            BinaryRing.config.reportError(context, {
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            });
        }
    }

    // Setup Observers for performance
    setupObservers() {
        // Intersection Observer for lazy loading
        this.lazyLoadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        this.lazyLoadObserver.unobserve(img);
                    }
                }
            });
        }, { rootMargin: '50px' });

        // Observe lazy load images
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.lazyLoadObserver.observe(img);
        });
    }
}

// Initialize template when DOM is ready
function initializeTemplate() {
    const template = new BinaryRingTemplate();
    template.initialize();

    // Make template available globally
    window.BinaryRingTemplate = template;
}

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTemplate);
} else {
    initializeTemplate();
}