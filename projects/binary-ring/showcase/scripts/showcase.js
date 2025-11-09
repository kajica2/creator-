/**
 * Binary Ring Showcase - Project Interactions
 * Handles parameter controls, real-time rendering, WebGL integration, and project exploration
 */

class BinaryRingShowcase {
    constructor() {
        this.projects = new Map();
        this.currentProject = null;
        this.renderer = null;
        this.animationFrame = null;
        this.parameters = {};
        this.presets = [];
        this.isPlaying = false;
        this.isRecording = false;
        this.audioContext = null;
        this.audioAnalyser = null;

        this.canvasConfig = {
            width: 800,
            height: 600,
            pixelRatio: window.devicePixelRatio || 1,
            antialias: true,
            preserveDrawingBuffer: true
        };

        this.exportConfig = {
            format: 'png',
            quality: 0.92,
            scale: 1,
            background: 'transparent'
        };

        this.init();
    }

    async init() {
        try {
            await this.loadProjects();
            await this.initRenderer();
            await this.initParameterControls();
            await this.initPresets();
            await this.initExportTools();
            await this.initAudioReactivity();
            await this.initKeyboardShortcuts();
            await this.initProjectBrowser();

            console.log('Binary Ring Showcase initialized successfully');
            this.emit('showcase:initialized');
        } catch (error) {
            console.error('Showcase initialization failed:', error);
            this.handleError(error);
        }
    }

    // Project Loading and Management
    async loadProjects() {
        try {
            const projectList = await this.fetchProjectList();

            for (const projectInfo of projectList) {
                const project = await this.loadProject(projectInfo.id);
                this.projects.set(projectInfo.id, project);
            }

            this.emit('projects:loaded', { projects: this.projects });
        } catch (error) {
            console.error('Failed to load projects:', error);
            throw error;
        }
    }

    async fetchProjectList() {
        // Mock project list - replace with actual API call
        return [
            {
                id: 'buddhabrot',
                name: 'Buddhabrot',
                category: 'fractal',
                difficulty: 'advanced',
                featured: true
            },
            {
                id: 'substrate',
                name: 'Substrate',
                category: 'organic',
                difficulty: 'intermediate',
                featured: true
            },
            {
                id: 'node-garden',
                name: 'Node Garden',
                category: 'network',
                difficulty: 'intermediate',
                featured: false
            },
            {
                id: 'deep-lorenz',
                name: 'Deep Lorenz',
                category: 'attractor',
                difficulty: 'expert',
                featured: false
            }
        ];
    }

    async loadProject(projectId) {
        // Load project configuration and algorithm
        const [config, algorithm] = await Promise.all([
            this.loadProjectConfig(projectId),
            this.loadProjectAlgorithm(projectId)
        ]);

        return {
            id: projectId,
            config,
            algorithm,
            parameters: this.initializeParameters(config.parameters),
            presets: config.presets || [],
            isLoaded: true,
            lastRendered: null
        };
    }

    async loadProjectConfig(projectId) {
        // Mock configuration - replace with actual loading
        const configs = {
            'buddhabrot': {
                name: 'Buddhabrot',
                description: 'Fractal path tracing in the Mandelbrot set',
                parameters: {
                    iterations: { type: 'number', min: 100, max: 10000, default: 1000, step: 100 },
                    escapeRadius: { type: 'number', min: 2, max: 100, default: 10, step: 1 },
                    samples: { type: 'number', min: 1000, max: 1000000, default: 100000, step: 1000 },
                    zoom: { type: 'number', min: 0.1, max: 100, default: 1, step: 0.1 },
                    centerX: { type: 'number', min: -2, max: 2, default: 0, step: 0.01 },
                    centerY: { type: 'number', min: -2, max: 2, default: 0, step: 0.01 },
                    colorMode: { type: 'select', options: ['classic', 'heat', 'rainbow', 'monochrome'], default: 'classic' },
                    brightness: { type: 'number', min: 0, max: 2, default: 1, step: 0.01 },
                    contrast: { type: 'number', min: 0, max: 2, default: 1, step: 0.01 }
                },
                presets: [
                    { name: 'Default', values: {} },
                    { name: 'Deep Zoom', values: { zoom: 10, iterations: 5000 } },
                    { name: 'High Detail', values: { samples: 500000, iterations: 2000 } }
                ]
            },
            'substrate': {
                name: 'Substrate',
                description: 'Crack growth simulation inspired by bacterial colonies',
                parameters: {
                    numCracks: { type: 'number', min: 1, max: 100, default: 3, step: 1 },
                    maxCracks: { type: 'number', min: 10, max: 1000, default: 100, step: 10 },
                    cgrowth: { type: 'number', min: 0.1, max: 2, default: 0.5, step: 0.1 },
                    sandGrains: { type: 'number', min: 1000, max: 100000, default: 10000, step: 1000 },
                    angleStep: { type: 'number', min: 0.1, max: 5, default: 0.73, step: 0.01 },
                    strokeWidth: { type: 'number', min: 0.1, max: 5, default: 1, step: 0.1 },
                    backgroundColor: { type: 'color', default: '#ffffff' },
                    crackColor: { type: 'color', default: '#000000' },
                    sandColor: { type: 'color', default: '#cccccc' }
                }
            },
            'node-garden': {
                name: 'Node Garden',
                description: 'Dynamic network visualization with organic growth',
                parameters: {
                    nodeCount: { type: 'number', min: 10, max: 500, default: 100, step: 10 },
                    connectionDistance: { type: 'number', min: 50, max: 300, default: 150, step: 10 },
                    springStrength: { type: 'number', min: 0.01, max: 1, default: 0.1, step: 0.01 },
                    damping: { type: 'number', min: 0.8, max: 0.99, default: 0.95, step: 0.01 },
                    gravity: { type: 'number', min: 0, max: 1, default: 0.1, step: 0.01 },
                    nodeSize: { type: 'number', min: 1, max: 20, default: 5, step: 1 },
                    lineWidth: { type: 'number', min: 0.5, max: 5, default: 1, step: 0.5 },
                    audioReactive: { type: 'boolean', default: false },
                    colorScheme: { type: 'select', options: ['network', 'organic', 'neon', 'rainbow'], default: 'network' }
                }
            }
        };

        return configs[projectId] || {};
    }

    async loadProjectAlgorithm(projectId) {
        // Load the actual algorithm implementation
        // In a real implementation, this would load the specific algorithm file
        return {
            render: (canvas, parameters) => {
                // Mock rendering function - replace with actual algorithm
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Simple placeholder visualization
                ctx.fillStyle = parameters.backgroundColor || '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = parameters.crackColor || '#000000';
                ctx.fillText(`Rendering ${projectId}...`, 50, 50);
            },
            animate: (canvas, parameters, time) => {
                // Animation frame for time-based algorithms
                return true; // Continue animation
            }
        };
    }

    initializeParameters(parameterConfig) {
        const parameters = {};

        Object.entries(parameterConfig).forEach(([key, config]) => {
            parameters[key] = config.default;
        });

        return parameters;
    }

    // Renderer Management
    async initRenderer() {
        const canvas = document.querySelector('[data-showcase-canvas]');
        if (!canvas) {
            console.warn('Showcase canvas not found');
            return;
        }

        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        // Set canvas dimensions
        this.resizeCanvas();

        // Add resize listener
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize WebGL if available
        await this.initWebGL();
    }

    async initWebGL() {
        try {
            const glCanvas = document.querySelector('[data-webgl-canvas]');
            if (!glCanvas) return;

            const gl = glCanvas.getContext('webgl2') || glCanvas.getContext('webgl');
            if (!gl) {
                console.warn('WebGL not supported');
                return;
            }

            this.gl = gl;
            this.webglSupported = true;

            // Initialize WebGL shaders and programs
            await this.initWebGLPrograms();

            console.log('WebGL initialized successfully');
        } catch (error) {
            console.warn('WebGL initialization failed:', error);
            this.webglSupported = false;
        }
    }

    async initWebGLPrograms() {
        // Basic vertex shader
        const vertexShaderSource = `
            attribute vec4 a_position;
            attribute vec2 a_texcoord;
            varying vec2 v_texcoord;

            void main() {
                gl_Position = a_position;
                v_texcoord = a_texcoord;
            }
        `;

        // Fragment shader template for generative art
        const fragmentShaderSource = `
            precision mediump float;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            varying vec2 v_texcoord;

            // Algorithm-specific uniforms will be injected here

            void main() {
                vec2 uv = v_texcoord;
                vec3 color = vec3(uv, 0.5 + 0.5 * sin(u_time));
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        this.shaderProgram = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    }

    createShaderProgram(vertexSource, fragmentSource) {
        const gl = this.gl;

        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Shader program linking failed:', gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    resizeCanvas() {
        if (!this.canvas) return;

        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height || width * 0.75; // Default aspect ratio

        this.canvas.width = width * this.canvasConfig.pixelRatio;
        this.canvas.height = height * this.canvasConfig.pixelRatio;

        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        // Scale context for high DPI displays
        if (this.context) {
            this.context.scale(this.canvasConfig.pixelRatio, this.canvasConfig.pixelRatio);
        }

        // Update WebGL viewport
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        // Re-render current project
        if (this.currentProject) {
            this.renderProject();
        }
    }

    // Parameter Controls
    async initParameterControls() {
        this.initParameterUI();
        this.initParameterEvents();
    }

    initParameterUI() {
        const container = document.querySelector('[data-parameters-container]');
        if (!container) return;

        this.parameterContainer = container;
        this.updateParameterUI();
    }

    updateParameterUI() {
        if (!this.currentProject || !this.parameterContainer) return;

        const { config, parameters } = this.currentProject;

        this.parameterContainer.innerHTML = Object.entries(config.parameters)
            .map(([key, config]) => this.createParameterControl(key, config, parameters[key]))
            .join('');

        this.initParameterEvents();
    }

    createParameterControl(key, config, value) {
        const labelText = config.label || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

        switch (config.type) {
            case 'number':
                return `
                    <div class="parameter-control" data-parameter="${key}">
                        <label class="parameter-label">
                            ${labelText}
                            <span class="parameter-value">${value}</span>
                        </label>
                        <div class="parameter-input-container">
                            <input type="range"
                                   class="parameter-slider"
                                   data-parameter-slider="${key}"
                                   min="${config.min}"
                                   max="${config.max}"
                                   step="${config.step}"
                                   value="${value}">
                            <input type="number"
                                   class="parameter-number"
                                   data-parameter-number="${key}"
                                   min="${config.min}"
                                   max="${config.max}"
                                   step="${config.step}"
                                   value="${value}">
                        </div>
                    </div>
                `;

            case 'select':
                return `
                    <div class="parameter-control" data-parameter="${key}">
                        <label class="parameter-label">${labelText}</label>
                        <select class="parameter-select" data-parameter-select="${key}">
                            ${config.options.map(option =>
                                `<option value="${option}" ${option === value ? 'selected' : ''}>${option}</option>`
                            ).join('')}
                        </select>
                    </div>
                `;

            case 'boolean':
                return `
                    <div class="parameter-control" data-parameter="${key}">
                        <label class="parameter-checkbox-label">
                            <input type="checkbox"
                                   class="parameter-checkbox"
                                   data-parameter-checkbox="${key}"
                                   ${value ? 'checked' : ''}>
                            <span class="parameter-checkbox-indicator"></span>
                            ${labelText}
                        </label>
                    </div>
                `;

            case 'color':
                return `
                    <div class="parameter-control" data-parameter="${key}">
                        <label class="parameter-label">${labelText}</label>
                        <div class="parameter-color-container">
                            <input type="color"
                                   class="parameter-color"
                                   data-parameter-color="${key}"
                                   value="${value}">
                            <input type="text"
                                   class="parameter-color-text"
                                   data-parameter-color-text="${key}"
                                   value="${value}"
                                   placeholder="#ffffff">
                        </div>
                    </div>
                `;

            default:
                return `
                    <div class="parameter-control" data-parameter="${key}">
                        <label class="parameter-label">${labelText}</label>
                        <input type="text"
                               class="parameter-text"
                               data-parameter-text="${key}"
                               value="${value}">
                    </div>
                `;
        }
    }

    initParameterEvents() {
        // Number sliders
        document.querySelectorAll('[data-parameter-slider]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const key = e.target.getAttribute('data-parameter-slider');
                const value = parseFloat(e.target.value);
                this.updateParameter(key, value);
                this.updateParameterDisplay(key, value);
            });
        });

        // Number inputs
        document.querySelectorAll('[data-parameter-number]').forEach(input => {
            input.addEventListener('change', (e) => {
                const key = e.target.getAttribute('data-parameter-number');
                const value = parseFloat(e.target.value);
                this.updateParameter(key, value);
                this.updateParameterDisplay(key, value);

                // Update corresponding slider
                const slider = document.querySelector(`[data-parameter-slider="${key}"]`);
                if (slider) slider.value = value;
            });
        });

        // Select controls
        document.querySelectorAll('[data-parameter-select]').forEach(select => {
            select.addEventListener('change', (e) => {
                const key = e.target.getAttribute('data-parameter-select');
                const value = e.target.value;
                this.updateParameter(key, value);
            });
        });

        // Checkboxes
        document.querySelectorAll('[data-parameter-checkbox]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const key = e.target.getAttribute('data-parameter-checkbox');
                const value = e.target.checked;
                this.updateParameter(key, value);
            });
        });

        // Color controls
        document.querySelectorAll('[data-parameter-color]').forEach(colorInput => {
            colorInput.addEventListener('change', (e) => {
                const key = e.target.getAttribute('data-parameter-color');
                const value = e.target.value;
                this.updateParameter(key, value);

                // Update text input
                const textInput = document.querySelector(`[data-parameter-color-text="${key}"]`);
                if (textInput) textInput.value = value;
            });
        });

        document.querySelectorAll('[data-parameter-color-text]').forEach(textInput => {
            textInput.addEventListener('change', (e) => {
                const key = e.target.getAttribute('data-parameter-color-text');
                let value = e.target.value;

                // Validate color format
                if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    value = '#000000';
                    e.target.value = value;
                }

                this.updateParameter(key, value);

                // Update color input
                const colorInput = document.querySelector(`[data-parameter-color="${key}"]`);
                if (colorInput) colorInput.value = value;
            });
        });
    }

    updateParameter(key, value) {
        if (!this.currentProject) return;

        this.currentProject.parameters[key] = value;
        this.debounce(() => this.renderProject(), 100);

        this.emit('parameter:changed', { key, value });
        this.trackEvent('parameter', 'change', { project: this.currentProject.id, key, value });
    }

    updateParameterDisplay(key, value) {
        const valueDisplay = document.querySelector(`[data-parameter="${key}"] .parameter-value`);
        if (valueDisplay) {
            valueDisplay.textContent = typeof value === 'number' ? value.toFixed(2) : value;
        }
    }

    // Preset Management
    async initPresets() {
        this.initPresetUI();
        this.initPresetEvents();
    }

    initPresetUI() {
        const container = document.querySelector('[data-presets-container]');
        if (!container) return;

        this.presetContainer = container;
        this.updatePresetUI();
    }

    updatePresetUI() {
        if (!this.currentProject || !this.presetContainer) return;

        const { presets } = this.currentProject;

        this.presetContainer.innerHTML = `
            <div class="presets-header">
                <h3>Presets</h3>
                <button class="btn btn-small" data-save-preset>Save Current</button>
            </div>
            <div class="presets-list">
                ${presets.map((preset, index) =>
                    `<button class="preset-btn" data-load-preset="${index}">
                        ${preset.name}
                        <button class="preset-delete" data-delete-preset="${index}">×</button>
                    </button>`
                ).join('')}
            </div>
        `;

        this.initPresetEvents();
    }

    initPresetEvents() {
        // Load preset
        document.querySelectorAll('[data-load-preset]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.getAttribute('data-load-preset'));
                this.loadPreset(index);
            });
        });

        // Delete preset
        document.querySelectorAll('[data-delete-preset]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.getAttribute('data-delete-preset'));
                this.deletePreset(index);
            });
        });

        // Save preset
        document.querySelectorAll('[data-save-preset]').forEach(btn => {
            btn.addEventListener('click', () => this.showSavePresetDialog());
        });
    }

    loadPreset(index) {
        if (!this.currentProject || !this.currentProject.presets[index]) return;

        const preset = this.currentProject.presets[index];

        // Apply preset values
        Object.entries(preset.values).forEach(([key, value]) => {
            this.currentProject.parameters[key] = value;
        });

        this.updateParameterUI();
        this.renderProject();

        this.trackEvent('preset', 'load', { project: this.currentProject.id, preset: preset.name });
    }

    showSavePresetDialog() {
        const name = prompt('Enter preset name:');
        if (name) {
            this.savePreset(name);
        }
    }

    savePreset(name) {
        if (!this.currentProject) return;

        const preset = {
            name,
            values: { ...this.currentProject.parameters },
            createdAt: Date.now()
        };

        this.currentProject.presets.push(preset);
        this.updatePresetUI();

        this.trackEvent('preset', 'save', { project: this.currentProject.id, preset: name });
    }

    deletePreset(index) {
        if (!this.currentProject || !this.currentProject.presets[index]) return;

        if (confirm('Delete this preset?')) {
            this.currentProject.presets.splice(index, 1);
            this.updatePresetUI();
        }
    }

    // Project Rendering
    async setCurrentProject(projectId) {
        const project = this.projects.get(projectId);
        if (!project) {
            console.error('Project not found:', projectId);
            return;
        }

        this.currentProject = project;
        this.parameters = { ...project.parameters };

        this.updateParameterUI();
        this.updatePresetUI();
        this.renderProject();

        this.emit('project:changed', { projectId, project });
        this.trackEvent('project', 'select', { projectId });
    }

    renderProject() {
        if (!this.currentProject || !this.canvas) return;

        try {
            const { algorithm, parameters } = this.currentProject;

            // Clear previous render
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Render project
            if (this.webglSupported && algorithm.renderWebGL) {
                algorithm.renderWebGL(this.gl, parameters);
            } else {
                algorithm.render(this.canvas, parameters);
            }

            this.currentProject.lastRendered = Date.now();
            this.emit('project:rendered', { project: this.currentProject });

        } catch (error) {
            console.error('Render error:', error);
            this.showRenderError(error);
        }
    }

    startAnimation() {
        if (this.isPlaying || !this.currentProject) return;

        this.isPlaying = true;
        this.animationStartTime = performance.now();

        const animate = (time) => {
            if (!this.isPlaying) return;

            const elapsed = time - this.animationStartTime;

            try {
                if (this.currentProject.algorithm.animate) {
                    const shouldContinue = this.currentProject.algorithm.animate(
                        this.canvas,
                        this.currentProject.parameters,
                        elapsed / 1000 // Convert to seconds
                    );

                    if (!shouldContinue) {
                        this.stopAnimation();
                        return;
                    }
                }

                // Audio reactivity
                if (this.currentProject.parameters.audioReactive && this.audioAnalyser) {
                    this.updateAudioReactiveParameters();
                }

            } catch (error) {
                console.error('Animation error:', error);
                this.stopAnimation();
                return;
            }

            this.animationFrame = requestAnimationFrame(animate);
        };

        this.animationFrame = requestAnimationFrame(animate);
        this.emit('animation:started');
    }

    stopAnimation() {
        if (!this.isPlaying) return;

        this.isPlaying = false;

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        this.emit('animation:stopped');
    }

    toggleAnimation() {
        if (this.isPlaying) {
            this.stopAnimation();
        } else {
            this.startAnimation();
        }
    }

    // Export Functionality
    async initExportTools() {
        this.initExportUI();
        this.initExportEvents();
    }

    initExportUI() {
        const container = document.querySelector('[data-export-container]');
        if (!container) return;

        container.innerHTML = `
            <div class="export-tools">
                <h3>Export</h3>

                <div class="export-format">
                    <label>Format:</label>
                    <select data-export-format>
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                        <option value="svg">SVG</option>
                        <option value="webp">WebP</option>
                    </select>
                </div>

                <div class="export-scale">
                    <label>Scale:</label>
                    <select data-export-scale>
                        <option value="1">1x (${this.canvas?.width || 800}×${this.canvas?.height || 600})</option>
                        <option value="2">2x</option>
                        <option value="4">4x</option>
                        <option value="8">8x</option>
                    </select>
                </div>

                <div class="export-quality" data-quality-container style="display: none;">
                    <label>Quality:</label>
                    <input type="range" data-export-quality min="0.1" max="1" step="0.1" value="0.9">
                    <span data-quality-value>90%</span>
                </div>

                <div class="export-actions">
                    <button class="btn btn-primary" data-export-image>Export Image</button>
                    <button class="btn btn-secondary" data-export-gif style="display: none;">Export GIF</button>
                    <button class="btn btn-secondary" data-export-video style="display: none;">Export Video</button>
                </div>
            </div>
        `;

        this.initExportEvents();
    }

    initExportEvents() {
        const formatSelect = document.querySelector('[data-export-format]');
        const qualityContainer = document.querySelector('[data-quality-container]');
        const qualitySlider = document.querySelector('[data-export-quality]');
        const qualityValue = document.querySelector('[data-quality-value]');

        // Format selection
        if (formatSelect) {
            formatSelect.addEventListener('change', (e) => {
                const format = e.target.value;
                this.exportConfig.format = format;

                // Show quality control for JPEG
                if (qualityContainer) {
                    qualityContainer.style.display = format === 'jpeg' ? 'block' : 'none';
                }
            });
        }

        // Quality control
        if (qualitySlider && qualityValue) {
            qualitySlider.addEventListener('input', (e) => {
                const quality = parseFloat(e.target.value);
                this.exportConfig.quality = quality;
                qualityValue.textContent = Math.round(quality * 100) + '%';
            });
        }

        // Scale selection
        const scaleSelect = document.querySelector('[data-export-scale]');
        if (scaleSelect) {
            scaleSelect.addEventListener('change', (e) => {
                this.exportConfig.scale = parseInt(e.target.value);
            });
        }

        // Export buttons
        document.querySelectorAll('[data-export-image]').forEach(btn => {
            btn.addEventListener('click', () => this.exportImage());
        });

        document.querySelectorAll('[data-export-gif]').forEach(btn => {
            btn.addEventListener('click', () => this.exportGIF());
        });

        document.querySelectorAll('[data-export-video]').forEach(btn => {
            btn.addEventListener('click', () => this.exportVideo());
        });
    }

    async exportImage() {
        if (!this.currentProject || !this.canvas) return;

        try {
            const { format, scale, quality } = this.exportConfig;

            // Create high-resolution canvas if needed
            let exportCanvas = this.canvas;
            if (scale > 1) {
                exportCanvas = await this.createHighResCanvas(scale);
            }

            // Export
            const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
            const dataURL = exportCanvas.toDataURL(mimeType, quality);

            // Download
            this.downloadFile(dataURL, `${this.currentProject.id}-${Date.now()}.${format}`);

            this.trackEvent('export', 'image', {
                project: this.currentProject.id,
                format,
                scale
            });

        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Export failed. Please try again.');
        }
    }

    async createHighResCanvas(scale) {
        const originalCanvas = this.canvas;
        const exportCanvas = document.createElement('canvas');

        exportCanvas.width = originalCanvas.width * scale;
        exportCanvas.height = originalCanvas.height * scale;

        const ctx = exportCanvas.getContext('2d');
        ctx.scale(scale, scale);

        // Re-render at high resolution
        this.currentProject.algorithm.render(exportCanvas, this.currentProject.parameters);

        return exportCanvas;
    }

    downloadFile(dataURL, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Audio Reactivity
    async initAudioReactivity() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioAnalyser = this.audioContext.createAnalyser();
            this.audioAnalyser.fftSize = 256;
            this.audioFrequencyData = new Uint8Array(this.audioAnalyser.frequencyBinCount);

            this.initAudioUI();
        } catch (error) {
            console.warn('Audio context initialization failed:', error);
        }
    }

    initAudioUI() {
        const container = document.querySelector('[data-audio-container]');
        if (!container) return;

        container.innerHTML = `
            <div class="audio-controls">
                <h3>Audio Reactivity</h3>
                <button class="btn btn-secondary" data-audio-enable>Enable Microphone</button>
                <input type="file" data-audio-file accept="audio/*" style="display: none;">
                <button class="btn btn-secondary" data-audio-file-select>Load Audio File</button>
                <div class="audio-visualizer" data-audio-visualizer></div>
            </div>
        `;

        this.initAudioEvents();
    }

    initAudioEvents() {
        // Microphone access
        document.querySelectorAll('[data-audio-enable]').forEach(btn => {
            btn.addEventListener('click', () => this.enableMicrophone());
        });

        // Audio file loading
        document.querySelectorAll('[data-audio-file-select]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('[data-audio-file]').click();
            });
        });

        document.querySelectorAll('[data-audio-file]').forEach(input => {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.loadAudioFile(file);
                }
            });
        });
    }

    async enableMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.audioAnalyser);

            console.log('Microphone enabled for audio reactivity');
            this.trackEvent('audio', 'microphone_enabled');
        } catch (error) {
            console.error('Microphone access failed:', error);
            this.showError('Microphone access denied.');
        }
    }

    async loadAudioFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioAnalyser);
            source.connect(this.audioContext.destination);
            source.start();

            console.log('Audio file loaded for reactivity');
            this.trackEvent('audio', 'file_loaded');
        } catch (error) {
            console.error('Audio file loading failed:', error);
            this.showError('Failed to load audio file.');
        }
    }

    updateAudioReactiveParameters() {
        if (!this.audioAnalyser || !this.currentProject) return;

        this.audioAnalyser.getByteFrequencyData(this.audioFrequencyData);

        // Calculate audio metrics
        const volume = this.audioFrequencyData.reduce((sum, val) => sum + val, 0) / this.audioFrequencyData.length;
        const bass = this.audioFrequencyData.slice(0, 10).reduce((sum, val) => sum + val, 0) / 10;
        const treble = this.audioFrequencyData.slice(-10).reduce((sum, val) => sum + val, 0) / 10;

        // Update parameters based on audio
        const params = this.currentProject.parameters;
        if (params.nodeCount && typeof params.nodeCount === 'number') {
            params.nodeCount = Math.floor(50 + (volume / 255) * 200);
        }
        if (params.springStrength && typeof params.springStrength === 'number') {
            params.springStrength = 0.05 + (bass / 255) * 0.2;
        }
    }

    // Keyboard Shortcuts
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when showcase is focused
            if (!document.body.classList.contains('showcase-focused')) return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.toggleAnimation();
                    break;
                case 'KeyR':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.renderProject();
                    }
                    break;
                case 'KeyE':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.exportImage();
                    }
                    break;
                case 'KeyS':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.showSavePresetDialog();
                    }
                    break;
                case 'Escape':
                    this.stopAnimation();
                    break;
            }
        });
    }

    // Project Browser
    initProjectBrowser() {
        const browser = document.querySelector('[data-project-browser]');
        if (!browser) return;

        this.renderProjectBrowser();
    }

    renderProjectBrowser() {
        const browser = document.querySelector('[data-project-browser]');
        if (!browser) return;

        const projects = Array.from(this.projects.values());

        browser.innerHTML = `
            <div class="project-browser-grid">
                ${projects.map(project => `
                    <div class="project-thumbnail" data-project-select="${project.id}">
                        <div class="project-preview"></div>
                        <div class="project-info">
                            <h4>${project.config.name}</h4>
                            <p>${project.config.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add event listeners
        document.querySelectorAll('[data-project-select]').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                const projectId = e.currentTarget.getAttribute('data-project-select');
                this.setCurrentProject(projectId);
            });
        });
    }

    // Utility Methods
    debounce(func, delay) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(func, delay);
    }

    showRenderError(error) {
        console.error('Render error:', error);
        // Show user-friendly error message
    }

    showError(message) {
        // Implement error display UI
        console.error('Showcase error:', message);
    }

    trackEvent(category, action, data = {}) {
        if (window.gtag) {
            window.gtag('event', action, {
                event_category: category,
                event_label: JSON.stringify(data)
            });
        }
        console.log('Showcase Event:', { category, action, data });
    }

    // Event system
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
        console.error('Binary Ring Showcase Error:', error);
        this.showError('An error occurred. Please try again.');
    }
}

// Initialize showcase when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.BinaryRingShowcase = new BinaryRingShowcase();
    });
} else {
    window.BinaryRingShowcase = new BinaryRingShowcase();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BinaryRingShowcase;
}