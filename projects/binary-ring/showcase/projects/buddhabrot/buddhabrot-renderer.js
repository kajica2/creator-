/**
 * Buddhabrot Fractal Renderer
 * High-performance WebGL/Canvas implementation of the Buddhabrot algorithm
 */

class BuddhabrotRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Rendering parameters
        this.params = {
            iterations: 5000,
            samples: 10000000,
            zoom: 1,
            centerX: -0.7,
            centerY: 0,
            colorScheme: 'classic'
        };

        // Rendering state
        this.isRendering = false;
        this.renderProgress = 0;
        this.accumulationBuffer = null;
        this.maxDensity = 0;

        // Color schemes
        this.colorSchemes = {
            classic: { r: 1.0, g: 0.3, b: 0.3 },
            monochrome: { r: 1.0, g: 1.0, b: 1.0 },
            spectral: 'spectral',
            fire: { r: 1.0, g: 0.5, b: 0.0 },
            ocean: { r: 0.0, g: 0.7, b: 1.0 }
        };

        // Performance monitoring
        this.renderStartTime = 0;
        this.renderCallback = null;
        this.progressCallback = null;

        // Web Worker for background computation
        this.worker = null;
        this.initWorker();
    }

    initWorker() {
        // Create inline worker for Buddhabrot computation
        const workerScript = `
            let accumulationBuffer;
            let width, height;
            let params;

            function mandelbrotTrajectory(cx, cy, maxIter) {
                const trajectory = [];
                let zx = 0, zy = 0;
                let iter = 0;

                while (iter < maxIter && zx * zx + zy * zy < 4) {
                    trajectory.push({ x: zx, y: zy });
                    const temp = zx * zx - zy * zy + cx;
                    zy = 2 * zx * zy + cy;
                    zx = temp;
                    iter++;
                }

                // Return trajectory only if point escapes
                return iter < maxIter ? trajectory : null;
            }

            function computeBuddhabrot(parameters) {
                params = parameters;
                width = params.width;
                height = params.height;

                // Initialize accumulation buffer
                accumulationBuffer = new Float32Array(width * height);

                const batchSize = 10000; // Process in batches for progress updates
                const totalBatches = Math.ceil(params.samples / batchSize);
                let processedBatches = 0;

                function processBatch() {
                    const startSample = processedBatches * batchSize;
                    const endSample = Math.min(startSample + batchSize, params.samples);

                    for (let sample = startSample; sample < endSample; sample++) {
                        // Generate random point in complex plane
                        const cx = (Math.random() - 0.5) * 4 / params.zoom + params.centerX;
                        const cy = (Math.random() - 0.5) * 4 / params.zoom + params.centerY;

                        // Get trajectory
                        const trajectory = mandelbrotTrajectory(cx, cy, params.iterations);

                        if (trajectory) {
                            // Accumulate trajectory points
                            for (const point of trajectory) {
                                // Convert complex plane to screen coordinates
                                const screenX = Math.floor((point.x - params.centerX) * params.zoom / 4 * width + width / 2);
                                const screenY = Math.floor((point.y - params.centerY) * params.zoom / 4 * height + height / 2);

                                if (screenX >= 0 && screenX < width && screenY >= 0 && screenY < height) {
                                    accumulationBuffer[screenY * width + screenX] += 1;
                                }
                            }
                        }
                    }

                    processedBatches++;
                    const progress = processedBatches / totalBatches;

                    // Send progress update
                    self.postMessage({
                        type: 'progress',
                        progress: progress,
                        processedSamples: endSample
                    });

                    if (processedBatches < totalBatches) {
                        // Continue processing
                        setTimeout(processBatch, 1);
                    } else {
                        // Computation complete
                        self.postMessage({
                            type: 'complete',
                            buffer: accumulationBuffer.buffer,
                            maxDensity: Math.max(...accumulationBuffer)
                        }, [accumulationBuffer.buffer]);
                    }
                }

                processBatch();
            }

            self.onmessage = function(e) {
                if (e.data.type === 'start') {
                    computeBuddhabrot(e.data.params);
                }
            };
        `;

        const blob = new Blob([workerScript], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));

        this.worker.onmessage = (e) => {
            if (e.data.type === 'progress') {
                this.renderProgress = e.data.progress;
                if (this.progressCallback) {
                    this.progressCallback(this.renderProgress, e.data.processedSamples);
                }
            } else if (e.data.type === 'complete') {
                this.accumulationBuffer = new Float32Array(e.data.buffer);
                this.maxDensity = e.data.maxDensity;
                this.renderToCanvas();
                this.isRendering = false;

                if (this.renderCallback) {
                    this.renderCallback();
                }
            }
        };
    }

    setParameters(newParams) {
        this.params = { ...this.params, ...newParams };
    }

    async render(progressCallback = null, completeCallback = null) {
        if (this.isRendering) {
            return;
        }

        this.isRendering = true;
        this.renderProgress = 0;
        this.renderStartTime = performance.now();
        this.progressCallback = progressCallback;
        this.renderCallback = completeCallback;

        // Resize canvas if needed
        this.resizeCanvas();

        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Start worker computation
        this.worker.postMessage({
            type: 'start',
            params: {
                ...this.params,
                width: this.canvas.width,
                height: this.canvas.height
            }
        });
    }

    renderToCanvas() {
        if (!this.accumulationBuffer) return;

        const width = this.canvas.width;
        const height = this.canvas.height;
        const imageData = this.ctx.createImageData(width, height);
        const data = imageData.data;

        // Normalize and apply color scheme
        for (let i = 0; i < this.accumulationBuffer.length; i++) {
            const density = this.accumulationBuffer[i];
            const normalizedDensity = density / this.maxDensity;
            const color = this.getColor(normalizedDensity);

            const pixelIndex = i * 4;
            data[pixelIndex] = color.r;     // Red
            data[pixelIndex + 1] = color.g; // Green
            data[pixelIndex + 2] = color.b; // Blue
            data[pixelIndex + 3] = 255;     // Alpha
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    getColor(normalizedDensity) {
        if (normalizedDensity === 0) {
            return { r: 0, g: 0, b: 0 };
        }

        const scheme = this.colorSchemes[this.params.colorScheme];

        if (scheme === 'spectral') {
            return this.getSpectralColor(normalizedDensity);
        }

        // Gamma correction
        const intensity = Math.pow(normalizedDensity, 0.5) * 255;

        return {
            r: Math.min(255, intensity * scheme.r),
            g: Math.min(255, intensity * scheme.g),
            b: Math.min(255, intensity * scheme.b)
        };
    }

    getSpectralColor(t) {
        // Spectral color mapping
        const r = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
        const g = Math.sin(t * Math.PI * 2 + Math.PI * 2/3) * 0.5 + 0.5;
        const b = Math.sin(t * Math.PI * 2 + Math.PI * 4/3) * 0.5 + 0.5;

        return {
            r: Math.floor(r * 255),
            g: Math.floor(g * 255),
            b: Math.floor(b * 255)
        };
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * devicePixelRatio;
        this.canvas.height = rect.height * devicePixelRatio;

        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    // Zoom and pan functionality
    zoomIn(factor = 2) {
        this.params.zoom *= factor;
    }

    zoomOut(factor = 2) {
        this.params.zoom /= factor;
    }

    resetZoom() {
        this.params.zoom = 1;
        this.params.centerX = -0.7;
        this.params.centerY = 0;
    }

    panTo(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (screenX - rect.left) / rect.width;
        const y = (screenY - rect.top) / rect.height;

        // Convert screen coordinates to complex plane
        const complexX = (x - 0.5) * 4 / this.params.zoom + this.params.centerX;
        const complexY = (y - 0.5) * 4 / this.params.zoom + this.params.centerY;

        this.params.centerX = complexX;
        this.params.centerY = complexY;
    }

    // Export functionality
    exportImage(format = 'png', quality = 0.95) {
        return new Promise((resolve) => {
            if (format === 'svg') {
                resolve(this.exportSVG());
            } else {
                this.canvas.toBlob((blob) => {
                    resolve(blob);
                }, `image/${format}`, quality);
            }
        });
    }

    exportSVG() {
        // Create SVG representation (simplified)
        const width = this.canvas.width;
        const height = this.canvas.height;

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
        svg += '<rect width="100%" height="100%" fill="black"/>';

        // Sample points for SVG path (simplified representation)
        if (this.accumulationBuffer) {
            const step = 5; // Sample every 5th pixel for performance
            for (let y = 0; y < height; y += step) {
                for (let x = 0; x < width; x += step) {
                    const density = this.accumulationBuffer[y * width + x];
                    if (density > 0) {
                        const normalizedDensity = density / this.maxDensity;
                        const opacity = Math.pow(normalizedDensity, 0.5);
                        svg += `<rect x="${x}" y="${y}" width="${step}" height="${step}" fill="#ff6b6b" opacity="${opacity}"/>`;
                    }
                }
            }
        }

        svg += '</svg>';
        return new Blob([svg], { type: 'image/svg+xml' });
    }

    // Preset configurations
    getPresets() {
        return {
            default: {
                iterations: 5000,
                samples: 10000000,
                zoom: 1,
                centerX: -0.7,
                centerY: 0,
                colorScheme: 'classic'
            },
            detailed: {
                iterations: 8000,
                samples: 50000000,
                zoom: 1,
                centerX: -0.7,
                centerY: 0,
                colorScheme: 'spectral'
            },
            quick: {
                iterations: 1000,
                samples: 1000000,
                zoom: 1,
                centerX: -0.7,
                centerY: 0,
                colorScheme: 'monochrome'
            },
            artistic: {
                iterations: 6000,
                samples: 25000000,
                zoom: 1.5,
                centerX: -0.8,
                centerY: 0.2,
                colorScheme: 'fire'
            }
        };
    }

    loadPreset(presetName) {
        const presets = this.getPresets();
        if (presets[presetName]) {
            this.setParameters(presets[presetName]);
        }
    }

    // Performance metrics
    getPerformanceMetrics() {
        const renderTime = this.renderStartTime ? (performance.now() - this.renderStartTime) / 1000 : 0;
        const samplesPerSecond = this.params.samples / renderTime;

        return {
            renderTime: renderTime.toFixed(2) + 's',
            samplesPerSecond: Math.floor(samplesPerSecond).toLocaleString(),
            totalSamples: this.params.samples.toLocaleString(),
            memoryUsage: this.getMemoryUsage()
        };
    }

    getMemoryUsage() {
        if (this.accumulationBuffer) {
            const bufferSize = this.accumulationBuffer.length * 4; // 4 bytes per float
            return (bufferSize / 1024 / 1024).toFixed(1) + 'MB';
        }
        return '0MB';
    }

    stop() {
        this.isRendering = false;
        if (this.worker) {
            this.worker.terminate();
            this.initWorker();
        }
    }

    destroy() {
        this.stop();
        if (this.worker) {
            this.worker.terminate();
        }
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.BuddhabrotRenderer = BuddhabrotRenderer;
}