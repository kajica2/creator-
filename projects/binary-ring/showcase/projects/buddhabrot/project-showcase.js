/**
 * Project Showcase Base Class
 * Handles common functionality for all project showcase pages
 */

class ProjectShowcase {
    constructor(projectId) {
        this.projectId = projectId;
        this.renderer = null;
        this.neuralViz = null;
        this.isFullscreen = false;

        // DOM elements will be bound on init
        this.elements = {};

        // Project data
        this.projectData = null;
        this.comments = [];
    }

    async init() {
        try {
            this.bindElements();
            this.bindEvents();
            await this.loadProjectData();
            this.initializeRenderer();
            this.initializeNeuralConnections();
            this.loadComments();
            this.setupExportModal();

            console.log(`${this.projectId} showcase initialized`);
        } catch (error) {
            console.error(`Error initializing ${this.projectId} showcase:`, error);
        }
    }

    bindElements() {
        this.elements = {
            // Navigation
            shareBtn: document.getElementById('shareBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),

            // Main controls
            generateBtn: document.getElementById('generateBtn'),
            startSimulation: document.getElementById('startSimulation'),
            resetNetwork: document.getElementById('resetNetwork'),
            exportBtn: document.getElementById('exportBtn'),

            // Canvas and visualization
            mainCanvas: document.getElementById(this.getCanvasId()),
            neuralCanvas: document.getElementById('neuralCanvas'),

            // Control panels
            controlsPanel: document.getElementById('controlsPanel'),
            toggleControls: document.getElementById('toggleControls'),

            // Stats and info
            renderProgress: document.getElementById('renderProgress'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),

            // Comments
            commentsContainer: document.getElementById('commentsContainer'),
            commentText: document.getElementById('commentText'),
            postComment: document.getElementById('postComment'),

            // Export modal
            exportModal: document.getElementById('exportModal'),
            closeExport: document.getElementById('closeExport'),
            confirmExport: document.getElementById('confirmExport'),
            cancelExport: document.getElementById('cancelExport')
        };
    }

    getCanvasId() {
        // Map project IDs to canvas IDs
        const canvasMap = {
            'buddhabrot': 'buddhabrotCanvas',
            'node.garden': 'nodeGardenCanvas',
            'substrate': 'substrateCanvas',
            'deep.lorenz': 'lorenzCanvas',
            'happy.place': 'happyPlaceCanvas',
            'orbitals': 'orbitalsCanvas'
        };

        return canvasMap[this.projectId] || 'mainCanvas';
    }

    bindEvents() {
        // Navigation events
        this.elements.shareBtn?.addEventListener('click', () => this.shareProject());
        this.elements.fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());

        // Control events
        this.elements.generateBtn?.addEventListener('click', () => this.generate());
        this.elements.startSimulation?.addEventListener('click', () => this.startSimulation());
        this.elements.resetNetwork?.addEventListener('click', () => this.reset());
        this.elements.exportBtn?.addEventListener('click', () => this.showExportModal());

        // Panel controls
        this.elements.toggleControls?.addEventListener('click', () => this.toggleControlsPanel());

        // Comments
        this.elements.postComment?.addEventListener('click', () => this.postComment());
        this.elements.commentText?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.postComment();
            }
        });

        // Export modal
        this.elements.closeExport?.addEventListener('click', () => this.hideExportModal());
        this.elements.cancelExport?.addEventListener('click', () => this.hideExportModal());
        this.elements.confirmExport?.addEventListener('click', () => this.exportProject());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Window events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    async loadProjectData() {
        // Load project data from the global projects database
        if (window.PROJECTS_DATABASE && window.PROJECTS_DATABASE.projects) {
            this.projectData = window.PROJECTS_DATABASE.projects.find(p => p.id === this.projectId);
        }

        if (!this.projectData) {
            // Fallback data
            this.projectData = this.getFallbackProjectData();
        }
    }

    getFallbackProjectData() {
        const fallbackData = {
            'buddhabrot': {
                id: 'buddhabrot',
                title: 'Buddhabrot',
                category: 'fractals',
                description: 'Fractal path tracing in the Mandelbrot set',
                tags: ['fractal', 'mandelbrot', 'mathematical'],
                views: 2847,
                likes: 156,
                downloads: 89
            },
            'node.garden': {
                id: 'node.garden',
                title: 'Node Garden',
                category: 'networks',
                description: 'Dynamic network visualization with organic growth',
                tags: ['network', 'interactive', 'growth'],
                views: 1923,
                likes: 234,
                downloads: 145
            }
        };

        return fallbackData[this.projectId] || {};
    }

    initializeRenderer() {
        if (!this.elements.mainCanvas) return;

        // Initialize project-specific renderer
        switch (this.projectId) {
            case 'buddhabrot':
                if (window.BuddhabrotRenderer) {
                    this.renderer = new BuddhabrotRenderer(this.elements.mainCanvas);
                }
                break;
            case 'node.garden':
                if (window.NodeGardenRenderer) {
                    this.renderer = new NodeGardenRenderer(this.elements.mainCanvas);
                }
                break;
            // Add other project renderers here
            default:
                this.initializeDefaultRenderer();
                break;
        }

        if (this.renderer) {
            this.setupRendererCallbacks();
        }
    }

    initializeDefaultRenderer() {
        // Simple default renderer for projects without specific implementations
        const canvas = this.elements.mainCanvas;
        const ctx = canvas.getContext('2d');

        // Basic animation
        const animate = (time) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Project-specific default visual
            this.renderDefaultVisual(ctx, time);

            requestAnimationFrame(animate);
        };

        this.resizeCanvas();
        animate(0);
    }

    renderDefaultVisual(ctx, time) {
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;

        // Simple animated pattern
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2 + time * 0.001;
            const x = centerX + Math.cos(angle) * (50 + i * 10);
            const y = centerY + Math.sin(angle) * (50 + i * 10);

            ctx.fillStyle = `hsl(${(time * 0.1 + i * 18) % 360}, 70%, 50%)`;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    setupRendererCallbacks() {
        if (!this.renderer) return;

        // Progress callback for long-running renders
        const progressCallback = (progress, details) => {
            this.updateProgress(progress, details);
        };

        // Completion callback
        const completeCallback = () => {
            this.hideProgress();
            this.updatePerformanceMetrics();
        };

        // Set callbacks if renderer supports them
        if (typeof this.renderer.setProgressCallback === 'function') {
            this.renderer.setProgressCallback(progressCallback);
        }

        if (typeof this.renderer.setCompleteCallback === 'function') {
            this.renderer.setCompleteCallback(completeCallback);
        }
    }

    initializeNeuralConnections() {
        if (!this.elements.neuralCanvas) return;

        // Create neural connections visualization
        const projects = window.PROJECTS_DATABASE ? window.PROJECTS_DATABASE.projects : [];
        this.neuralViz = new NeuralConnectionsViz(this.elements.neuralCanvas, projects);
        this.neuralViz.init();

        // Highlight current project
        if (this.neuralViz.highlightProject) {
            this.neuralViz.highlightProject(this.projectId);
        }
    }

    loadComments() {
        // Load comments for this project
        this.comments = this.getSampleComments();
        this.renderComments();
    }

    getSampleComments() {
        const sampleComments = {
            'buddhabrot': [
                {
                    author: 'FractalExplorer',
                    time: '2 hours ago',
                    text: 'The way the trajectories create these organic forms is absolutely mesmerizing! Love the color variations.'
                },
                {
                    author: 'MathArt',
                    time: '1 day ago',
                    text: 'Beautiful implementation of the Buddhabrot algorithm. The performance is impressive even at high sample counts.'
                }
            ],
            'node.garden': [
                {
                    author: 'NetworkExplorer',
                    time: '2 hours ago',
                    text: 'The way nodes naturally cluster reminds me of neural networks forming connections during learning!'
                },
                {
                    author: 'ComplexityFan',
                    time: '5 hours ago',
                    text: 'Love how the audio reactivity makes the network dance. Perfect for my ambient music sessions.'
                }
            ]
        };

        return sampleComments[this.projectId] || [];
    }

    renderComments() {
        if (!this.elements.commentsContainer) return;

        const commentsHTML = this.comments.map(comment => `
            <div class="comment">
                <div class="comment-author">${comment.author}</div>
                <div class="comment-time">${comment.time}</div>
                <div class="comment-text">${comment.text}</div>
            </div>
        `).join('');

        this.elements.commentsContainer.innerHTML = commentsHTML;
    }

    // Event handlers
    generate() {
        if (this.renderer && typeof this.renderer.render === 'function') {
            this.showProgress('Generating...');
            this.renderer.render();
        }
    }

    startSimulation() {
        if (this.renderer && typeof this.renderer.start === 'function') {
            this.renderer.start();
        }
    }

    reset() {
        if (this.renderer && typeof this.renderer.reset === 'function') {
            this.renderer.reset();
        }
    }

    shareProject() {
        if (navigator.share) {
            navigator.share({
                title: `${this.projectData.title} - Binary Ring`,
                text: this.projectData.description,
                url: window.location.href
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showNotification('Link copied to clipboard!');
            });
        }
    }

    toggleFullscreen() {
        if (!this.isFullscreen) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
                this.isFullscreen = true;
                this.elements.fullscreenBtn.textContent = 'Exit Fullscreen';
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                this.isFullscreen = false;
                this.elements.fullscreenBtn.textContent = 'Fullscreen';
            }
        }
    }

    toggleControlsPanel() {
        const content = this.elements.controlsPanel?.querySelector('.controls-content');
        const toggle = this.elements.toggleControls;

        if (content && toggle) {
            const isExpanded = content.style.display !== 'none';
            content.style.display = isExpanded ? 'none' : 'block';
            toggle.textContent = isExpanded ? '+' : '−';
        }
    }

    postComment() {
        const text = this.elements.commentText?.value.trim();
        if (!text) return;

        const newComment = {
            author: 'Anonymous User',
            time: 'Just now',
            text: text
        };

        this.comments.unshift(newComment);
        this.renderComments();
        this.elements.commentText.value = '';

        this.showNotification('Comment posted!');
    }

    setupExportModal() {
        if (!this.elements.exportModal) return;

        // Quality slider
        const qualitySlider = document.getElementById('exportQuality');
        const qualityValue = document.getElementById('qualityValue');

        if (qualitySlider && qualityValue) {
            qualitySlider.addEventListener('input', (e) => {
                qualityValue.textContent = e.target.value + '%';
            });
        }
    }

    showExportModal() {
        if (this.elements.exportModal) {
            this.elements.exportModal.classList.add('active');
        }
    }

    hideExportModal() {
        if (this.elements.exportModal) {
            this.elements.exportModal.classList.remove('active');
        }
    }

    async exportProject() {
        if (!this.renderer || typeof this.renderer.exportImage !== 'function') {
            this.showNotification('Export not available for this project');
            return;
        }

        try {
            const resolution = document.getElementById('exportResolution')?.value || '1920x1080';
            const format = document.getElementById('exportFormat')?.value || 'png';
            const quality = parseInt(document.getElementById('exportQuality')?.value || '95') / 100;

            const blob = await this.renderer.exportImage(format, quality);

            // Download the exported image
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.projectId}-${resolution}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.hideExportModal();
            this.showNotification('Export successful!');
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('Export failed. Please try again.');
        }
    }

    showProgress(message = 'Processing...') {
        if (this.elements.renderProgress) {
            this.elements.renderProgress.classList.add('active');
            if (this.elements.progressText) {
                this.elements.progressText.textContent = message;
            }
        }
    }

    updateProgress(progress, details = '') {
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = (progress * 100) + '%';
        }
        if (this.elements.progressText && details) {
            this.elements.progressText.textContent = details;
        }
    }

    hideProgress() {
        if (this.elements.renderProgress) {
            this.elements.renderProgress.classList.remove('active');
        }
    }

    updatePerformanceMetrics() {
        if (this.renderer && typeof this.renderer.getPerformanceMetrics === 'function') {
            const metrics = this.renderer.getPerformanceMetrics();

            // Update performance display elements
            const renderTimeEl = document.getElementById('renderTime');
            const memoryUsageEl = document.getElementById('memoryUsage');

            if (renderTimeEl && metrics.renderTime) {
                renderTimeEl.textContent = metrics.renderTime;
            }

            if (memoryUsageEl && metrics.memoryUsage) {
                memoryUsageEl.textContent = metrics.memoryUsage;
            }
        }
    }

    handleKeydown(event) {
        // Keyboard shortcuts
        if (event.key === 'Escape') {
            if (this.elements.exportModal?.classList.contains('active')) {
                this.hideExportModal();
            }
        } else if (event.key === 'f' && !event.ctrlKey && !event.metaKey) {
            this.toggleFullscreen();
        } else if (event.key === ' ' && event.target === document.body) {
            event.preventDefault();
            this.generate();
        }
    }

    handleResize() {
        this.resizeCanvas();
        if (this.neuralViz && typeof this.neuralViz.handleResize === 'function') {
            this.neuralViz.handleResize();
        }
    }

    resizeCanvas() {
        if (!this.elements.mainCanvas) return;

        const canvas = this.elements.mainCanvas;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;

        const ctx = canvas.getContext('2d');
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: var(--background-dark);
            padding: var(--spacing-md);
            border-radius: var(--radius-md);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    cleanup() {
        // Clean up resources
        if (this.renderer && typeof this.renderer.destroy === 'function') {
            this.renderer.destroy();
        }

        if (this.neuralViz && typeof this.neuralViz.destroy === 'function') {
            this.neuralViz.destroy();
        }
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.ProjectShowcase = ProjectShowcase;
}