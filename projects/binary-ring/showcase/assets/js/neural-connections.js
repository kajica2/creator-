/**
 * Neural Connections Visualization
 * AI-powered project relationship mapping and visualization
 */

class NeuralConnectionsViz {
    constructor(canvas, projects) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.projects = projects || [];

        // Visualization state
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.hoveredNode = null;

        // Animation state
        this.animationId = null;
        this.time = 0;

        // Mouse interaction
        this.mousePos = { x: 0, y: 0 };
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        // Colors
        this.colors = {
            background: '#000510',
            node: '#00FFFF',
            nodeHover: '#FF00FF',
            nodeSelected: '#FFFF00',
            connection: '#00FFFF',
            connectionActive: '#FF00FF',
            text: '#FFFFFF',
            textMuted: '#888888'
        };

        // Neural network parameters
        this.neuralData = null;
        this.generateNeuralConnections();
    }

    init() {
        this.resizeCanvas();
        this.generateNodePositions();
        this.startAnimation();
        this.bindEvents();
    }

    generateNeuralConnections() {
        // Simulate AI-powered project relationship analysis
        this.neuralData = {
            categories: {
                'fractals': { weight: 1.0, connections: ['mathematical', 'contemplative'] },
                'attractors': { weight: 0.9, connections: ['mathematical', '3d'] },
                'organic': { weight: 0.8, connections: ['growth', 'natural'] },
                'networks': { weight: 0.7, connections: ['interactive', 'systems'] },
                'particles': { weight: 0.6, connections: ['physics', 'quantum'] },
                'emotional': { weight: 0.5, connections: ['wellness', 'therapeutic'] }
            },
            similarities: this.calculateProjectSimilarities(),
            clusters: this.identifyProjectClusters()
        };
    }

    calculateProjectSimilarities() {
        const similarities = {};

        this.projects.forEach((proj1, i) => {
            this.projects.forEach((proj2, j) => {
                if (i !== j) {
                    const similarity = this.computeSimilarity(proj1, proj2);
                    const key = `${proj1.id}-${proj2.id}`;
                    similarities[key] = similarity;
                }
            });
        });

        return similarities;
    }

    computeSimilarity(proj1, proj2) {
        let score = 0;

        // Category similarity
        if (proj1.category === proj2.category) {
            score += 0.4;
        }

        // Tag overlap
        const tagOverlap = proj1.tags.filter(tag => proj2.tags.includes(tag)).length;
        const maxTags = Math.max(proj1.tags.length, proj2.tags.length);
        score += (tagOverlap / maxTags) * 0.3;

        // Feature similarity
        const features = ['isInteractive', 'isAudioReactive', 'is3D', 'isRealtime'];
        const featureScore = features.reduce((acc, feature) => {
            return acc + (proj1[feature] === proj2[feature] ? 0.25 : 0);
        }, 0);
        score += featureScore * 0.3;

        return Math.min(1, score);
    }

    identifyProjectClusters() {
        // Simple clustering based on categories and features
        const clusters = {
            mathematical: this.projects.filter(p =>
                p.category === 'fractals' || p.category === 'attractors' || p.tags.includes('mathematical')
            ),
            interactive: this.projects.filter(p => p.isInteractive),
            contemplative: this.projects.filter(p =>
                p.tags.includes('contemplative') || p.category === 'emotional'
            ),
            realtime: this.projects.filter(p => p.isRealtime),
            threed: this.projects.filter(p => p.is3D)
        };

        return clusters;
    }

    generateNodePositions() {
        this.nodes = [];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.6;

        this.projects.forEach((project, index) => {
            // Arrange nodes in clusters based on neural analysis
            const clusterInfo = this.getProjectCluster(project);
            const clusterAngle = clusterInfo.angle;
            const clusterRadius = clusterInfo.radius;

            // Add some noise for natural positioning
            const angle = clusterAngle + (Math.random() - 0.5) * 0.5;
            const r = clusterRadius + (Math.random() - 0.5) * 50;

            const node = {
                id: project.id,
                project: project,
                x: centerX + Math.cos(angle) * r,
                y: centerY + Math.sin(angle) * r,
                originalX: centerX + Math.cos(angle) * r,
                originalY: centerY + Math.sin(angle) * r,
                vx: 0,
                vy: 0,
                radius: this.getNodeRadius(project),
                color: this.getNodeColor(project),
                cluster: clusterInfo.name,
                connections: [],
                activity: Math.random()
            };

            this.nodes.push(node);
        });

        this.generateConnections();
    }

    getProjectCluster(project) {
        // Determine cluster position based on project characteristics
        const clusters = {
            mathematical: { angle: 0, radius: 150, name: 'mathematical' },
            organic: { angle: Math.PI / 3, radius: 120, name: 'organic' },
            interactive: { angle: 2 * Math.PI / 3, radius: 140, name: 'interactive' },
            contemplative: { angle: Math.PI, radius: 130, name: 'contemplative' },
            realtime: { angle: 4 * Math.PI / 3, radius: 160, name: 'realtime' },
            particles: { angle: 5 * Math.PI / 3, radius: 110, name: 'particles' }
        };

        if (project.category === 'fractals' || project.category === 'attractors') {
            return clusters.mathematical;
        } else if (project.category === 'organic') {
            return clusters.organic;
        } else if (project.isInteractive) {
            return clusters.interactive;
        } else if (project.category === 'emotional' || project.tags.includes('contemplative')) {
            return clusters.contemplative;
        } else if (project.isRealtime) {
            return clusters.realtime;
        } else if (project.category === 'particles') {
            return clusters.particles;
        }

        return clusters.mathematical; // Default
    }

    getNodeRadius(project) {
        // Size based on popularity and features
        let radius = 8;

        if (project.isFeatured) radius += 3;
        if (project.isInteractive) radius += 2;
        if (project.likes > 200) radius += 2;
        if (project.views > 2000) radius += 2;

        return Math.min(radius, 15);
    }

    getNodeColor(project) {
        const categoryColors = {
            'fractals': '#FF6B6B',
            'attractors': '#9932CC',
            'organic': '#8B4513',
            'networks': '#66FF66',
            'particles': '#00BFFF',
            'emotional': '#FFD700'
        };

        return categoryColors[project.category] || '#4ECDC4';
    }

    generateConnections() {
        this.connections = [];

        this.nodes.forEach((node1, i) => {
            this.nodes.slice(i + 1).forEach(node2 => {
                const similarity = this.neuralData.similarities[`${node1.id}-${node2.id}`];

                if (similarity > 0.3) { // Only show strong connections
                    const connection = {
                        from: node1,
                        to: node2,
                        strength: similarity,
                        active: false,
                        pulse: Math.random() * Math.PI * 2
                    };

                    this.connections.push(connection);
                    node1.connections.push(connection);
                    node2.connections.push(connection);
                }
            });
        });
    }

    startAnimation() {
        const animate = (timestamp) => {
            this.time = timestamp * 0.001; // Convert to seconds
            this.update();
            this.render();
            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
    }

    update() {
        // Update node positions with gentle animation
        this.nodes.forEach(node => {
            // Gentle floating animation
            const floatOffset = Math.sin(this.time * 0.5 + node.activity * Math.PI * 2) * 2;
            node.y = node.originalY + floatOffset;

            // Pulsing activity
            node.activity += 0.01;
            if (node.activity > 1) node.activity = 0;
        });

        // Update connection pulses
        this.connections.forEach(connection => {
            connection.pulse += 0.05;
            if (connection.pulse > Math.PI * 2) connection.pulse = 0;
        });
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections first
        this.drawConnections();

        // Draw nodes
        this.drawNodes();

        // Draw cluster labels
        this.drawClusterLabels();

        // Draw info panel if node is selected
        if (this.selectedNode) {
            this.drawInfoPanel();
        }
    }

    drawConnections() {
        this.connections.forEach(connection => {
            const alpha = connection.active ? 0.8 : 0.2;
            const pulse = Math.sin(connection.pulse) * 0.3 + 0.7;

            this.ctx.strokeStyle = connection.active ?
                `rgba(255, 0, 255, ${alpha * pulse})` :
                `rgba(0, 255, 255, ${alpha * pulse * connection.strength})`;

            this.ctx.lineWidth = connection.active ? 2 : 1;
            this.ctx.beginPath();
            this.ctx.moveTo(connection.from.x, connection.from.y);
            this.ctx.lineTo(connection.to.x, connection.to.y);
            this.ctx.stroke();

            // Draw data flow particles
            if (connection.active) {
                this.drawDataFlow(connection);
            }
        });
    }

    drawDataFlow(connection) {
        const progress = (Math.sin(this.time * 2 + connection.pulse) + 1) / 2;
        const x = connection.from.x + (connection.to.x - connection.from.x) * progress;
        const y = connection.from.y + (connection.to.y - connection.from.y) * progress;

        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawNodes() {
        this.nodes.forEach(node => {
            const isHovered = node === this.hoveredNode;
            const isSelected = node === this.selectedNode;

            // Node glow effect
            if (isHovered || isSelected) {
                const gradient = this.ctx.createRadialGradient(
                    node.x, node.y, 0,
                    node.x, node.y, node.radius * 3
                );
                gradient.addColorStop(0, `${node.color}88`);
                gradient.addColorStop(1, 'transparent');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Main node
            this.ctx.fillStyle = isSelected ? this.colors.nodeSelected :
                               isHovered ? this.colors.nodeHover :
                               node.color;

            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Node border
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = isSelected ? 3 : 1;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            this.ctx.stroke();

            // Activity indicator
            const activitySize = node.radius * 0.3 * (Math.sin(node.activity * Math.PI * 4) * 0.5 + 1);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, activitySize, 0, Math.PI * 2);
            this.ctx.fill();

            // Node label (only for hovered/selected)
            if (isHovered || isSelected) {
                this.ctx.fillStyle = this.colors.text;
                this.ctx.font = '12px Inter, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(node.project.title, node.x, node.y - node.radius - 10);
            }
        });
    }

    drawClusterLabels() {
        const clusters = ['mathematical', 'organic', 'interactive', 'contemplative', 'realtime', 'particles'];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        clusters.forEach((cluster, index) => {
            const angle = (index / clusters.length) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * 200;
            const y = centerY + Math.sin(angle) * 200;

            this.ctx.fillStyle = this.colors.textMuted;
            this.ctx.font = '10px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(cluster.toUpperCase(), x, y);
        });
    }

    drawInfoPanel() {
        if (!this.selectedNode) return;

        const project = this.selectedNode.project;
        const panelWidth = 250;
        const panelHeight = 150;
        const panelX = 20;
        const panelY = 20;

        // Panel background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

        // Panel border
        this.ctx.strokeStyle = this.selectedNode.color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Project info
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 16px Inter, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(project.title, panelX + 15, panelY + 25);

        this.ctx.font = '12px Inter, sans-serif';
        this.ctx.fillStyle = this.colors.textMuted;
        this.ctx.fillText(project.category.toUpperCase(), panelX + 15, panelY + 45);

        // Stats
        const stats = [
            `Views: ${this.formatNumber(project.views)}`,
            `Likes: ${this.formatNumber(project.likes)}`,
            `Downloads: ${this.formatNumber(project.downloads)}`
        ];

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '10px Inter, sans-serif';
        stats.forEach((stat, index) => {
            this.ctx.fillText(stat, panelX + 15, panelY + 65 + index * 15);
        });

        // Connections info
        this.ctx.fillStyle = this.colors.textMuted;
        this.ctx.fillText(
            `Connected to ${this.selectedNode.connections.length} projects`,
            panelX + 15,
            panelY + 130
        );
    }

    // Event handling
    bindEvents() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mouseout', () => this.handleMouseOut());
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos = {
            x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (event.clientY - rect.top) * (this.canvas.height / rect.height)
        };

        // Check for node hover
        this.hoveredNode = this.getNodeAtPosition(this.mousePos.x, this.mousePos.y);

        // Update connection states
        this.updateConnectionStates();

        // Update cursor
        this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'default';
    }

    handleClick(event) {
        const clickedNode = this.getNodeAtPosition(this.mousePos.x, this.mousePos.y);

        if (clickedNode) {
            if (this.selectedNode === clickedNode) {
                // Double click - navigate to project
                this.navigateToProject(clickedNode.project.id);
            } else {
                // Select node
                this.selectedNode = clickedNode;
            }
        } else {
            // Deselect
            this.selectedNode = null;
        }

        this.updateConnectionStates();
    }

    handleMouseOut() {
        this.hoveredNode = null;
        this.updateConnectionStates();
        this.canvas.style.cursor = 'default';
    }

    getNodeAtPosition(x, y) {
        return this.nodes.find(node => {
            const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
            return distance <= node.radius;
        });
    }

    updateConnectionStates() {
        const activeNode = this.selectedNode || this.hoveredNode;

        this.connections.forEach(connection => {
            connection.active = activeNode &&
                (connection.from === activeNode || connection.to === activeNode);
        });
    }

    navigateToProject(projectId) {
        window.location.href = `../projects/${projectId}/index.html`;
    }

    // Resize handling
    handleResize() {
        this.resizeCanvas();
        this.generateNodePositions(); // Recalculate positions
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    // Utility functions
    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Public API
    highlightProject(projectId) {
        const node = this.nodes.find(n => n.project.id === projectId);
        if (node) {
            this.selectedNode = node;
            this.updateConnectionStates();
        }
    }

    getProjectConnections(projectId) {
        const node = this.nodes.find(n => n.project.id === projectId);
        return node ? node.connections.map(conn => {
            const otherNode = conn.from === node ? conn.to : conn.from;
            return {
                project: otherNode.project,
                strength: conn.strength
            };
        }) : [];
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.NeuralConnectionsViz = NeuralConnectionsViz;
}