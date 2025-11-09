/**
 * Node Garden - Dynamic Network Visualization
 * A living system of interconnected nodes that grow, connect, and evolve
 */

class NodeGarden {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Core parameters
        this.params = {
            maxNodes: 150,
            connectionDistance: 120,
            growthRate: 0.02,
            nodeLifespan: 300,
            attractionForce: 0.001,
            repulsionForce: 0.01,
            dampening: 0.95,
            backgroundColor: '#0a0a0a',
            nodeColor: '#66ff66',
            connectionColor: '#003300',
            glowIntensity: 0.3
        };

        this.nodes = [];
        this.time = 0;
        this.lastSpawn = 0;
        this.spawnRate = 60; // frames between spawns

        this.init();
    }

    init() {
        // Create initial seed nodes
        for (let i = 0; i < 5; i++) {
            this.spawnNode(
                Math.random() * this.width,
                Math.random() * this.height,
                'seed'
            );
        }
    }

    spawnNode(x, y, type = 'normal') {
        const node = {
            id: Math.random().toString(36).substr(2, 9),
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: type === 'seed' ? 8 : Math.random() * 4 + 2,
            age: 0,
            maxAge: this.params.nodeLifespan + Math.random() * 100,
            type: type,
            energy: 1.0,
            connections: new Set(),
            pulsePhase: Math.random() * Math.PI * 2,
            growthPhase: Math.random() * Math.PI * 2
        };

        this.nodes.push(node);
        return node;
    }

    updateNodes() {
        // Remove dead nodes
        this.nodes = this.nodes.filter(node => {
            node.age++;
            node.energy = Math.max(0, 1 - (node.age / node.maxAge));

            // Remove connections to dead nodes
            if (node.energy <= 0) {
                this.nodes.forEach(other => other.connections.delete(node.id));
                return false;
            }
            return true;
        });

        // Spawn new nodes if below threshold
        if (this.nodes.length < this.params.maxNodes &&
            this.time - this.lastSpawn > this.spawnRate) {

            // Find a good spawn location near existing nodes
            const parent = this.nodes[Math.floor(Math.random() * this.nodes.length)];
            if (parent && parent.energy > 0.5) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 50 + Math.random() * 100;
                const x = parent.x + Math.cos(angle) * distance;
                const y = parent.y + Math.sin(angle) * distance;

                if (x > 0 && x < this.width && y > 0 && y < this.height) {
                    this.spawnNode(x, y, 'offspring');
                    this.lastSpawn = this.time;
                }
            }
        }

        // Update node positions and connections
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];

            // Clear old connections
            node.connections.clear();

            // Apply forces from other nodes
            for (let j = 0; j < this.nodes.length; j++) {
                if (i === j) continue;

                const other = this.nodes[j];
                const dx = other.x - node.x;
                const dy = other.y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.params.connectionDistance) {
                    // Add connection
                    node.connections.add(other.id);

                    // Apply attraction force
                    const force = this.params.attractionForce * node.energy * other.energy;
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;

                    node.vx += fx;
                    node.vy += fy;
                } else if (distance < 50) {
                    // Apply repulsion force for very close nodes
                    const force = this.params.repulsionForce / (distance * distance);
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;

                    node.vx -= fx;
                    node.vy -= fy;
                }
            }

            // Growth oscillation
            const growthForce = Math.sin(this.time * 0.01 + node.growthPhase) * 0.001;
            node.vx += (Math.random() - 0.5) * growthForce;
            node.vy += (Math.random() - 0.5) * growthForce;

            // Update position
            node.x += node.vx;
            node.y += node.vy;

            // Apply dampening
            node.vx *= this.params.dampening;
            node.vy *= this.params.dampening;

            // Boundary repulsion
            const margin = 50;
            if (node.x < margin) node.vx += (margin - node.x) * 0.001;
            if (node.x > this.width - margin) node.vx -= (node.x - (this.width - margin)) * 0.001;
            if (node.y < margin) node.vy += (margin - node.y) * 0.001;
            if (node.y > this.height - margin) node.vy -= (node.y - (this.height - margin)) * 0.001;
        }
    }

    render() {
        // Clear with fade effect
        this.ctx.fillStyle = this.params.backgroundColor + '20';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw connections
        this.ctx.strokeStyle = this.params.connectionColor;
        this.ctx.lineWidth = 1;

        for (const node of this.nodes) {
            for (const connectionId of node.connections) {
                const connectedNode = this.nodes.find(n => n.id === connectionId);
                if (!connectedNode) continue;

                // Only draw each connection once
                if (node.id < connectionId) {
                    const opacity = Math.min(node.energy, connectedNode.energy);
                    this.ctx.globalAlpha = opacity * 0.3;

                    // Pulse effect
                    const pulse = Math.sin(this.time * 0.05 + node.pulsePhase) * 0.5 + 0.5;
                    this.ctx.lineWidth = 0.5 + pulse * 1.5;

                    this.ctx.beginPath();
                    this.ctx.moveTo(node.x, node.y);
                    this.ctx.lineTo(connectedNode.x, connectedNode.y);
                    this.ctx.stroke();
                }
            }
        }

        // Draw nodes
        for (const node of this.nodes) {
            this.ctx.globalAlpha = node.energy;

            // Node glow
            const glowSize = node.size * 3;
            const gradient = this.ctx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, glowSize
            );
            gradient.addColorStop(0, this.params.nodeColor + '40');
            gradient.addColorStop(1, this.params.nodeColor + '00');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
            this.ctx.fill();

            // Node core
            this.ctx.fillStyle = this.params.nodeColor;
            const pulse = Math.sin(this.time * 0.03 + node.pulsePhase) * 0.3 + 0.7;
            const currentSize = node.size * pulse * node.energy;

            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, currentSize, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw node type indicator
            if (node.type === 'seed') {
                this.ctx.strokeStyle = this.params.nodeColor;
                this.ctx.lineWidth = 1;
                this.ctx.globalAlpha = node.energy * 0.5;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, node.size * 1.5, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }

        this.ctx.globalAlpha = 1;
    }

    animate() {
        this.time++;
        this.updateNodes();
        this.render();
        requestAnimationFrame(() => this.animate());
    }

    // Interactive methods
    addNodeAt(x, y) {
        this.spawnNode(x, y, 'user');
    }

    setParameters(newParams) {
        Object.assign(this.params, newParams);
    }

    getStats() {
        const totalConnections = this.nodes.reduce((sum, node) => sum + node.connections.size, 0);
        return {
            nodeCount: this.nodes.length,
            connectionCount: totalConnections / 2, // Each connection counted twice
            averageEnergy: this.nodes.reduce((sum, node) => sum + node.energy, 0) / this.nodes.length,
            time: this.time
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NodeGarden;
}