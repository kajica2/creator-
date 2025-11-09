/**
 * Binary Ring Neural Connection API
 *
 * REST API endpoints for the Neural Connection Engine
 * Provides access to project relationships, similarity analysis, and ML model training
 *
 * @author Binary Ring Collective
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import BinaryRingConnectionEngine from './connectionEngine.js';

class NeuralConnectionAPI {
    constructor(catalogData, options = {}) {
        this.app = express();
        this.port = options.port || 3001;
        this.connectionEngine = new BinaryRingConnectionEngine(catalogData);

        // Configuration
        this.config = {
            rateLimitWindow: 15 * 60 * 1000, // 15 minutes
            rateLimitMax: 100, // requests per window
            corsOrigins: options.corsOrigins || ['http://localhost:3000', 'https://binaryring.art'],
            apiKeyHeader: 'x-api-key',
            requiredApiKey: options.apiKey || process.env.BINARY_RING_API_KEY
        };

        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();

        // Initialize connection engine
        this.initializeEngine();
    }

    /**
     * Initialize the connection engine
     */
    async initializeEngine() {
        try {
            console.log('🔄 Initializing Neural Connection Engine...');
            await this.connectionEngine.initialize();

            // Train the neural network if we have enough data
            if (this.connectionEngine.projects.length >= 5) {
                await this.connectionEngine.trainNeuralNetwork();
            }

            console.log('✅ Neural Connection Engine ready');
        } catch (error) {
            console.error('❌ Failed to initialize Neural Connection Engine:', error);
        }
    }

    /**
     * Setup middleware
     */
    setupMiddleware() {
        // Security
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"]
                }
            }
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: this.config.rateLimitWindow,
            max: this.config.rateLimitMax,
            message: {
                error: 'Too many requests',
                retryAfter: Math.ceil(this.config.rateLimitWindow / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false
        });

        this.app.use('/api/', limiter);

        // CORS
        this.app.use(cors({
            origin: this.config.corsOrigins,
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization', this.config.apiKeyHeader],
            credentials: true
        }));

        // Compression
        this.app.use(compression());

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
            next();
        });
    }

    /**
     * API key authentication middleware
     */
    requireApiKey(req, res, next) {
        const apiKey = req.header(this.config.apiKeyHeader);

        if (!this.config.requiredApiKey) {
            // No API key required
            return next();
        }

        if (!apiKey || apiKey !== this.config.requiredApiKey) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Valid API key required'
            });
        }

        next();
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                engine: this.connectionEngine.isModelTrained ? 'trained' : 'initialized'
            });
        });

        // API base route
        this.app.get('/api', (req, res) => {
            res.json({
                name: 'Binary Ring Neural Connection API',
                version: '1.0.0',
                description: 'Intelligent project relationship analysis and recommendation system',
                endpoints: {
                    projects: '/api/projects',
                    relationships: '/api/projects/:id/related',
                    similarity: '/api/similarity/:id1/:id2',
                    collections: '/api/collections',
                    analytics: '/api/analytics',
                    training: '/api/train',
                    export: '/api/export/:format'
                }
            });
        });

        // Project endpoints
        this.setupProjectRoutes();

        // Relationship endpoints
        this.setupRelationshipRoutes();

        // Collection endpoints
        this.setupCollectionRoutes();

        // Analytics endpoints
        this.setupAnalyticsRoutes();

        // Training endpoints
        this.setupTrainingRoutes();

        // Export endpoints
        this.setupExportRoutes();
    }

    /**
     * Setup project-related routes
     */
    setupProjectRoutes() {
        // Get all projects with basic info
        this.app.get('/api/projects', (req, res) => {
            try {
                const { category, type, limit, offset = 0 } = req.query;

                let projects = this.connectionEngine.projects.map(project => ({
                    id: project.id,
                    title: project.title,
                    category: project.category,
                    type: project.type,
                    description: project.description,
                    isNew: project.isNew,
                    complexity: this.connectionEngine.preprocessedProjects.find(p => p.id === project.id)?.complexity || 0
                }));

                // Apply filters
                if (category) {
                    projects = projects.filter(p => p.category === category);
                }
                if (type) {
                    projects = projects.filter(p => p.type === type);
                }

                // Apply pagination
                const total = projects.length;
                const startIndex = parseInt(offset);
                const endIndex = limit ? startIndex + parseInt(limit) : projects.length;
                projects = projects.slice(startIndex, endIndex);

                res.json({
                    projects,
                    pagination: {
                        total,
                        offset: startIndex,
                        limit: limit ? parseInt(limit) : total,
                        hasMore: endIndex < total
                    }
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
            }
        });

        // Get specific project details
        this.app.get('/api/projects/:id', (req, res) => {
            try {
                const { id } = req.params;
                const project = this.connectionEngine.projects.find(p => p.id === id);

                if (!project) {
                    return res.status(404).json({ error: 'Project not found' });
                }

                const preprocessed = this.connectionEngine.preprocessedProjects.find(p => p.id === id);

                res.json({
                    ...project,
                    analysis: preprocessed ? {
                        complexity: preprocessed.complexity,
                        mathematical: preprocessed.mathematical,
                        visual: preprocessed.visual,
                        technical: preprocessed.technical,
                        interaction: preprocessed.interaction,
                        tags: preprocessed.tags
                    } : null
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch project', details: error.message });
            }
        });

        // Search projects
        this.app.get('/api/projects/search', (req, res) => {
            try {
                const { q, category, type, limit = 20 } = req.query;

                if (!q) {
                    return res.status(400).json({ error: 'Query parameter required' });
                }

                const searchTerm = q.toLowerCase();
                let results = this.connectionEngine.projects.filter(project => {
                    const matchesQuery =
                        project.title.toLowerCase().includes(searchTerm) ||
                        project.description.toLowerCase().includes(searchTerm) ||
                        project.id.includes(searchTerm);

                    const matchesCategory = !category || project.category === category;
                    const matchesType = !type || project.type === type;

                    return matchesQuery && matchesCategory && matchesType;
                });

                // Sort by relevance (simple scoring)
                results = results.map(project => {
                    let score = 0;
                    if (project.title.toLowerCase().includes(searchTerm)) score += 10;
                    if (project.id.includes(searchTerm)) score += 8;
                    if (project.description.toLowerCase().includes(searchTerm)) score += 5;
                    return { ...project, relevanceScore: score };
                });

                results.sort((a, b) => b.relevanceScore - a.relevanceScore);
                results = results.slice(0, parseInt(limit));

                res.json({
                    query: q,
                    total: results.length,
                    results: results.map(({ relevanceScore, ...project }) => project)
                });
            } catch (error) {
                res.status(500).json({ error: 'Search failed', details: error.message });
            }
        });
    }

    /**
     * Setup relationship-related routes
     */
    setupRelationshipRoutes() {
        // Get related projects for a specific project
        this.app.get('/api/projects/:id/related', (req, res) => {
            try {
                const { id } = req.params;
                const { limit = 5 } = req.query;

                if (!this.connectionEngine.projects.find(p => p.id === id)) {
                    return res.status(404).json({ error: 'Project not found' });
                }

                const related = this.connectionEngine.getRelatedProjects(id, parseInt(limit));

                res.json({
                    projectId: id,
                    related: related.map(rel => ({
                        ...rel,
                        project: {
                            id: rel.project.id,
                            title: rel.project.title,
                            category: rel.project.category,
                            type: rel.project.type,
                            description: rel.project.description
                        }
                    }))
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch related projects', details: error.message });
            }
        });

        // Get similarity score between two projects
        this.app.get('/api/similarity/:id1/:id2', (req, res) => {
            try {
                const { id1, id2 } = req.params;

                const project1 = this.connectionEngine.projects.find(p => p.id === id1);
                const project2 = this.connectionEngine.projects.find(p => p.id === id2);

                if (!project1 || !project2) {
                    return res.status(404).json({ error: 'One or both projects not found' });
                }

                const similarity = this.connectionEngine.calculateProjectSimilarity(id1, id2);
                const explanation = this.connectionEngine.explainConnection(id1, id2);

                res.json({
                    project1: { id: id1, title: project1.title },
                    project2: { id: id2, title: project2.title },
                    similarity,
                    explanation,
                    strength: similarity > 0.7 ? 'strong' : similarity > 0.4 ? 'moderate' : 'weak'
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to calculate similarity', details: error.message });
            }
        });

        // Update connection based on user feedback
        this.app.post('/api/connections/:id1/:id2/feedback', this.requireApiKey.bind(this), (req, res) => {
            try {
                const { id1, id2 } = req.params;
                const { feedback } = req.body;

                if (!['relevant', 'not_relevant', 'very_relevant'].includes(feedback)) {
                    return res.status(400).json({
                        error: 'Invalid feedback',
                        valid_values: ['relevant', 'not_relevant', 'very_relevant']
                    });
                }

                this.connectionEngine.updateConnection(id1, id2, feedback);

                res.json({
                    message: 'Connection updated successfully',
                    connection: { id1, id2, feedback },
                    newSimilarity: this.connectionEngine.getSimilarity(id1, id2)
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to update connection', details: error.message });
            }
        });
    }

    /**
     * Setup collection-related routes
     */
    setupCollectionRoutes() {
        // Get all collections (static + dynamic)
        this.app.get('/api/collections', (req, res) => {
            try {
                const { include_dynamic = 'true' } = req.query;

                let collections = [...this.connectionEngine.collections];

                if (include_dynamic === 'true') {
                    const dynamicCollections = this.connectionEngine.generateDynamicCollections();
                    collections = [...collections, ...dynamicCollections];
                }

                res.json({
                    collections: collections.map(collection => ({
                        id: collection.id,
                        title: collection.title,
                        description: collection.description,
                        projectCount: collection.projects.length,
                        curated: collection.curated,
                        featured: collection.featured,
                        auto_generated: collection.auto_generated || false,
                        cohesion_score: collection.cohesion_score
                    }))
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch collections', details: error.message });
            }
        });

        // Get specific collection with projects
        this.app.get('/api/collections/:id', (req, res) => {
            try {
                const { id } = req.params;

                // First check static collections
                let collection = this.connectionEngine.collections.find(c => c.id === id);

                // If not found, check dynamic collections
                if (!collection) {
                    const dynamicCollections = this.connectionEngine.generateDynamicCollections();
                    collection = dynamicCollections.find(c => c.id === id);
                }

                if (!collection) {
                    return res.status(404).json({ error: 'Collection not found' });
                }

                // Get project details
                const projects = collection.projects
                    .map(projectId => this.connectionEngine.projects.find(p => p.id === projectId))
                    .filter(Boolean)
                    .map(project => ({
                        id: project.id,
                        title: project.title,
                        category: project.category,
                        type: project.type,
                        description: project.description,
                        isNew: project.isNew
                    }));

                res.json({
                    ...collection,
                    projects
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch collection', details: error.message });
            }
        });

        // Create new collection based on similarity clustering
        this.app.post('/api/collections/generate', this.requireApiKey.bind(this), (req, res) => {
            try {
                const { seedProjectId, minSimilarity = 0.5, maxProjects = 8 } = req.body;

                if (!this.connectionEngine.projects.find(p => p.id === seedProjectId)) {
                    return res.status(404).json({ error: 'Seed project not found' });
                }

                // Find similar projects
                const related = this.connectionEngine.getRelatedProjects(seedProjectId, 20);
                const similarProjects = related
                    .filter(rel => rel.similarity >= parseFloat(minSimilarity))
                    .slice(0, parseInt(maxProjects) - 1) // -1 for the seed project
                    .map(rel => rel.id);

                const projectIds = [seedProjectId, ...similarProjects];
                const collection = this.connectionEngine.createCollectionFromCluster(projectIds);

                res.status(201).json({
                    message: 'Collection generated successfully',
                    collection: {
                        ...collection,
                        projects: collection.projects.map(id => ({
                            id,
                            title: this.connectionEngine.projects.find(p => p.id === id)?.title
                        }))
                    }
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to generate collection', details: error.message });
            }
        });
    }

    /**
     * Setup analytics routes
     */
    setupAnalyticsRoutes() {
        // Get network analytics
        this.app.get('/api/analytics', (req, res) => {
            try {
                const analytics = this.connectionEngine.getNetworkAnalytics();
                res.json(analytics);
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
            }
        });

        // Get project-specific analytics
        this.app.get('/api/analytics/project/:id', (req, res) => {
            try {
                const { id } = req.params;

                const project = this.connectionEngine.projects.find(p => p.id === id);
                if (!project) {
                    return res.status(404).json({ error: 'Project not found' });
                }

                const connections = this.connectionEngine.connectionWeights.get(id) || [];
                const preprocessed = this.connectionEngine.preprocessedProjects.find(p => p.id === id);

                const analytics = {
                    projectId: id,
                    title: project.title,
                    connections: {
                        total: connections.length,
                        strong: connections.filter(c => c.strength > 0.7).length,
                        moderate: connections.filter(c => c.strength >= 0.4 && c.strength <= 0.7).length,
                        weak: connections.filter(c => c.strength < 0.4).length
                    },
                    features: preprocessed ? {
                        complexity: preprocessed.complexity,
                        mathematical: Object.entries(preprocessed.mathematical).filter(([k, v]) => typeof v === 'boolean' && v).map(([k]) => k),
                        dominantCategory: project.category,
                        tags: preprocessed.tags
                    } : null,
                    rankings: {
                        byConnections: this.getProjectRanking(id, 'connections'),
                        byComplexity: this.getProjectRanking(id, 'complexity')
                    }
                };

                res.json(analytics);
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch project analytics', details: error.message });
            }
        });
    }

    /**
     * Setup training routes
     */
    setupTrainingRoutes() {
        // Retrain neural network
        this.app.post('/api/train', this.requireApiKey.bind(this), async (req, res) => {
            try {
                const { force = false } = req.body;

                if (this.connectionEngine.projects.length < 5) {
                    return res.status(400).json({
                        error: 'Insufficient data for training',
                        message: 'At least 5 projects required for neural network training'
                    });
                }

                if (this.connectionEngine.isModelTrained && !force) {
                    return res.status(409).json({
                        error: 'Model already trained',
                        message: 'Use force=true to retrain'
                    });
                }

                await this.connectionEngine.trainNeuralNetwork();
                await this.connectionEngine.calculateSimilarityMatrix();
                await this.connectionEngine.generateInitialConnections();

                res.json({
                    message: 'Neural network training completed successfully',
                    status: 'trained',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({ error: 'Training failed', details: error.message });
            }
        });

        // Get training status
        this.app.get('/api/train/status', (req, res) => {
            res.json({
                isTrained: this.connectionEngine.isModelTrained,
                projectCount: this.connectionEngine.projects.length,
                minProjectsRequired: 5,
                canTrain: this.connectionEngine.projects.length >= 5,
                lastTrainingTime: this.connectionEngine.lastTrainingTime || null
            });
        });
    }

    /**
     * Setup export routes
     */
    setupExportRoutes() {
        // Export connection graph in various formats
        this.app.get('/api/export/:format', (req, res) => {
            try {
                const { format } = req.params;
                const { threshold = 0.3 } = req.query;

                if (!['json', 'graphml', 'dot', 'csv'].includes(format)) {
                    return res.status(400).json({
                        error: 'Invalid format',
                        supported: ['json', 'graphml', 'dot', 'csv']
                    });
                }

                // Temporarily adjust threshold
                const originalThreshold = this.connectionEngine.config.minSimilarityThreshold;
                this.connectionEngine.config.minSimilarityThreshold = parseFloat(threshold);

                const exportData = this.connectionEngine.exportConnectionGraph(format);

                // Restore original threshold
                this.connectionEngine.config.minSimilarityThreshold = originalThreshold;

                // Set appropriate content type
                const contentTypes = {
                    json: 'application/json',
                    graphml: 'application/xml',
                    dot: 'text/plain',
                    csv: 'text/csv'
                };

                res.setHeader('Content-Type', contentTypes[format]);
                res.setHeader('Content-Disposition', `attachment; filename="binary-ring-connections.${format}"`);

                if (format === 'json') {
                    res.json(exportData);
                } else {
                    res.send(exportData);
                }
            } catch (error) {
                res.status(500).json({ error: 'Export failed', details: error.message });
            }
        });

        // Export project features as CSV
        this.app.get('/api/export/features/csv', (req, res) => {
            try {
                let csv = 'Project ID,Title,Category,Type,Complexity,Mathematical Features,Visual Features,Technical Features,Interaction Features\n';

                this.connectionEngine.preprocessedProjects.forEach(project => {
                    const original = this.connectionEngine.projects.find(p => p.id === project.id);
                    const mathFeatures = Object.entries(project.mathematical)
                        .filter(([k, v]) => typeof v === 'boolean' && v)
                        .map(([k]) => k)
                        .join(';');

                    csv += `"${project.id}","${original?.title || ''}","${original?.category || ''}","${original?.type || ''}",${project.complexity},"${mathFeatures}","","",""\n`;
                });

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="binary-ring-features.csv"');
                res.send(csv);
            } catch (error) {
                res.status(500).json({ error: 'Feature export failed', details: error.message });
            }
        });
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method
            });
        });

        // General error handler
        this.app.use((error, req, res, next) => {
            console.error('API Error:', error);

            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
                timestamp: new Date().toISOString()
            });
        });
    }

    /**
     * Utility method to get project ranking
     */
    getProjectRanking(projectId, metric) {
        let rankings;

        if (metric === 'connections') {
            rankings = Array.from(this.connectionEngine.connectionWeights.entries())
                .map(([id, connections]) => ({ id, score: connections.length }))
                .sort((a, b) => b.score - a.score);
        } else if (metric === 'complexity') {
            rankings = this.connectionEngine.preprocessedProjects
                .map(project => ({ id: project.id, score: project.complexity }))
                .sort((a, b) => b.score - a.score);
        }

        const position = rankings.findIndex(item => item.id === projectId) + 1;
        const total = rankings.length;
        const percentile = Math.round((1 - (position - 1) / total) * 100);

        return {
            position,
            total,
            percentile,
            score: rankings[position - 1]?.score || 0
        };
    }

    /**
     * Start the API server
     */
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, () => {
                    console.log(`🚀 Binary Ring Neural Connection API running on port ${this.port}`);
                    console.log(`📖 API documentation available at http://localhost:${this.port}/api`);
                    console.log(`💚 Health check available at http://localhost:${this.port}/health`);
                    resolve();
                });

                this.server.on('error', (error) => {
                    if (error.code === 'EADDRINUSE') {
                        console.error(`❌ Port ${this.port} is already in use`);
                    }
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Stop the API server
     */
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('🛑 Binary Ring Neural Connection API stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

export default NeuralConnectionAPI;