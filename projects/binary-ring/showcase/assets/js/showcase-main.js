/**
 * Binary Ring Showcase - Main Application
 * Handles project display, filtering, search, and navigation
 */

class BinaryRingShowcase {
    constructor() {
        this.projects = [];
        this.filteredProjects = [];
        this.currentView = 'grid';
        this.currentFilter = '';
        this.currentSort = 'recent';
        this.searchTerm = '';

        // DOM elements
        this.elements = {};

        // Neural connections
        this.neuralConnections = null;

        // Animation frame ID
        this.animationFrameId = null;
    }

    async init() {
        try {
            this.bindElements();
            this.bindEvents();
            await this.loadProjects();
            this.renderFeaturedProjects();
            this.renderAllProjects();
            this.initializeHeroBackground();
            this.initializeNeuralConnections();

            console.log('Binary Ring Showcase initialized successfully');
        } catch (error) {
            console.error('Error initializing showcase:', error);
        }
    }

    bindElements() {
        this.elements = {
            // Search
            searchToggle: document.getElementById('searchToggle'),
            searchOverlay: document.getElementById('searchOverlay'),
            searchInput: document.getElementById('searchInput'),
            searchClose: document.getElementById('searchClose'),
            searchResults: document.getElementById('searchResults'),

            // Grids
            featuredGrid: document.getElementById('featuredGrid'),
            projectsGrid: document.getElementById('projectsGrid'),

            // Filters
            categoryFilter: document.getElementById('categoryFilter'),
            sortFilter: document.getElementById('sortFilter'),
            viewButtons: document.querySelectorAll('.view-btn'),

            // Canvas elements
            heroCanvas: document.getElementById('heroCanvas'),
            neuralCanvas: document.getElementById('neuralCanvas'),
            neuralInfo: document.getElementById('neuralInfo'),

            // Category cards
            categoryCards: document.querySelectorAll('.category-card')
        };
    }

    bindEvents() {
        // Search functionality
        this.elements.searchToggle?.addEventListener('click', () => this.toggleSearch());
        this.elements.searchClose?.addEventListener('click', () => this.toggleSearch());
        this.elements.searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Close search on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.searchOverlay.classList.contains('active')) {
                this.toggleSearch();
            }
        });

        // Filters and view toggles
        this.elements.categoryFilter?.addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));
        this.elements.sortFilter?.addEventListener('change', (e) => this.handleSortFilter(e.target.value));

        this.elements.viewButtons?.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleViewToggle(e.target.dataset.view));
        });

        // Category navigation
        this.elements.categoryCards?.forEach(card => {
            card.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.navigateToCategory(category);
            });
        });

        // Window resize
        window.addEventListener('resize', () => this.handleResize());

        // Neural canvas interactions
        this.elements.neuralCanvas?.addEventListener('click', (e) => this.handleNeuralClick(e));
        this.elements.neuralCanvas?.addEventListener('mousemove', (e) => this.handleNeuralHover(e));
    }

    async loadProjects() {
        try {
            // Use the projects data from the global PROJECTS_DATABASE
            if (window.PROJECTS_DATABASE && window.PROJECTS_DATABASE.projects) {
                this.projects = window.PROJECTS_DATABASE.projects;
                this.filteredProjects = [...this.projects];
                return;
            }

            // Fallback to API if global data not available
            const response = await fetch('../community/scripts/projects-data.js');
            if (!response.ok) throw new Error('Failed to load projects data');

            // For now, use the sample data structure based on our catalog
            this.projects = this.getSampleProjects();
            this.filteredProjects = [...this.projects];
        } catch (error) {
            console.error('Error loading projects:', error);
            // Use fallback sample data
            this.projects = this.getSampleProjects();
            this.filteredProjects = [...this.projects];
        }
    }

    getSampleProjects() {
        // Extract featured projects from catalog data
        return [
            {
                id: "buddhabrot",
                title: "Buddhabrot",
                description: "Fractal path tracing in the Mandelbrot set creating organic, Buddha-like silhouettes",
                category: "fractals",
                tags: ["fractal", "mandelbrot", "mathematical", "organic"],
                isFeatured: true,
                isInteractive: true,
                primaryColor: "#FF6B6B",
                thumbnail: "assets/previews/buddhabrot-thumb.jpg",
                demoUrl: "../buddhabrot/index.html",
                views: 2847,
                likes: 156,
                downloads: 89,
                dateCreated: "2024-03-15"
            },
            {
                id: "node.garden",
                title: "Node Garden",
                description: "Dynamic network visualization with organic growth patterns and interactive nodes",
                category: "networks",
                tags: ["network", "interactive", "growth", "realtime"],
                isFeatured: true,
                isInteractive: true,
                primaryColor: "#66FF66",
                thumbnail: "assets/previews/node-garden-thumb.jpg",
                demoUrl: "../node.garden/index.html",
                views: 1923,
                likes: 234,
                downloads: 145,
                dateCreated: "2024-10-15"
            },
            {
                id: "substrate",
                title: "Substrate",
                description: "Crack growth simulation inspired by bacterial colonies and material decomposition",
                category: "organic",
                tags: ["growth", "cracks", "bacterial", "organic"],
                isFeatured: true,
                isInteractive: false,
                primaryColor: "#8B4513",
                thumbnail: "assets/previews/substrate-thumb.jpg",
                demoUrl: "../substrate/index.html",
                views: 1654,
                likes: 198,
                downloads: 167,
                dateCreated: "2024-09-20"
            },
            {
                id: "deep.lorenz",
                title: "Deep Lorenz",
                description: "Extended exploration of Lorenz attractor dynamics with phase space visualization",
                category: "attractors",
                tags: ["attractor", "chaos", "mathematical", "3d"],
                isFeatured: true,
                isInteractive: true,
                primaryColor: "#9932CC",
                thumbnail: "assets/previews/deep-lorenz-thumb.jpg",
                demoUrl: "../deep.lorenz/index.html",
                views: 3241,
                likes: 287,
                downloads: 134,
                dateCreated: "2024-02-10"
            },
            {
                id: "happy.place",
                title: "Happy Place",
                description: "Emotion-driven pattern generation creating positive, uplifting visual experiences",
                category: "emotional",
                tags: ["emotion", "wellness", "therapy", "interactive"],
                isFeatured: true,
                isInteractive: true,
                primaryColor: "#FFD700",
                thumbnail: "assets/previews/happy-place-thumb.jpg",
                demoUrl: "../happy.place/index.html",
                views: 1456,
                likes: 312,
                downloads: 78,
                dateCreated: "2024-08-12"
            },
            {
                id: "orbitals",
                title: "Orbitals",
                description: "Quantum-inspired particle dynamics visualizing atomic orbital structures",
                category: "particles",
                tags: ["quantum", "atomic", "3d", "science"],
                isFeatured: true,
                isInteractive: true,
                primaryColor: "#00BFFF",
                thumbnail: "assets/previews/orbitals-thumb.jpg",
                demoUrl: "../orbitals/index.html",
                views: 987,
                likes: 145,
                downloads: 56,
                dateCreated: "2024-10-01"
            }
        ];
    }

    renderFeaturedProjects() {
        const featuredProjects = this.projects.filter(project => project.isFeatured);
        const grid = this.elements.featuredGrid;

        if (!grid) return;

        grid.innerHTML = '';

        featuredProjects.forEach(project => {
            const card = this.createProjectCard(project, true);
            grid.appendChild(card);
        });

        // Initialize canvas previews after DOM update
        setTimeout(() => this.initializeProjectPreviews(grid), 100);
    }

    renderAllProjects() {
        const grid = this.elements.projectsGrid;
        if (!grid) return;

        grid.innerHTML = '';

        this.filteredProjects.forEach(project => {
            const card = this.createProjectCard(project, false);
            grid.appendChild(card);
        });

        // Update view class
        grid.className = `projects-grid ${this.currentView}-view`;

        // Initialize canvas previews
        setTimeout(() => this.initializeProjectPreviews(grid), 100);
    }

    createProjectCard(project, isFeatured = false) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.projectId = project.id;

        card.innerHTML = `
            <div class="project-preview">
                <canvas class="project-canvas" data-project="${project.id}"></canvas>
                <div class="project-overlay">
                    <button class="project-play-btn" onclick="window.open('${project.demoUrl}', '_blank')">
                        ▶
                    </button>
                </div>
            </div>
            <div class="project-info">
                <div class="project-header">
                    <div>
                        <h3 class="project-title">${project.title}</h3>
                        <span class="project-category">${project.category}</span>
                    </div>
                </div>
                <p class="project-description">${project.description}</p>
                <div class="project-tags">
                    ${project.tags.map(tag => `<span class="project-tag">#${tag}</span>`).join('')}
                </div>
                <div class="project-stats">
                    <span class="project-stat">
                        👁 ${this.formatNumber(project.views)}
                    </span>
                    <span class="project-stat">
                        ❤ ${this.formatNumber(project.likes)}
                    </span>
                    <span class="project-stat">
                        ⬇ ${this.formatNumber(project.downloads)}
                    </span>
                </div>
            </div>
        `;

        // Add click handler for navigation to project page
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.project-play-btn')) {
                this.navigateToProject(project.id);
            }
        });

        return card;
    }

    initializeProjectPreviews(container) {
        const canvases = container.querySelectorAll('.project-canvas');

        canvases.forEach(canvas => {
            const projectId = canvas.dataset.project;
            this.renderProjectPreview(canvas, projectId);
        });
    }

    renderProjectPreview(canvas, projectId) {
        if (!canvas || !projectId) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        // Set canvas size
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Render based on project type
        switch (projectId) {
            case 'buddhabrot':
                this.renderBuddhabrotPreview(ctx, rect.width, rect.height);
                break;
            case 'node.garden':
                this.renderNodeGardenPreview(ctx, rect.width, rect.height);
                break;
            case 'substrate':
                this.renderSubstratePreview(ctx, rect.width, rect.height);
                break;
            case 'deep.lorenz':
                this.renderLorenzPreview(ctx, rect.width, rect.height);
                break;
            case 'happy.place':
                this.renderHappyPlacePreview(ctx, rect.width, rect.height);
                break;
            case 'orbitals':
                this.renderOrbitalsPreview(ctx, rect.width, rect.height);
                break;
            default:
                this.renderDefaultPreview(ctx, rect.width, rect.height, projectId);
        }
    }

    renderBuddhabrotPreview(ctx, width, height) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Simple fractal-like pattern
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 0.5;

        for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = Math.random() * 20 + 5;

            ctx.beginPath();
            for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                const px = x + Math.cos(angle * 3) * radius * Math.sin(angle);
                const py = y + Math.sin(angle * 3) * radius * Math.cos(angle);
                if (angle === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
    }

    renderNodeGardenPreview(ctx, width, height) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Network nodes
        const nodes = [];
        for (let i = 0; i < 20; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 3 + 2
            });
        }

        // Draw connections
        ctx.strokeStyle = 'rgba(102, 255, 102, 0.3)';
        ctx.lineWidth = 1;
        nodes.forEach((node, i) => {
            nodes.slice(i + 1).forEach(otherNode => {
                const distance = Math.sqrt((node.x - otherNode.x) ** 2 + (node.y - otherNode.y) ** 2);
                if (distance < 80) {
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(otherNode.x, otherNode.y);
                    ctx.stroke();
                }
            });
        });

        // Draw nodes
        ctx.fillStyle = '#66FF66';
        nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    renderSubstratePreview(ctx, width, height) {
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, width, height);

        // Crack patterns
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;

        const cracks = [
            { x: width * 0.2, y: height * 0.3, angle: 0.5 },
            { x: width * 0.7, y: height * 0.1, angle: -0.3 },
            { x: width * 0.5, y: height * 0.8, angle: 1.2 }
        ];

        cracks.forEach(crack => {
            this.drawCrackBranch(ctx, crack.x, crack.y, crack.angle, 40, 0);
        });
    }

    drawCrackBranch(ctx, x, y, angle, length, depth) {
        if (depth > 3 || length < 5) return;

        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Branch
        if (Math.random() > 0.6) {
            const branchAngle = angle + (Math.random() - 0.5) * 1;
            this.drawCrackBranch(ctx, endX, endY, branchAngle, length * 0.7, depth + 1);
        }

        this.drawCrackBranch(ctx, endX, endY, angle + (Math.random() - 0.5) * 0.3, length * 0.8, depth + 1);
    }

    renderLorenzPreview(ctx, width, height) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Lorenz attractor simplified
        ctx.strokeStyle = '#9932CC';
        ctx.lineWidth = 1;

        let x = 1, y = 1, z = 1;
        const dt = 0.01;
        const sigma = 10, rho = 28, beta = 8/3;

        ctx.beginPath();
        for (let i = 0; i < 1000; i++) {
            const dx = sigma * (y - x) * dt;
            const dy = (rho * x - y - x * z) * dt;
            const dz = (x * y - beta * z) * dt;

            x += dx; y += dy; z += dz;

            const px = width/2 + x * 8;
            const py = height/2 + y * 8;

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }

    renderHappyPlacePreview(ctx, width, height) {
        // Warm gradient background
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FF69B4');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Floating particles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = Math.random() * 3 + 1;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderOrbitalsPreview(ctx, width, height) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Orbital paths
        const centerX = width / 2;
        const centerY = height / 2;

        for (let orbital = 0; orbital < 3; orbital++) {
            const radius = 30 + orbital * 25;
            const particles = 20 + orbital * 10;

            ctx.strokeStyle = `hsl(${180 + orbital * 60}, 100%, 60%)`;
            ctx.lineWidth = 1;

            // Draw orbital path
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Draw particles
            ctx.fillStyle = ctx.strokeStyle;
            for (let i = 0; i < particles; i++) {
                const angle = (i / particles) * Math.PI * 2;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;

                ctx.beginPath();
                ctx.arc(x, y, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    renderDefaultPreview(ctx, width, height, projectId) {
        // Generic abstract pattern
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#9932CC'];
        const bgColor = colors[Math.floor(Math.random() * colors.length)];

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 30 + 10;

            ctx.fillRect(x, y, size, size);
        }
    }

    initializeHeroBackground() {
        const canvas = this.elements.heroCanvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.resizeCanvas(canvas);

        // Simple animated background
        this.animateHeroBackground(ctx, canvas);
    }

    animateHeroBackground(ctx, canvas) {
        const animate = (time) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Dark background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Animated particles
            for (let i = 0; i < 50; i++) {
                const x = (Math.sin(time * 0.001 + i * 0.5) * 0.5 + 0.5) * canvas.width;
                const y = (Math.cos(time * 0.0007 + i * 0.3) * 0.5 + 0.5) * canvas.height;
                const alpha = (Math.sin(time * 0.002 + i) * 0.5 + 0.5) * 0.5;

                ctx.fillStyle = `rgba(255, 107, 107, ${alpha})`;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            this.animationFrameId = requestAnimationFrame(animate);
        };

        animate(0);
    }

    initializeNeuralConnections() {
        if (!this.elements.neuralCanvas) return;

        this.neuralConnections = new NeuralConnectionsViz(this.elements.neuralCanvas, this.projects);
        this.neuralConnections.init();
    }

    // Event handlers
    toggleSearch() {
        const overlay = this.elements.searchOverlay;
        const isActive = overlay.classList.contains('active');

        if (isActive) {
            overlay.classList.remove('active');
            this.elements.searchInput.value = '';
            this.searchTerm = '';
        } else {
            overlay.classList.add('active');
            setTimeout(() => this.elements.searchInput.focus(), 300);
        }
    }

    handleSearch(term) {
        this.searchTerm = term.toLowerCase();

        if (term.length > 2) {
            this.performSearch();
        } else {
            this.elements.searchResults.innerHTML = '';
        }
    }

    performSearch() {
        const results = this.projects.filter(project => {
            return project.title.toLowerCase().includes(this.searchTerm) ||
                   project.description.toLowerCase().includes(this.searchTerm) ||
                   project.tags.some(tag => tag.toLowerCase().includes(this.searchTerm));
        });

        this.renderSearchResults(results);
    }

    renderSearchResults(results) {
        const container = this.elements.searchResults;

        if (results.length === 0) {
            container.innerHTML = '<div class="no-results">No projects found</div>';
            return;
        }

        container.innerHTML = results.map(project => `
            <div class="search-result" onclick="window.ShowcaseApp.navigateToProject('${project.id}')">
                <div class="result-info">
                    <h4>${project.title}</h4>
                    <p>${project.description}</p>
                    <span class="result-category">${project.category}</span>
                </div>
            </div>
        `).join('');
    }

    handleCategoryFilter(category) {
        this.currentFilter = category;
        this.applyFilters();
    }

    handleSortFilter(sort) {
        this.currentSort = sort;
        this.applyFilters();
    }

    handleViewToggle(view) {
        this.currentView = view;

        // Update button states
        this.elements.viewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        this.renderAllProjects();
    }

    applyFilters() {
        let filtered = [...this.projects];

        // Apply category filter
        if (this.currentFilter) {
            filtered = filtered.filter(project => project.category === this.currentFilter);
        }

        // Apply sorting
        switch (this.currentSort) {
            case 'popular':
                filtered.sort((a, b) => b.likes - a.likes);
                break;
            case 'alphabetical':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'complexity':
                filtered.sort((a, b) => (b.tags.length || 0) - (a.tags.length || 0));
                break;
            case 'recent':
            default:
                filtered.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
                break;
        }

        this.filteredProjects = filtered;
        this.renderAllProjects();
    }

    navigateToCategory(category) {
        this.elements.categoryFilter.value = category;
        this.handleCategoryFilter(category);

        // Scroll to projects section
        document.querySelector('.all-projects').scrollIntoView({ behavior: 'smooth' });
    }

    navigateToProject(projectId) {
        // Navigate to individual project page
        window.location.href = `projects/${projectId}/index.html`;
    }

    handleResize() {
        if (this.elements.heroCanvas) {
            this.resizeCanvas(this.elements.heroCanvas);
        }

        if (this.neuralConnections) {
            this.neuralConnections.handleResize();
        }
    }

    resizeCanvas(canvas) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;

        const ctx = canvas.getContext('2d');
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    handleNeuralClick(event) {
        if (this.neuralConnections) {
            this.neuralConnections.handleClick(event);
        }
    }

    handleNeuralHover(event) {
        if (this.neuralConnections) {
            this.neuralConnections.handleHover(event);
        }
    }

    // Utility functions
    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        if (this.neuralConnections) {
            this.neuralConnections.destroy();
        }
    }
}

// Initialize when loaded
if (typeof window !== 'undefined') {
    window.BinaryRingShowcase = BinaryRingShowcase;
}