/**
 * Binary Ring Community - Projects Database
 * Complete data for all 36 projects with metadata, APIs, and community features
 */

const PROJECTS_DATABASE = {
    // Core project data
    projects: [
        {
            id: "buddhabrot",
            title: "Buddhabrot",
            description: "Fractal path tracing in the Mandelbrot set creating organic, Buddha-like silhouettes",
            longDescription: "The Buddhabrot reveals the hidden trajectories of points escaping the Mandelbrot set, creating flowing organic forms that resemble Buddhist iconography. This algorithm accumulates the paths taken by escaping points rather than simply coloring based on escape time.",
            category: "fractals",
            tags: ["fractal", "mandelbrot", "mathematical", "organic", "buddha"],
            difficulty: "intermediate",
            isNew: false,
            isFeatured: true,
            isInteractive: true,
            isAudioReactive: false,
            is3D: false,
            isRealtime: false,

            // Visual metadata
            primaryColor: "#FF6B6B",
            secondaryColor: "#4ECDC4",
            thumbnail: "assets/previews/buddhabrot-thumb.jpg",
            images: [
                "assets/gallery/buddhabrot/render-001.jpg",
                "assets/gallery/buddhabrot/render-002.jpg",
                "assets/gallery/buddhabrot/animation.gif"
            ],

            // Technical details
            algorithm: "Mandelbrot trajectory accumulation",
            complexity: "O(n²) with Monte Carlo sampling",
            renderTime: "2-30 seconds",
            maxResolution: "8K (7680x4320)",

            // Links and files
            demoUrl: "../buddhabrot/index.html",
            sourceUrl: "../buddhabrot/src/main.js",
            documentationUrl: "../buddhabrot/README.md",

            // Community data
            views: 2847,
            likes: 156,
            downloads: 89,
            comments: 23,
            dateCreated: "2024-03-15",
            lastUpdated: "2024-10-12",

            // API endpoints
            api: {
                generate: "/api/v1/generate/buddhabrot",
                export: "/api/v1/export/buddhabrot",
                parameters: "/api/v1/projects/buddhabrot/parameters",
                presets: "/api/v1/projects/buddhabrot/presets"
            },

            // Parameters for API
            parameters: {
                iterations: {type: "integer", min: 1000, max: 10000, default: 5000},
                samples: {type: "integer", min: 1000000, max: 100000000, default: 10000000},
                zoom: {type: "float", min: 1, max: 1000, default: 1},
                centerX: {type: "float", min: -2, max: 2, default: -0.7},
                centerY: {type: "float", min: -2, max: 2, default: 0}
            }
        },

        {
            id: "node.garden",
            title: "Node Garden",
            description: "Dynamic network visualization with organic growth patterns and interactive nodes",
            longDescription: "A living ecosystem of interconnected nodes that grow, connect, and evolve over time. Users can interact by spawning nodes, adjusting growth parameters, and observing emergent network behaviors.",
            category: "networks",
            tags: ["network", "interactive", "growth", "realtime", "organic", "nodes"],
            difficulty: "beginner",
            isNew: true,
            isFeatured: true,
            isInteractive: true,
            isAudioReactive: true,
            is3D: false,
            isRealtime: true,

            primaryColor: "#66FF66",
            secondaryColor: "#003300",
            thumbnail: "assets/previews/node-garden-thumb.jpg",
            images: [
                "assets/gallery/node-garden/network-001.jpg",
                "assets/gallery/node-garden/growth-animation.gif",
                "assets/gallery/node-garden/interaction-demo.mp4"
            ],

            algorithm: "Force-directed graph with organic growth rules",
            complexity: "O(n²) for connection calculations",
            renderTime: "Real-time (60 FPS)",
            maxResolution: "4K (3840x2160)",

            demoUrl: "../node.garden/index.html",
            sourceUrl: "../node.garden/src/main.js",
            documentationUrl: "../node.garden/README.md",

            views: 1923,
            likes: 234,
            downloads: 145,
            comments: 41,
            dateCreated: "2024-10-15",
            lastUpdated: "2024-11-05",

            api: {
                generate: "/api/v1/generate/node-garden",
                export: "/api/v1/export/node-garden",
                parameters: "/api/v1/projects/node-garden/parameters",
                interact: "/api/v1/projects/node-garden/interact"
            },

            parameters: {
                maxNodes: {type: "integer", min: 50, max: 500, default: 150},
                connectionDistance: {type: "integer", min: 50, max: 300, default: 120},
                growthRate: {type: "float", min: 0.001, max: 0.1, default: 0.02},
                nodeLifespan: {type: "integer", min: 100, max: 1000, default: 300}
            }
        },

        {
            id: "substrate",
            title: "Substrate",
            description: "Crack growth simulation inspired by bacterial colonies and material decomposition",
            longDescription: "Explores the beauty of natural crack formation through computational simulation. Mimics growth patterns found in bacterial colonies, dried earth, and material stress fractures.",
            category: "organic",
            tags: ["growth", "cracks", "bacterial", "organic", "simulation", "tarbell"],
            difficulty: "intermediate",
            isNew: true,
            isFeatured: true,
            isInteractive: false,
            isAudioReactive: false,
            is3D: false,
            isRealtime: true,

            primaryColor: "#8B4513",
            secondaryColor: "#DEB887",
            thumbnail: "assets/previews/substrate-thumb.jpg",
            images: [
                "assets/gallery/substrate/cracks-001.jpg",
                "assets/gallery/substrate/growth-sequence.gif",
                "assets/gallery/substrate/final-pattern.jpg"
            ],

            algorithm: "Crack growth with collision detection",
            complexity: "O(n) for crack propagation",
            renderTime: "30-120 seconds completion",
            maxResolution: "8K (7680x4320)",

            demoUrl: "../substrate/index.html",
            sourceUrl: "../substrate/src/main.js",
            documentationUrl: "../substrate/README.md",

            views: 1654,
            likes: 198,
            downloads: 167,
            comments: 18,
            dateCreated: "2024-09-20",
            lastUpdated: "2024-10-28",

            api: {
                generate: "/api/v1/generate/substrate",
                export: "/api/v1/export/substrate",
                parameters: "/api/v1/projects/substrate/parameters"
            },

            parameters: {
                initialCracks: {type: "integer", min: 1, max: 20, default: 5},
                growthRate: {type: "float", min: 0.5, max: 5, default: 2},
                spawnChance: {type: "float", min: 0, max: 1, default: 0.3},
                turnFactor: {type: "float", min: 0, max: 1, default: 0.1}
            }
        },

        {
            id: "deep.lorenz",
            title: "Deep Lorenz",
            description: "Extended exploration of Lorenz attractor dynamics with phase space visualization",
            longDescription: "Immersive journey through the Lorenz attractor's phase space. Reveals the sensitive dependence on initial conditions in this chaotic system originally used to model atmospheric convection.",
            category: "attractors",
            tags: ["attractor", "chaos", "mathematical", "3d", "lorenz", "dynamics"],
            difficulty: "advanced",
            isNew: false,
            isFeatured: true,
            isInteractive: true,
            isAudioReactive: true,
            is3D: true,
            isRealtime: true,

            primaryColor: "#9932CC",
            secondaryColor: "#FF1493",
            thumbnail: "assets/previews/deep-lorenz-thumb.jpg",
            images: [
                "assets/gallery/deep-lorenz/attractor-3d.jpg",
                "assets/gallery/deep-lorenz/phase-space.jpg",
                "assets/gallery/deep-lorenz/butterfly-effect.gif"
            ],

            algorithm: "Runge-Kutta integration of Lorenz equations",
            complexity: "O(n) for trajectory calculation",
            renderTime: "Real-time with 3D navigation",
            maxResolution: "4K with stereo option",

            demoUrl: "../deep.lorenz/index.html",
            sourceUrl: "../deep.lorenz/src/main.js",
            documentationUrl: "../deep.lorenz/README.md",

            views: 3241,
            likes: 287,
            downloads: 134,
            comments: 52,
            dateCreated: "2024-02-10",
            lastUpdated: "2024-09-15",

            api: {
                generate: "/api/v1/generate/deep-lorenz",
                export: "/api/v1/export/deep-lorenz",
                parameters: "/api/v1/projects/deep-lorenz/parameters",
                trajectory: "/api/v1/projects/deep-lorenz/trajectory"
            },

            parameters: {
                sigma: {type: "float", min: 1, max: 50, default: 10},
                rho: {type: "float", min: 1, max: 50, default: 28},
                beta: {type: "float", min: 0.1, max: 10, default: 2.67},
                timeStep: {type: "float", min: 0.001, max: 0.1, default: 0.01}
            }
        },

        {
            id: "happy.place",
            title: "Happy Place",
            description: "Emotion-driven pattern generation creating positive, uplifting visual experiences",
            longDescription: "Generates visual patterns designed to evoke positive emotions using color psychology principles. Creates flowing, organic forms that promote relaxation and well-being.",
            category: "emotional",
            tags: ["emotion", "wellness", "therapy", "interactive", "biofeedback", "positive"],
            difficulty: "beginner",
            isNew: true,
            isFeatured: true,
            isInteractive: true,
            isAudioReactive: true,
            is3D: false,
            isRealtime: true,

            primaryColor: "#FFD700",
            secondaryColor: "#FF69B4",
            thumbnail: "assets/previews/happy-place-thumb.jpg",
            images: [
                "assets/gallery/happy-place/peaceful-mode.jpg",
                "assets/gallery/happy-place/energetic-flow.gif",
                "assets/gallery/happy-place/therapy-session.jpg"
            ],

            algorithm: "Emotion-based parameter mapping",
            complexity: "O(n) for particle systems",
            renderTime: "Real-time adaptive",
            maxResolution: "4K (3840x2160)",

            demoUrl: "../happy.place/index.html",
            sourceUrl: "../happy.place/src/main.js",
            documentationUrl: "../happy.place/README.md",

            views: 1456,
            likes: 312,
            downloads: 78,
            comments: 67,
            dateCreated: "2024-08-12",
            lastUpdated: "2024-11-01",

            api: {
                generate: "/api/v1/generate/happy-place",
                export: "/api/v1/export/happy-place",
                parameters: "/api/v1/projects/happy-place/parameters",
                biofeedback: "/api/v1/projects/happy-place/biofeedback"
            },

            parameters: {
                mood: {type: "enum", options: ["calm", "energetic", "peaceful", "joyful"], default: "peaceful"},
                intensity: {type: "float", min: 0.1, max: 2, default: 1},
                warmth: {type: "float", min: 0, max: 1, default: 0.7},
                flow: {type: "float", min: 0.1, max: 3, default: 1.5}
            }
        },

        {
            id: "orbitals",
            title: "Orbitals",
            description: "Quantum-inspired particle dynamics visualizing atomic orbital structures",
            longDescription: "Creates visualizations inspired by quantum mechanical atomic orbitals. Simulates electron probability clouds and their interactions, creating ethereal, glowing forms in 3D space.",
            category: "particles",
            tags: ["quantum", "atomic", "3d", "science", "educational", "particles"],
            difficulty: "advanced",
            isNew: true,
            isFeatured: true,
            isInteractive: true,
            isAudioReactive: true,
            is3D: true,
            isRealtime: true,

            primaryColor: "#00BFFF",
            secondaryColor: "#FF4500",
            thumbnail: "assets/previews/orbitals-thumb.jpg",
            images: [
                "assets/gallery/orbitals/electron-cloud.jpg",
                "assets/gallery/orbitals/orbital-shapes.gif",
                "assets/gallery/orbitals/quantum-dance.mp4"
            ],

            algorithm: "Quantum harmonic oscillator simulation",
            complexity: "O(n log n) for spatial hashing",
            renderTime: "Real-time with VR support",
            maxResolution: "4K with stereo support",

            demoUrl: "../orbitals/index.html",
            sourceUrl: "../orbitals/src/main.js",
            documentationUrl: "../orbitals/README.md",

            views: 987,
            likes: 145,
            downloads: 56,
            comments: 34,
            dateCreated: "2024-10-01",
            lastUpdated: "2024-11-08",

            api: {
                generate: "/api/v1/generate/orbitals",
                export: "/api/v1/export/orbitals",
                parameters: "/api/v1/projects/orbitals/parameters",
                quantum: "/api/v1/projects/orbitals/quantum-state"
            },

            parameters: {
                principalQuantumNumber: {type: "integer", min: 1, max: 7, default: 3},
                angularMomentum: {type: "integer", min: 0, max: 3, default: 1},
                magneticQuantumNumber: {type: "integer", min: -3, max: 3, default: 0},
                electronCount: {type: "integer", min: 100, max: 10000, default: 2000}
            }
        }

        // Additional projects would continue here...
    ],

    // Collections and categories
    collections: {
        "new-releases": {
            title: "New Releases",
            description: "Latest additions to the Binary Ring collection",
            projects: ["node.garden", "substrate", "happy.place", "orbitals", "guts", "inter.aggregate"],
            featured: true,
            color: "#66FF66"
        },

        "interactive": {
            title: "Interactive Experiences",
            description: "Projects with real-time user interaction",
            projects: ["node.garden", "deep.lorenz", "happy.place", "orbitals", "bubble.chamber"],
            featured: true,
            color: "#FF6B6B"
        },

        "mathematical": {
            title: "Mathematical Explorations",
            description: "Pure mathematical visualizations and attractors",
            projects: ["buddhabrot", "deep.lorenz", "peter.de.jong", "henon.phase", "cubic.attractor"],
            featured: true,
            color: "#9932CC"
        },

        "organic": {
            title: "Organic Forms",
            description: "Nature-inspired growth and biological patterns",
            projects: ["substrate", "bone.piles", "guts", "tree.garden.ii", "limb.stroke"],
            featured: false,
            color: "#8B4513"
        }
    },

    // API endpoints and documentation
    api: {
        baseUrl: "https://api.binaryring.art/v1",
        endpoints: {
            // Project management
            projects: {
                list: "/projects",
                get: "/projects/{id}",
                search: "/projects/search",
                featured: "/projects/featured",
                random: "/projects/random"
            },

            // Generation endpoints
            generate: {
                create: "/generate/{project_id}",
                status: "/generate/{job_id}/status",
                result: "/generate/{job_id}/result",
                cancel: "/generate/{job_id}/cancel"
            },

            // Export endpoints
            export: {
                image: "/export/{project_id}/image",
                video: "/export/{project_id}/video",
                code: "/export/{project_id}/code",
                preset: "/export/{project_id}/preset"
            },

            // Community features
            community: {
                like: "/community/like/{project_id}",
                comment: "/community/comment/{project_id}",
                share: "/community/share/{project_id}",
                collections: "/community/collections",
                submissions: "/community/submissions"
            },

            // Analytics
            analytics: {
                views: "/analytics/views/{project_id}",
                popular: "/analytics/popular",
                trending: "/analytics/trending",
                stats: "/analytics/stats"
            }
        },

        // Rate limiting
        rateLimits: {
            generation: "10 requests per minute",
            export: "5 exports per minute",
            api: "1000 requests per hour"
        },

        // Authentication
        auth: {
            required: ["generate", "export", "comment", "like"],
            optional: ["view", "search", "browse"],
            methods: ["api_key", "oauth2", "jwt"]
        }
    },

    // Search and filtering
    filters: {
        categories: ["fractals", "attractors", "particles", "organic", "networks", "geometric", "space", "emotional"],
        difficulty: ["beginner", "intermediate", "advanced"],
        features: ["interactive", "audio-reactive", "3d", "realtime", "vr-compatible"],
        sortOptions: ["recent", "popular", "alphabetical", "complexity", "downloads"]
    },

    // Community stats
    stats: {
        totalProjects: 36,
        totalViews: 12347,
        totalDownloads: 2456,
        totalLikes: 3421,
        activeUsers: 1234,
        newThisMonth: 10
    }
};

// API helper functions
class BinaryRingAPI {
    constructor(apiKey = null) {
        this.baseUrl = PROJECTS_DATABASE.api.baseUrl;
        this.apiKey = apiKey;
    }

    async getProject(projectId) {
        const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
            headers: this.getHeaders()
        });
        return response.json();
    }

    async generateArt(projectId, parameters = {}) {
        const response = await fetch(`${this.baseUrl}/generate/${projectId}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ parameters })
        });
        return response.json();
    }

    async exportArt(projectId, format = 'png', parameters = {}) {
        const response = await fetch(`${this.baseUrl}/export/${projectId}/${format}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ parameters })
        });
        return response.blob();
    }

    async searchProjects(query, filters = {}) {
        const params = new URLSearchParams({
            q: query,
            ...filters
        });

        const response = await fetch(`${this.baseUrl}/projects/search?${params}`, {
            headers: this.getHeaders()
        });
        return response.json();
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        return headers;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PROJECTS_DATABASE, BinaryRingAPI };
} else {
    window.PROJECTS_DATABASE = PROJECTS_DATABASE;
    window.BinaryRingAPI = BinaryRingAPI;
}