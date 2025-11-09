/**
 * Binary Ring Neural Visualizations
 * Advanced neural network and connection visualizations using WebGL and Canvas
 */

class NeuralVisualization {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.context2d = null;
        this.network = null;
        this.connections = new Map();
        this.nodes = [];
        this.particles = [];
        this.animationFrame = null;
        this.isRunning = false;

        // Neural network configuration
        this.config = {
            nodeCount: 50,
            connectionThreshold: 150,
            maxConnections: 3,
            learningRate: 0.1,
            activation: 'sigmoid',
            layers: [10, 20, 15, 5],
            networkType: 'feedforward' // 'feedforward', 'recurrent', 'convolutional'
        };

        // Visual configuration
        this.visualConfig = {
            nodeRadius: 8,
            connectionWidth: 2,
            particleSpeed: 2,
            colorScheme: 'neural', // 'neural', 'electric', 'organic', 'data'
            showWeights: true,
            showActivations: true,
            showBiases: false,
            animateSignals: true,
            backgroundNoise: true
        };

        // Performance tracking
        this.performance = {
            fps: 0,
            frameTime: 0,
            lastFrameTime: 0,
            frameCount: 0
        };

        this.init();
    }

    async init() {
        try {
            await this.initCanvas();
            await this.initWebGL();
            await this.initShaders();
            await this.createNeuralNetwork();
            await this.initInteractions();
            await this.initControls();

            this.emit('neural:initialized');
            console.log('Neural Visualization initialized successfully');
        } catch (error) {
            console.error('Neural visualization initialization failed:', error);
            this.handleError(error);
        }
    }

    // Canvas and WebGL Setup
    async initCanvas() {
        this.canvas = document.querySelector('[data-neural-canvas]');
        if (!this.canvas) {
            this.canvas = this.createCanvas();
        }

        // Set up 2D fallback context
        this.context2d = this.canvas.getContext('2d');

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.setAttribute('data-neural-canvas', '');
        canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: auto;
        `;

        const container = document.querySelector('[data-neural-container]') || document.body;
        container.appendChild(canvas);

        return canvas;
    }

    async initWebGL() {
        try {
            this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');

            if (!this.gl) {
                console.warn('WebGL not supported, falling back to 2D canvas');
                this.useWebGL = false;
                return;
            }

            this.useWebGL = true;

            // Enable extensions
            const extInstanced = this.gl.getExtension('ANGLE_instanced_arrays');
            const extFloatTexture = this.gl.getExtension('OES_texture_float');

            // Configure WebGL
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.enable(this.gl.DEPTH_TEST);

            console.log('WebGL initialized for neural visualization');
        } catch (error) {
            console.warn('WebGL initialization failed:', error);
            this.useWebGL = false;
        }
    }

    async initShaders() {
        if (!this.useWebGL) return;

        // Vertex shader for nodes
        this.nodeVertexShader = `
            attribute vec2 a_position;
            attribute vec2 a_center;
            attribute float a_radius;
            attribute vec3 a_color;
            attribute float a_activation;

            uniform vec2 u_resolution;
            uniform float u_time;
            uniform mat3 u_transform;

            varying vec3 v_color;
            varying float v_activation;
            varying vec2 v_center;
            varying float v_radius;

            void main() {
                vec2 position = (u_transform * vec3(a_position * a_radius + a_center, 1.0)).xy;

                // Convert to clip space
                vec2 clipSpace = ((position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);

                gl_Position = vec4(clipSpace, 0, 1);

                v_color = a_color;
                v_activation = a_activation;
                v_center = a_center;
                v_radius = a_radius;
            }
        `;

        // Fragment shader for nodes
        this.nodeFragmentShader = `
            precision mediump float;

            uniform float u_time;
            uniform vec2 u_resolution;

            varying vec3 v_color;
            varying float v_activation;
            varying vec2 v_center;
            varying float v_radius;

            void main() {
                vec2 center = gl_FragCoord.xy;
                float dist = distance(center, v_center);

                // Create circular node with glow
                float alpha = smoothstep(v_radius, v_radius - 2.0, dist);

                // Activation-based pulsing
                float pulse = 0.5 + 0.5 * sin(u_time * 3.0 + v_activation * 10.0);
                vec3 color = v_color * (0.8 + 0.4 * v_activation * pulse);

                // Add rim lighting
                float rim = 1.0 - smoothstep(v_radius - 3.0, v_radius, dist);
                color += rim * vec3(0.3, 0.6, 1.0) * v_activation;

                gl_FragColor = vec4(color, alpha * v_activation);
            }
        `;

        // Vertex shader for connections
        this.connectionVertexShader = `
            attribute vec2 a_position;
            attribute vec2 a_start;
            attribute vec2 a_end;
            attribute float a_weight;
            attribute float a_signal;

            uniform vec2 u_resolution;
            uniform float u_time;
            uniform mat3 u_transform;

            varying float v_weight;
            varying float v_signal;
            varying vec2 v_start;
            varying vec2 v_end;

            void main() {
                vec2 position = (u_transform * vec3(a_position, 1.0)).xy;
                vec2 clipSpace = ((position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);

                gl_Position = vec4(clipSpace, 0, 1);

                v_weight = a_weight;
                v_signal = a_signal;
                v_start = a_start;
                v_end = a_end;
            }
        `;

        // Fragment shader for connections
        this.connectionFragmentShader = `
            precision mediump float;

            uniform float u_time;
            uniform vec2 u_resolution;

            varying float v_weight;
            varying float v_signal;
            varying vec2 v_start;
            varying vec2 v_end;

            void main() {
                // Weight-based color intensity
                float intensity = abs(v_weight);
                vec3 color = v_weight > 0.0 ?
                    vec3(0.2, 0.8, 0.3) : // Positive weights - green
                    vec3(0.8, 0.3, 0.2);  // Negative weights - red

                // Signal animation
                vec2 lineVec = v_end - v_start;
                float lineLength = length(lineVec);
                vec2 currentPos = gl_FragCoord.xy;

                // Calculate distance from line
                vec2 toPoint = currentPos - v_start;
                float projLength = dot(toPoint, lineVec) / lineLength;
                float distFromLine = length(toPoint - lineVec * (projLength / lineLength));

                // Signal pulse effect
                float signalPos = mod(u_time * 100.0 + v_signal * 50.0, lineLength);
                float signalDistance = abs(projLength - signalPos);
                float signalGlow = exp(-signalDistance * 0.1) * v_signal;

                float alpha = intensity * (1.0 - smoothstep(0.0, 2.0, distFromLine));
                alpha += signalGlow;

                gl_FragColor = vec4(color * intensity, alpha);
            }
        `;

        // Particle system shaders
        this.particleVertexShader = `
            attribute vec2 a_position;
            attribute vec2 a_velocity;
            attribute float a_life;
            attribute vec3 a_color;

            uniform vec2 u_resolution;
            uniform float u_time;
            uniform float u_deltaTime;

            varying vec3 v_color;
            varying float v_life;

            void main() {
                vec2 position = a_position + a_velocity * u_deltaTime;
                vec2 clipSpace = ((position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);

                gl_Position = vec4(clipSpace, 0, 1);
                gl_PointSize = 3.0 * a_life;

                v_color = a_color;
                v_life = a_life;
            }
        `;

        this.particleFragmentShader = `
            precision mediump float;

            varying vec3 v_color;
            varying float v_life;

            void main() {
                vec2 center = gl_PointCoord - 0.5;
                float dist = length(center);

                float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * v_life;
                gl_FragColor = vec4(v_color, alpha);
            }
        `;

        // Compile and link shaders
        this.nodeProgram = this.createShaderProgram(this.nodeVertexShader, this.nodeFragmentShader);
        this.connectionProgram = this.createShaderProgram(this.connectionVertexShader, this.connectionFragmentShader);
        this.particleProgram = this.createShaderProgram(this.particleVertexShader, this.particleFragmentShader);
    }

    createShaderProgram(vertexSource, fragmentSource) {
        if (!this.gl) return null;

        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);

        if (!vertexShader || !fragmentShader) return null;

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Shader program linking failed:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    compileShader(type, source) {
        if (!this.gl) return null;

        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation failed:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    // Neural Network Creation
    async createNeuralNetwork() {
        this.network = new NeuralNetwork(this.config);
        await this.network.initialize();

        this.createNetworkVisualization();
        this.emit('network:created', { network: this.network });
    }

    createNetworkVisualization() {
        const { width, height } = this.getCanvasDimensions();

        // Create nodes based on network layers
        this.nodes = [];
        const layers = this.network.getLayers();

        layers.forEach((layer, layerIndex) => {
            const layerX = (width / (layers.length + 1)) * (layerIndex + 1);
            const nodeCount = layer.size;

            for (let i = 0; i < nodeCount; i++) {
                const nodeY = (height / (nodeCount + 1)) * (i + 1);

                this.nodes.push({
                    id: `${layerIndex}-${i}`,
                    layer: layerIndex,
                    index: i,
                    x: layerX,
                    y: nodeY,
                    radius: this.visualConfig.nodeRadius,
                    activation: Math.random(),
                    bias: layer.biases ? layer.biases[i] : 0,
                    color: this.getNodeColor(layerIndex, layers.length),
                    connections: []
                });
            }
        });

        // Create connections based on network weights
        this.createConnections();

        // Initialize particles for signal animation
        this.initParticleSystem();
    }

    createConnections() {
        this.connections.clear();

        const layers = this.network.getLayers();

        for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex++) {
            const currentLayer = this.getLayerNodes(layerIndex);
            const nextLayer = this.getLayerNodes(layerIndex + 1);
            const weights = layers[layerIndex].weights;

            currentLayer.forEach((startNode, i) => {
                nextLayer.forEach((endNode, j) => {
                    const weight = weights ? weights[i][j] : (Math.random() - 0.5) * 2;

                    if (Math.abs(weight) > 0.1) { // Only show significant connections
                        const connectionId = `${startNode.id}->${endNode.id}`;

                        this.connections.set(connectionId, {
                            id: connectionId,
                            startNode,
                            endNode,
                            weight,
                            signal: 0,
                            active: false,
                            lastSignal: 0
                        });

                        startNode.connections.push(connectionId);
                    }
                });
            });
        }
    }

    getLayerNodes(layerIndex) {
        return this.nodes.filter(node => node.layer === layerIndex);
    }

    getNodeColor(layerIndex, totalLayers) {
        const schemes = {
            neural: {
                input: [0.3, 0.7, 1.0],
                hidden: [0.7, 0.3, 0.9],
                output: [1.0, 0.5, 0.2]
            },
            electric: {
                input: [0.0, 0.8, 1.0],
                hidden: [0.5, 0.0, 1.0],
                output: [1.0, 0.0, 0.5]
            },
            organic: {
                input: [0.2, 0.8, 0.3],
                hidden: [0.8, 0.6, 0.2],
                output: [0.9, 0.3, 0.1]
            }
        };

        const scheme = schemes[this.visualConfig.colorScheme] || schemes.neural;

        if (layerIndex === 0) return scheme.input;
        if (layerIndex === totalLayers - 1) return scheme.output;
        return scheme.hidden;
    }

    // Particle System
    initParticleSystem() {
        this.particles = [];
        this.particlePool = [];

        // Pre-allocate particle pool
        for (let i = 0; i < 1000; i++) {
            this.particlePool.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 0,
            color: [1, 1, 1],
            size: 1,
            active: false
        };
    }

    spawnParticle(x, y, vx, vy, color, life = 1.0) {
        const particle = this.particlePool.find(p => !p.active);
        if (!particle) return null;

        particle.x = x;
        particle.y = y;
        particle.vx = vx;
        particle.vy = vy;
        particle.life = life;
        particle.maxLife = life;
        particle.color = [...color];
        particle.active = true;

        this.particles.push(particle);
        return particle;
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            if (!particle.active) return false;

            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;

            if (particle.life <= 0) {
                particle.active = false;
                return false;
            }

            return true;
        });
    }

    // Animation and Rendering
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTime = performance.now();
        this.animate();

        this.emit('animation:started');
    }

    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        this.emit('animation:stopped');
    }

    animate() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.updatePerformance(deltaTime);
        this.updateNetwork(deltaTime);
        this.updateParticles(deltaTime);
        this.render(currentTime);

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    updatePerformance(deltaTime) {
        this.performance.frameTime = deltaTime * 1000;
        this.performance.frameCount++;

        if (this.performance.frameCount % 60 === 0) {
            this.performance.fps = Math.round(1 / deltaTime);
            this.emit('performance:update', this.performance);
        }
    }

    updateNetwork(deltaTime) {
        // Simulate network activity
        if (Math.random() < 0.1) { // 10% chance per frame
            this.propagateSignal();
        }

        // Update node activations
        this.nodes.forEach(node => {
            // Decay activation over time
            node.activation *= 0.95;

            // Add some noise for visual interest
            if (this.visualConfig.backgroundNoise) {
                node.activation += (Math.random() - 0.5) * 0.05;
            }

            node.activation = Math.max(0, Math.min(1, node.activation));
        });

        // Update connection signals
        this.connections.forEach(connection => {
            if (connection.active) {
                connection.signal -= deltaTime * 2; // Signal decay

                if (connection.signal <= 0) {
                    connection.active = false;
                    connection.signal = 0;
                }
            }
        });
    }

    propagateSignal() {
        // Start signal from input layer
        const inputNodes = this.getLayerNodes(0);
        const startNode = inputNodes[Math.floor(Math.random() * inputNodes.length)];

        this.activateNode(startNode, 0.8);
        this.propagateFromNode(startNode);
    }

    activateNode(node, activation) {
        node.activation = Math.max(node.activation, activation);

        // Spawn activation particles
        if (this.visualConfig.animateSignals) {
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i;
                const speed = 20;
                this.spawnParticle(
                    node.x,
                    node.y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    node.color,
                    0.5
                );
            }
        }
    }

    propagateFromNode(node) {
        node.connections.forEach(connectionId => {
            const connection = this.connections.get(connectionId);
            if (!connection) return;

            // Delay propagation to simulate neural timing
            setTimeout(() => {
                connection.signal = 1.0;
                connection.active = true;

                // Activate target node
                const targetActivation = node.activation * Math.abs(connection.weight);
                this.activateNode(connection.endNode, targetActivation);

                // Continue propagation
                if (Math.random() < Math.abs(connection.weight)) {
                    this.propagateFromNode(connection.endNode);
                }
            }, Math.random() * 100);
        });
    }

    render(time) {
        if (this.useWebGL) {
            this.renderWebGL(time);
        } else {
            this.render2D(time);
        }
    }

    renderWebGL(time) {
        const gl = this.gl;
        const { width, height } = this.getCanvasDimensions();

        gl.viewport(0, 0, width, height);
        gl.clearColor(0.02, 0.02, 0.05, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Render connections first
        this.renderConnectionsWebGL(time);

        // Render nodes on top
        this.renderNodesWebGL(time);

        // Render particles
        this.renderParticlesWebGL(time);
    }

    renderConnectionsWebGL(time) {
        if (!this.connectionProgram) return;

        const gl = this.gl;
        gl.useProgram(this.connectionProgram);

        // Set uniforms
        const timeLocation = gl.getUniformLocation(this.connectionProgram, 'u_time');
        const resolutionLocation = gl.getUniformLocation(this.connectionProgram, 'u_resolution');

        gl.uniform1f(timeLocation, time * 0.001);
        gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);

        // Render each connection as a line
        this.connections.forEach(connection => {
            this.renderConnectionWebGL(connection);
        });
    }

    renderConnectionWebGL(connection) {
        const gl = this.gl;

        // Create line geometry
        const vertices = new Float32Array([
            connection.startNode.x, connection.startNode.y,
            connection.endNode.x, connection.endNode.y
        ]);

        // Create and bind buffer
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Set up attributes
        const positionLocation = gl.getAttribLocation(this.connectionProgram, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Draw line
        gl.drawArrays(gl.LINES, 0, 2);

        // Clean up
        gl.deleteBuffer(buffer);
    }

    renderNodesWebGL(time) {
        if (!this.nodeProgram) return;

        const gl = this.gl;
        gl.useProgram(this.nodeProgram);

        // Set uniforms
        const timeLocation = gl.getUniformLocation(this.nodeProgram, 'u_time');
        const resolutionLocation = gl.getUniformLocation(this.nodeProgram, 'u_resolution');

        gl.uniform1f(timeLocation, time * 0.001);
        gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);

        this.nodes.forEach(node => {
            this.renderNodeWebGL(node);
        });
    }

    renderNodeWebGL(node) {
        const gl = this.gl;

        // Create circle geometry
        const segments = 16;
        const vertices = new Float32Array((segments + 2) * 2);

        // Center vertex
        vertices[0] = 0;
        vertices[1] = 0;

        // Circle vertices
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            vertices[(i + 1) * 2] = Math.cos(angle);
            vertices[(i + 1) * 2 + 1] = Math.sin(angle);
        }

        // Create and bind buffer
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Set up attributes
        const positionLocation = gl.getAttribLocation(this.nodeProgram, 'a_position');
        const centerLocation = gl.getAttribLocation(this.nodeProgram, 'a_center');
        const radiusLocation = gl.getAttribLocation(this.nodeProgram, 'a_radius');
        const colorLocation = gl.getAttribLocation(this.nodeProgram, 'a_color');
        const activationLocation = gl.getAttribLocation(this.nodeProgram, 'a_activation');

        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Set node-specific attributes
        gl.vertexAttrib2f(centerLocation, node.x, node.y);
        gl.vertexAttrib1f(radiusLocation, node.radius);
        gl.vertexAttrib3f(colorLocation, ...node.color);
        gl.vertexAttrib1f(activationLocation, node.activation);

        // Draw triangle fan
        gl.drawArrays(gl.TRIANGLE_FAN, 0, segments + 2);

        // Clean up
        gl.deleteBuffer(buffer);
    }

    renderParticlesWebGL(time) {
        if (!this.particleProgram || this.particles.length === 0) return;

        const gl = this.gl;
        gl.useProgram(this.particleProgram);

        // Create particle data
        const particleData = new Float32Array(this.particles.length * 6); // x, y, vx, vy, life, color

        this.particles.forEach((particle, index) => {
            const offset = index * 6;
            particleData[offset] = particle.x;
            particleData[offset + 1] = particle.y;
            particleData[offset + 2] = particle.vx;
            particleData[offset + 3] = particle.vy;
            particleData[offset + 4] = particle.life / particle.maxLife;
            particleData[offset + 5] = particle.color[0]; // Simplified color
        });

        // Create and bind buffer
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.DYNAMIC_DRAW);

        // Set up attributes
        const positionLocation = gl.getAttribLocation(this.particleProgram, 'a_position');
        const velocityLocation = gl.getAttribLocation(this.particleProgram, 'a_velocity');
        const lifeLocation = gl.getAttribLocation(this.particleProgram, 'a_life');

        gl.enableVertexAttribArray(positionLocation);
        gl.enableVertexAttribArray(velocityLocation);
        gl.enableVertexAttribArray(lifeLocation);

        const stride = 6 * 4; // 6 floats * 4 bytes
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribPointer(velocityLocation, 2, gl.FLOAT, false, stride, 8);
        gl.vertexAttribPointer(lifeLocation, 1, gl.FLOAT, false, stride, 16);

        // Set uniforms
        const timeLocation = gl.getUniformLocation(this.particleProgram, 'u_time');
        const resolutionLocation = gl.getUniformLocation(this.particleProgram, 'u_resolution');
        const deltaTimeLocation = gl.getUniformLocation(this.particleProgram, 'u_deltaTime');

        gl.uniform1f(timeLocation, time * 0.001);
        gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
        gl.uniform1f(deltaTimeLocation, this.performance.frameTime * 0.001);

        // Draw particles as points
        gl.drawArrays(gl.POINTS, 0, this.particles.length);

        // Clean up
        gl.deleteBuffer(buffer);
    }

    render2D(time) {
        const ctx = this.context2d;
        const { width, height } = this.getCanvasDimensions();

        // Clear canvas
        ctx.fillStyle = 'rgba(5, 5, 15, 1)';
        ctx.fillRect(0, 0, width, height);

        // Render connections
        this.renderConnections2D(ctx, time);

        // Render nodes
        this.renderNodes2D(ctx, time);

        // Render particles
        this.renderParticles2D(ctx, time);

        // Render UI overlay
        this.renderUI2D(ctx);
    }

    renderConnections2D(ctx, time) {
        this.connections.forEach(connection => {
            const { startNode, endNode, weight, signal, active } = connection;

            ctx.beginPath();
            ctx.moveTo(startNode.x, startNode.y);
            ctx.lineTo(endNode.x, endNode.y);

            // Weight-based styling
            const intensity = Math.abs(weight);
            const alpha = 0.3 + intensity * 0.7;

            if (weight > 0) {
                ctx.strokeStyle = `rgba(100, 255, 150, ${alpha})`;
            } else {
                ctx.strokeStyle = `rgba(255, 100, 150, ${alpha})`;
            }

            ctx.lineWidth = intensity * this.visualConfig.connectionWidth;
            ctx.stroke();

            // Signal animation
            if (active && signal > 0) {
                const signalPos = 1 - signal;
                const signalX = startNode.x + (endNode.x - startNode.x) * signalPos;
                const signalY = startNode.y + (endNode.y - startNode.y) * signalPos;

                ctx.beginPath();
                ctx.arc(signalX, signalY, 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${signal})`;
                ctx.fill();
            }
        });
    }

    renderNodes2D(ctx, time) {
        this.nodes.forEach(node => {
            const { x, y, radius, color, activation } = node;

            // Node base
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);

            const [r, g, b] = color;
            const alpha = 0.5 + activation * 0.5;
            ctx.fillStyle = `rgba(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)}, ${alpha})`;
            ctx.fill();

            // Activation glow
            if (activation > 0.5) {
                const glowRadius = radius * (1 + activation);
                const gradient = ctx.createRadialGradient(x, y, radius, x, y, glowRadius);
                gradient.addColorStop(0, `rgba(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)}, 0.5)`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.beginPath();
                ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            // Node border
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + activation * 0.5})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }

    renderParticles2D(ctx, time) {
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            const [r, g, b] = particle.color;

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)}, ${alpha})`;
            ctx.fill();
        });
    }

    renderUI2D(ctx) {
        if (!this.config.showDebug) return;

        // Performance metrics
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '12px monospace';
        ctx.fillText(`FPS: ${this.performance.fps}`, 10, 20);
        ctx.fillText(`Frame Time: ${this.performance.frameTime.toFixed(1)}ms`, 10, 35);
        ctx.fillText(`Nodes: ${this.nodes.length}`, 10, 50);
        ctx.fillText(`Connections: ${this.connections.size}`, 10, 65);
        ctx.fillText(`Particles: ${this.particles.length}`, 10, 80);
    }

    // Control Interface
    async initControls() {
        this.createControlPanel();
        this.initControlEvents();
    }

    createControlPanel() {
        const container = document.querySelector('[data-neural-controls]');
        if (!container) return;

        container.innerHTML = `
            <div class="neural-controls">
                <div class="control-section">
                    <h3>Network</h3>
                    <label>
                        Nodes: <span data-value="nodeCount">${this.config.nodeCount}</span>
                        <input type="range" data-control="nodeCount" min="10" max="200" value="${this.config.nodeCount}">
                    </label>
                    <label>
                        Learning Rate: <span data-value="learningRate">${this.config.learningRate}</span>
                        <input type="range" data-control="learningRate" min="0.01" max="1" step="0.01" value="${this.config.learningRate}">
                    </label>
                    <label>
                        Network Type:
                        <select data-control="networkType">
                            <option value="feedforward">Feedforward</option>
                            <option value="recurrent">Recurrent</option>
                            <option value="convolutional">Convolutional</option>
                        </select>
                    </label>
                </div>

                <div class="control-section">
                    <h3>Visual</h3>
                    <label>
                        Color Scheme:
                        <select data-control="colorScheme">
                            <option value="neural">Neural</option>
                            <option value="electric">Electric</option>
                            <option value="organic">Organic</option>
                            <option value="data">Data</option>
                        </select>
                    </label>
                    <label>
                        <input type="checkbox" data-control="showWeights" ${this.visualConfig.showWeights ? 'checked' : ''}>
                        Show Weights
                    </label>
                    <label>
                        <input type="checkbox" data-control="animateSignals" ${this.visualConfig.animateSignals ? 'checked' : ''}>
                        Animate Signals
                    </label>
                    <label>
                        <input type="checkbox" data-control="backgroundNoise" ${this.visualConfig.backgroundNoise ? 'checked' : ''}>
                        Background Noise
                    </label>
                </div>

                <div class="control-section">
                    <h3>Animation</h3>
                    <button data-action="start">Start</button>
                    <button data-action="stop">Stop</button>
                    <button data-action="reset">Reset</button>
                    <button data-action="export">Export</button>
                </div>
            </div>
        `;
    }

    initControlEvents() {
        // Range inputs
        document.querySelectorAll('[data-control]').forEach(control => {
            const param = control.getAttribute('data-control');

            control.addEventListener('input', (e) => {
                const value = e.target.type === 'checkbox' ? e.target.checked :
                             e.target.type === 'range' ? parseFloat(e.target.value) :
                             e.target.value;

                this.updateParameter(param, value);
            });
        });

        // Action buttons
        document.querySelectorAll('[data-action]').forEach(btn => {
            const action = btn.getAttribute('data-action');

            btn.addEventListener('click', () => {
                switch (action) {
                    case 'start':
                        this.start();
                        break;
                    case 'stop':
                        this.stop();
                        break;
                    case 'reset':
                        this.reset();
                        break;
                    case 'export':
                        this.exportVisualization();
                        break;
                }
            });
        });
    }

    updateParameter(param, value) {
        if (this.config.hasOwnProperty(param)) {
            this.config[param] = value;
        } else if (this.visualConfig.hasOwnProperty(param)) {
            this.visualConfig[param] = value;
        }

        // Update display
        const valueDisplay = document.querySelector(`[data-value="${param}"]`);
        if (valueDisplay) {
            valueDisplay.textContent = typeof value === 'number' ? value.toFixed(2) : value;
        }

        // Apply changes
        this.applyParameterChange(param, value);

        this.emit('parameter:changed', { param, value });
    }

    applyParameterChange(param, value) {
        switch (param) {
            case 'nodeCount':
                this.recreateNetwork();
                break;
            case 'colorScheme':
                this.updateColors();
                break;
            case 'networkType':
                this.recreateNetwork();
                break;
        }
    }

    recreateNetwork() {
        this.createNeuralNetwork();
    }

    updateColors() {
        this.nodes.forEach((node, index) => {
            node.color = this.getNodeColor(node.layer, this.network.getLayers().length);
        });
    }

    reset() {
        this.stop();
        this.nodes.forEach(node => {
            node.activation = 0;
        });
        this.connections.forEach(connection => {
            connection.signal = 0;
            connection.active = false;
        });
        this.particles.length = 0;
    }

    // Interaction Handling
    async initInteractions() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if click is on a node
        const clickedNode = this.nodes.find(node => {
            const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
            return distance <= node.radius;
        });

        if (clickedNode) {
            this.activateNode(clickedNode, 1.0);
            this.propagateFromNode(clickedNode);
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Highlight nearby nodes
        this.nodes.forEach(node => {
            const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
            if (distance <= node.radius * 2) {
                node.activation = Math.max(node.activation, 0.3);
            }
        });
    }

    handleWheel(e) {
        e.preventDefault();
        // Implement zoom functionality
    }

    // Utility Methods
    resizeCanvas() {
        if (!this.canvas) return;

        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;

        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    getCanvasDimensions() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    exportVisualization() {
        const dataURL = this.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `neural-viz-${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    handleError(error) {
        console.error('Neural Visualization Error:', error);
        this.emit('error', { error });
    }

    destroy() {
        this.stop();

        if (this.gl) {
            // Clean up WebGL resources
            if (this.nodeProgram) this.gl.deleteProgram(this.nodeProgram);
            if (this.connectionProgram) this.gl.deleteProgram(this.connectionProgram);
            if (this.particleProgram) this.gl.deleteProgram(this.particleProgram);
        }

        this.emit('destroyed');
    }
}

// Neural Network Class
class NeuralNetwork {
    constructor(config) {
        this.config = config;
        this.layers = [];
    }

    async initialize() {
        this.createLayers();
        this.initializeWeights();
    }

    createLayers() {
        this.layers = this.config.layers.map((size, index) => ({
            size,
            index,
            neurons: new Array(size).fill(0),
            weights: index < this.config.layers.length - 1 ?
                this.createWeightMatrix(size, this.config.layers[index + 1]) : null,
            biases: new Array(size).fill(0).map(() => (Math.random() - 0.5) * 0.2)
        }));
    }

    createWeightMatrix(inputSize, outputSize) {
        return Array(inputSize).fill(0).map(() =>
            Array(outputSize).fill(0).map(() => (Math.random() - 0.5) * 2)
        );
    }

    initializeWeights() {
        // Xavier/Glorot initialization
        this.layers.forEach((layer, index) => {
            if (layer.weights) {
                const fanIn = layer.size;
                const fanOut = this.layers[index + 1].size;
                const limit = Math.sqrt(6 / (fanIn + fanOut));

                layer.weights = layer.weights.map(row =>
                    row.map(() => (Math.random() - 0.5) * 2 * limit)
                );
            }
        });
    }

    getLayers() {
        return this.layers;
    }

    forward(inputs) {
        // Simple forward pass implementation
        let activations = inputs;

        for (let i = 0; i < this.layers.length - 1; i++) {
            const layer = this.layers[i];
            const nextLayer = this.layers[i + 1];

            const newActivations = new Array(nextLayer.size).fill(0);

            for (let j = 0; j < nextLayer.size; j++) {
                let sum = nextLayer.biases[j];

                for (let k = 0; k < layer.size; k++) {
                    sum += activations[k] * layer.weights[k][j];
                }

                newActivations[j] = this.activate(sum);
            }

            activations = newActivations;
        }

        return activations;
    }

    activate(x) {
        switch (this.config.activation) {
            case 'sigmoid':
                return 1 / (1 + Math.exp(-x));
            case 'tanh':
                return Math.tanh(x);
            case 'relu':
                return Math.max(0, x);
            default:
                return x;
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.NeuralVisualization = new NeuralVisualization();
    });
} else {
    window.NeuralVisualization = new NeuralVisualization();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NeuralVisualization, NeuralNetwork };
}