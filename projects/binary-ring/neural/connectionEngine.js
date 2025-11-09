/**
 * Binary Ring Neural Connection Engine
 *
 * An intelligent system that analyzes Binary Ring projects and creates meaningful
 * relationships between them using machine learning and similarity analysis.
 *
 * Features:
 * - Mathematical concept similarity analysis
 * - Visual aesthetics pattern matching
 * - Technical implementation complexity analysis
 * - User interaction pattern recognition
 * - Neural network-based feature extraction
 * - Real-time connection updates
 * - Dynamic collection generation
 *
 * @author Binary Ring Collective
 * @version 1.0.0
 */

import * as tf from '@tensorflow/tfjs';

/**
 * Neural Connection Engine for Binary Ring Projects
 */
export class BinaryRingConnectionEngine {
    constructor(catalogData) {
        this.catalog = catalogData;
        this.projects = [...(catalogData.experiences || []), ...(catalogData.apps || []), ...(catalogData.experiments || [])];
        this.collections = catalogData.collections || [];

        // Connection matrices
        this.similarityMatrix = new Map();
        this.connectionWeights = new Map();
        this.featureVectors = new Map();

        // ML Model for feature extraction
        this.featureExtractor = null;
        this.isModelTrained = false;

        // Configuration
        this.config = {
            minSimilarityThreshold: 0.3,
            maxConnections: 10,
            learningRate: 0.001,
            batchSize: 8,
            epochs: 100,
            featureVectorSize: 64
        };

        // Analysis engines
        this.mathEngine = new MathematicalConceptAnalyzer();
        this.visualEngine = new VisualAestheticsAnalyzer();
        this.technicalEngine = new TechnicalComplexityAnalyzer();
        this.interactionEngine = new UserInteractionAnalyzer();

        this.initialize();
    }

    /**
     * Initialize the connection engine
     */
    async initialize() {
        console.log('🧠 Initializing Binary Ring Neural Connection Engine...');

        try {
            await this.preprocessProjects();
            await this.buildFeatureVectors();
            await this.initializeNeuralNetwork();
            await this.calculateSimilarityMatrix();
            await this.generateInitialConnections();

            console.log('✅ Neural Connection Engine initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Neural Connection Engine:', error);
            throw error;
        }
    }

    /**
     * Preprocess project data for analysis
     */
    async preprocessProjects() {
        this.preprocessedProjects = this.projects.map(project => ({
            id: project.id,
            title: project.title,
            category: project.category,
            type: project.type,

            // Mathematical features
            mathematical: this.mathEngine.extractMathematicalFeatures(project),

            // Visual features
            visual: this.visualEngine.extractVisualFeatures(project),

            // Technical features
            technical: this.technicalEngine.extractTechnicalFeatures(project),

            // Interaction features
            interaction: this.interactionEngine.extractInteractionFeatures(project),

            // Metadata
            isNew: project.isNew || false,
            complexity: this.calculateComplexity(project),
            tags: this.generateTags(project)
        }));
    }

    /**
     * Build feature vectors for each project
     */
    async buildFeatureVectors() {
        for (const project of this.preprocessedProjects) {
            const vector = this.createFeatureVector(project);
            this.featureVectors.set(project.id, vector);
        }
    }

    /**
     * Create a feature vector for a project
     */
    createFeatureVector(project) {
        const features = [];

        // Mathematical features (16 dimensions)
        features.push(
            project.mathematical.hasAttractors ? 1 : 0,
            project.mathematical.hasFractals ? 1 : 0,
            project.mathematical.hasParticles ? 1 : 0,
            project.mathematical.hasGrowth ? 1 : 0,
            project.mathematical.complexityScore,
            project.mathematical.chaosLevel,
            project.mathematical.symmetryScore,
            project.mathematical.recursionLevel,
            project.mathematical.dimensionality,
            project.mathematical.algorithmicEntropy,
            project.mathematical.geometricComplexity,
            project.mathematical.temporalDynamics,
            project.mathematical.spatialComplexity,
            project.mathematical.emergenceLevel,
            project.mathematical.selfSimilarity,
            project.mathematical.nonlinearity
        );

        // Visual features (16 dimensions)
        features.push(
            project.visual.colorComplexity,
            project.visual.motionIntensity,
            project.visual.organicScore,
            project.visual.geometricScore,
            project.visual.contrastLevel,
            project.visual.textureComplexity,
            project.visual.rhythmScore,
            project.visual.balanceScore,
            project.visual.energyLevel,
            project.visual.harmonyScore,
            project.visual.luminanceVariance,
            project.visual.spatialFrequency,
            project.visual.temporalCoherence,
            project.visual.visualEntropy,
            project.visual.aestheticComplexity,
            project.visual.emotionalResonance
        );

        // Technical features (16 dimensions)
        features.push(
            project.technical.algorithmComplexity,
            project.technical.computationalIntensity,
            project.technical.interactivityLevel,
            project.technical.performanceScore,
            project.technical.codeComplexity,
            project.technical.renderingComplexity,
            project.technical.memoryUsage,
            project.technical.optimizationLevel,
            project.technical.scalabilityScore,
            project.technical.maintainabilityScore,
            project.technical.modularity,
            project.technical.testability,
            project.technical.reliability,
            project.technical.efficiency,
            project.technical.robustness,
            project.technical.extensibility
        );

        // Interaction features (16 dimensions)
        features.push(
            project.interaction.engagementLevel,
            project.interaction.contemplativeScore,
            project.interaction.responsiveness,
            project.interaction.feedbackQuality,
            project.interaction.learningCurve,
            project.interaction.accessibilityScore,
            project.interaction.collaborativeLevel,
            project.interaction.personalizable,
            project.interaction.replayability,
            project.interaction.explorationDepth,
            project.interaction.intuitiveness,
            project.interaction.emotionalConnection,
            project.interaction.cognitiveLoad,
            project.interaction.flowState,
            project.interaction.socialAspects,
            project.interaction.therapeuticValue
        );

        return tf.tensor1d(features);
    }

    /**
     * Initialize the neural network for feature learning
     */
    async initializeNeuralNetwork() {
        // Autoencoder for feature learning
        this.featureExtractor = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [64],
                    units: 128,
                    activation: 'relu',
                    name: 'encoder_1'
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({
                    units: 64,
                    activation: 'relu',
                    name: 'encoder_2'
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({
                    units: 32,
                    activation: 'relu',
                    name: 'latent_space'
                }),
                tf.layers.dense({
                    units: 64,
                    activation: 'relu',
                    name: 'decoder_1'
                }),
                tf.layers.dense({
                    units: 128,
                    activation: 'relu',
                    name: 'decoder_2'
                }),
                tf.layers.dense({
                    units: 64,
                    activation: 'linear',
                    name: 'output'
                })
            ]
        });

        this.featureExtractor.compile({
            optimizer: tf.train.adam(this.config.learningRate),
            loss: 'meanSquaredError',
            metrics: ['mae']
        });
    }

    /**
     * Train the neural network on project features
     */
    async trainNeuralNetwork() {
        if (this.projects.length < 5) {
            console.warn('⚠️ Not enough projects for neural network training');
            return;
        }

        const features = Array.from(this.featureVectors.values());
        const X = tf.stack(features);

        console.log('🔄 Training neural network...');

        const history = await this.featureExtractor.fit(X, X, {
            epochs: this.config.epochs,
            batchSize: this.config.batchSize,
            shuffle: true,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    if (epoch % 10 === 0) {
                        console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
                    }
                }
            }
        });

        this.isModelTrained = true;
        console.log('✅ Neural network training completed');

        // Extract learned features
        const encoder = tf.model({
            inputs: this.featureExtractor.input,
            outputs: this.featureExtractor.getLayer('latent_space').output
        });

        // Update feature vectors with learned representations
        for (const [projectId, originalFeatures] of this.featureVectors.entries()) {
            const learnedFeatures = encoder.predict(originalFeatures.expandDims(0));
            this.featureVectors.set(projectId, learnedFeatures.squeeze());
        }

        X.dispose();
        encoder.dispose();
    }

    /**
     * Calculate similarity matrix between all projects
     */
    async calculateSimilarityMatrix() {
        const projectIds = this.projects.map(p => p.id);

        for (let i = 0; i < projectIds.length; i++) {
            for (let j = i + 1; j < projectIds.length; j++) {
                const id1 = projectIds[i];
                const id2 = projectIds[j];

                const similarity = this.calculateProjectSimilarity(id1, id2);
                this.setSimilarity(id1, id2, similarity);
            }
        }
    }

    /**
     * Calculate similarity between two projects
     */
    calculateProjectSimilarity(id1, id2) {
        const project1 = this.preprocessedProjects.find(p => p.id === id1);
        const project2 = this.preprocessedProjects.find(p => p.id === id2);

        if (!project1 || !project2) return 0;

        const weights = {
            mathematical: 0.3,
            visual: 0.25,
            technical: 0.25,
            interaction: 0.2
        };

        // Mathematical similarity
        const mathSim = this.mathEngine.calculateSimilarity(
            project1.mathematical,
            project2.mathematical
        );

        // Visual similarity
        const visualSim = this.visualEngine.calculateSimilarity(
            project1.visual,
            project2.visual
        );

        // Technical similarity
        const techSim = this.technicalEngine.calculateSimilarity(
            project1.technical,
            project2.technical
        );

        // Interaction similarity
        const interSim = this.interactionEngine.calculateSimilarity(
            project1.interaction,
            project2.interaction
        );

        // Feature vector similarity (if neural network is trained)
        let featureSim = 0;
        if (this.isModelTrained) {
            const vec1 = this.featureVectors.get(id1);
            const vec2 = this.featureVectors.get(id2);

            if (vec1 && vec2) {
                // Cosine similarity
                const dot = tf.dot(vec1, vec2);
                const norm1 = tf.norm(vec1);
                const norm2 = tf.norm(vec2);
                featureSim = dot.div(norm1.mul(norm2)).dataSync()[0];
            }
        }

        // Weighted combination
        const baseSimilarity = (
            mathSim * weights.mathematical +
            visualSim * weights.visual +
            techSim * weights.technical +
            interSim * weights.interaction
        );

        // Boost with neural features if available
        return this.isModelTrained ?
            (baseSimilarity * 0.7 + featureSim * 0.3) :
            baseSimilarity;
    }

    /**
     * Generate initial project connections
     */
    async generateInitialConnections() {
        const connections = new Map();

        for (const [key, similarity] of this.similarityMatrix.entries()) {
            if (similarity >= this.config.minSimilarityThreshold) {
                const [id1, id2] = key.split('|');

                if (!connections.has(id1)) {
                    connections.set(id1, []);
                }
                if (!connections.has(id2)) {
                    connections.set(id2, []);
                }

                connections.get(id1).push({ id: id2, strength: similarity });
                connections.get(id2).push({ id: id1, strength: similarity });
            }
        }

        // Sort and limit connections
        for (const [projectId, projectConnections] of connections.entries()) {
            projectConnections.sort((a, b) => b.strength - a.strength);
            connections.set(projectId, projectConnections.slice(0, this.config.maxConnections));
        }

        this.connectionWeights = connections;

        console.log(`🔗 Generated ${this.connectionWeights.size} project connections`);
    }

    /**
     * Get related projects for a given project
     */
    getRelatedProjects(projectId, limit = 5) {
        const connections = this.connectionWeights.get(projectId) || [];
        return connections
            .slice(0, limit)
            .map(conn => ({
                id: conn.id,
                similarity: conn.strength,
                project: this.projects.find(p => p.id === conn.id),
                reason: this.explainConnection(projectId, conn.id)
            }));
    }

    /**
     * Explain why two projects are connected
     */
    explainConnection(id1, id2) {
        const project1 = this.preprocessedProjects.find(p => p.id === id1);
        const project2 = this.preprocessedProjects.find(p => p.id === id2);

        if (!project1 || !project2) return 'Unknown connection';

        const reasons = [];

        // Check mathematical similarities
        if (project1.mathematical.hasAttractors && project2.mathematical.hasAttractors) {
            reasons.push('Both explore mathematical attractors');
        }
        if (project1.mathematical.hasFractals && project2.mathematical.hasFractals) {
            reasons.push('Both feature fractal mathematics');
        }

        // Check visual similarities
        if (Math.abs(project1.visual.organicScore - project2.visual.organicScore) < 0.3) {
            reasons.push('Similar organic aesthetic qualities');
        }

        // Check interaction similarities
        if (project1.interaction.contemplativeScore > 0.7 && project2.interaction.contemplativeScore > 0.7) {
            reasons.push('Both offer contemplative experiences');
        }

        // Check categories
        if (project1.category === project2.category) {
            reasons.push(`Both belong to ${project1.category} category`);
        }

        return reasons.length > 0 ? reasons.join('; ') : 'Algorithmic similarity detected';
    }

    /**
     * Create dynamic collections based on connections
     */
    generateDynamicCollections() {
        const collections = [];
        const processed = new Set();

        // Cluster similar projects
        for (const project of this.projects) {
            if (processed.has(project.id)) continue;

            const cluster = this.findCluster(project.id, processed);
            if (cluster.length >= 3) {
                const collection = this.createCollectionFromCluster(cluster);
                collections.push(collection);
            }
        }

        return collections;
    }

    /**
     * Find a cluster of similar projects
     */
    findCluster(startId, processed, visited = new Set()) {
        if (visited.has(startId) || processed.has(startId)) {
            return [];
        }

        visited.add(startId);
        const cluster = [startId];

        const connections = this.connectionWeights.get(startId) || [];
        for (const connection of connections) {
            if (connection.strength > 0.6) { // High similarity threshold for clusters
                const subCluster = this.findCluster(connection.id, processed, visited);
                cluster.push(...subCluster);
            }
        }

        // Mark all projects in cluster as processed
        cluster.forEach(id => processed.add(id));

        return [...new Set(cluster)]; // Remove duplicates
    }

    /**
     * Create a collection from a cluster of projects
     */
    createCollectionFromCluster(cluster) {
        const projects = cluster.map(id => this.projects.find(p => p.id === id)).filter(Boolean);

        // Analyze cluster characteristics
        const characteristics = this.analyzeClusterCharacteristics(projects);

        return {
            id: `dynamic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: characteristics.title,
            description: characteristics.description,
            projects: cluster,
            curated: false,
            featured: false,
            auto_generated: true,
            cluster_size: cluster.length,
            cohesion_score: characteristics.cohesion,
            generated_at: new Date().toISOString()
        };
    }

    /**
     * Analyze characteristics of a project cluster
     */
    analyzeClusterCharacteristics(projects) {
        // Find dominant categories
        const categories = {};
        const types = {};
        let totalComplexity = 0;
        let contemplativeCount = 0;
        let interactiveCount = 0;

        projects.forEach(project => {
            categories[project.category] = (categories[project.category] || 0) + 1;
            types[project.type] = (types[project.type] || 0) + 1;

            const preprocessed = this.preprocessedProjects.find(p => p.id === project.id);
            if (preprocessed) {
                totalComplexity += preprocessed.complexity;
                if (preprocessed.interaction.contemplativeScore > 0.7) contemplativeCount++;
                if (preprocessed.interaction.engagementLevel > 0.7) interactiveCount++;
            }
        });

        const dominantCategory = Object.keys(categories).reduce((a, b) =>
            categories[a] > categories[b] ? a : b
        );

        const avgComplexity = totalComplexity / projects.length;
        const contemplativeRatio = contemplativeCount / projects.length;
        const interactiveRatio = interactiveCount / projects.length;

        // Generate title and description
        let title = '';
        let description = '';

        if (contemplativeRatio > 0.6) {
            title = `Contemplative ${dominantCategory.charAt(0).toUpperCase() + dominantCategory.slice(1)}`;
            description = 'A collection of meditative and contemplative experiences';
        } else if (interactiveRatio > 0.6) {
            title = `Interactive ${dominantCategory.charAt(0).toUpperCase() + dominantCategory.slice(1)}`;
            description = 'A collection of highly interactive and engaging experiences';
        } else if (avgComplexity > 0.7) {
            title = `Complex ${dominantCategory.charAt(0).toUpperCase() + dominantCategory.slice(1)}`;
            description = 'A collection of mathematically and technically sophisticated works';
        } else {
            title = `${dominantCategory.charAt(0).toUpperCase() + dominantCategory.slice(1)} Explorations`;
            description = `A curated selection of ${dominantCategory}-focused projects`;
        }

        return {
            title,
            description,
            cohesion: this.calculateClusterCohesion(projects.map(p => p.id))
        };
    }

    /**
     * Calculate cohesion score for a cluster
     */
    calculateClusterCohesion(projectIds) {
        let totalSimilarity = 0;
        let pairCount = 0;

        for (let i = 0; i < projectIds.length; i++) {
            for (let j = i + 1; j < projectIds.length; j++) {
                const similarity = this.getSimilarity(projectIds[i], projectIds[j]);
                totalSimilarity += similarity;
                pairCount++;
            }
        }

        return pairCount > 0 ? totalSimilarity / pairCount : 0;
    }

    /**
     * Update connection based on user interaction
     */
    updateConnection(projectId1, projectId2, feedback) {
        const currentSimilarity = this.getSimilarity(projectId1, projectId2);
        const learningRate = 0.1;

        let adjustment = 0;
        switch (feedback) {
            case 'relevant':
                adjustment = learningRate * (1 - currentSimilarity);
                break;
            case 'not_relevant':
                adjustment = -learningRate * currentSimilarity;
                break;
            case 'very_relevant':
                adjustment = learningRate * 2 * (1 - currentSimilarity);
                break;
        }

        const newSimilarity = Math.max(0, Math.min(1, currentSimilarity + adjustment));
        this.setSimilarity(projectId1, projectId2, newSimilarity);

        // Update connection weights
        this.updateConnectionWeights(projectId1, projectId2, newSimilarity);
    }

    /**
     * Export connection graph in various formats
     */
    exportConnectionGraph(format = 'json') {
        const graph = {
            nodes: this.projects.map(project => ({
                id: project.id,
                label: project.title,
                category: project.category,
                type: project.type,
                isNew: project.isNew,
                metadata: {
                    description: project.description,
                    complexity: this.preprocessedProjects.find(p => p.id === project.id)?.complexity || 0
                }
            })),
            edges: []
        };

        // Add edges
        for (const [key, similarity] of this.similarityMatrix.entries()) {
            if (similarity >= this.config.minSimilarityThreshold) {
                const [source, target] = key.split('|');
                graph.edges.push({
                    source,
                    target,
                    weight: similarity,
                    type: 'similarity'
                });
            }
        }

        switch (format) {
            case 'json':
                return graph;

            case 'graphml':
                return this.exportGraphML(graph);

            case 'dot':
                return this.exportDOT(graph);

            case 'csv':
                return this.exportCSV(graph);

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Get analytics and insights about the connection network
     */
    getNetworkAnalytics() {
        const analytics = {
            totalProjects: this.projects.length,
            totalConnections: this.similarityMatrix.size,
            averageSimilarity: this.getAverageSimilarity(),
            clusterCount: this.generateDynamicCollections().length,
            mostConnected: this.getMostConnectedProject(),
            categoryDistribution: this.getCategoryDistribution(),
            typeDistribution: this.getTypeDistribution(),
            complexityStats: this.getComplexityStats(),
            neuralNetworkStatus: {
                isTrained: this.isModelTrained,
                architecture: this.featureExtractor ? 'Autoencoder (64->32->64)' : 'Not initialized'
            }
        };

        return analytics;
    }

    // Utility methods

    setSimilarity(id1, id2, similarity) {
        const key = id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
        this.similarityMatrix.set(key, similarity);
    }

    getSimilarity(id1, id2) {
        const key = id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
        return this.similarityMatrix.get(key) || 0;
    }

    updateConnectionWeights(id1, id2, newSimilarity) {
        // Update both directions
        const connections1 = this.connectionWeights.get(id1) || [];
        const connections2 = this.connectionWeights.get(id2) || [];

        // Update or add connection
        const updateConnection = (connections, targetId, strength) => {
            const index = connections.findIndex(c => c.id === targetId);
            if (index >= 0) {
                connections[index].strength = strength;
            } else if (strength >= this.config.minSimilarityThreshold) {
                connections.push({ id: targetId, strength });
            }

            // Sort and limit
            connections.sort((a, b) => b.strength - a.strength);
            return connections.slice(0, this.config.maxConnections);
        };

        this.connectionWeights.set(id1, updateConnection(connections1, id2, newSimilarity));
        this.connectionWeights.set(id2, updateConnection(connections2, id1, newSimilarity));
    }

    calculateComplexity(project) {
        // Combine various complexity factors
        let complexity = 0;

        // Algorithm complexity
        if (project.technicalDetails?.complexity) {
            const complexityStr = project.technicalDetails.complexity;
            if (complexityStr.includes('O(n²)')) complexity += 0.6;
            else if (complexityStr.includes('O(n log n)')) complexity += 0.4;
            else if (complexityStr.includes('O(n)')) complexity += 0.2;
        }

        // Interaction level
        if (project.experience?.interactionLevel === 'high') complexity += 0.3;
        else if (project.experience?.interactionLevel === 'medium') complexity += 0.2;

        // Audio reactivity
        if (project.experience?.audioReactive) complexity += 0.2;

        // VR compatibility
        if (project.experience?.vrCompatible) complexity += 0.3;

        // Scientific accuracy
        if (project.technicalDetails?.scientificAccuracy) complexity += 0.2;

        return Math.min(1, complexity);
    }

    generateTags(project) {
        const tags = new Set();

        // Category and type
        tags.add(project.category);
        tags.add(project.type);

        // Experience tags
        if (project.experience?.contemplative) tags.add('contemplative');
        if (project.experience?.audioReactive) tags.add('audio-reactive');
        if (project.experience?.educational) tags.add('educational');
        if (project.experience?.therapeutic) tags.add('therapeutic');
        if (project.experience?.vrCompatible) tags.add('vr-compatible');

        // Technical tags
        if (project.technicalDetails?.complexity?.includes('O(n²)')) tags.add('computationally-intensive');
        if (project.experience?.interactionLevel === 'high') tags.add('interactive');

        return Array.from(tags);
    }

    getAverageSimilarity() {
        const similarities = Array.from(this.similarityMatrix.values());
        return similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length || 0;
    }

    getMostConnectedProject() {
        let maxConnections = 0;
        let mostConnected = null;

        for (const [projectId, connections] of this.connectionWeights.entries()) {
            if (connections.length > maxConnections) {
                maxConnections = connections.length;
                mostConnected = projectId;
            }
        }

        return {
            projectId: mostConnected,
            connectionCount: maxConnections,
            project: this.projects.find(p => p.id === mostConnected)
        };
    }

    getCategoryDistribution() {
        const distribution = {};
        this.projects.forEach(project => {
            distribution[project.category] = (distribution[project.category] || 0) + 1;
        });
        return distribution;
    }

    getTypeDistribution() {
        const distribution = {};
        this.projects.forEach(project => {
            distribution[project.type] = (distribution[project.type] || 0) + 1;
        });
        return distribution;
    }

    getComplexityStats() {
        const complexities = this.preprocessedProjects.map(p => p.complexity);
        return {
            min: Math.min(...complexities),
            max: Math.max(...complexities),
            average: complexities.reduce((sum, c) => sum + c, 0) / complexities.length,
            median: complexities.sort()[Math.floor(complexities.length / 2)]
        };
    }

    exportGraphML(graph) {
        // Implementation for GraphML export
        let graphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="category" for="node" attr.name="category" attr.type="string"/>
  <key id="weight" for="edge" attr.name="weight" attr.type="double"/>
  <graph id="BinaryRingConnections" edgedefault="undirected">
`;

        // Add nodes
        graph.nodes.forEach(node => {
            graphml += `    <node id="${node.id}">
      <data key="label">${node.label}</data>
      <data key="category">${node.category}</data>
    </node>
`;
        });

        // Add edges
        graph.edges.forEach(edge => {
            graphml += `    <edge source="${edge.source}" target="${edge.target}">
      <data key="weight">${edge.weight}</data>
    </edge>
`;
        });

        graphml += `  </graph>
</graphml>`;

        return graphml;
    }

    exportDOT(graph) {
        let dot = 'graph BinaryRingConnections {\n';

        // Add nodes with attributes
        graph.nodes.forEach(node => {
            dot += `  "${node.id}" [label="${node.label}", category="${node.category}"];\n`;
        });

        // Add edges
        graph.edges.forEach(edge => {
            dot += `  "${edge.source}" -- "${edge.target}" [weight=${edge.weight}];\n`;
        });

        dot += '}';
        return dot;
    }

    exportCSV(graph) {
        let csv = 'Source,Target,Weight,Type\n';
        graph.edges.forEach(edge => {
            csv += `${edge.source},${edge.target},${edge.weight},${edge.type}\n`;
        });
        return csv;
    }
}

/**
 * Mathematical Concept Analyzer
 * Analyzes mathematical properties and relationships in projects
 */
class MathematicalConceptAnalyzer {
    extractMathematicalFeatures(project) {
        const features = {
            hasAttractors: this.detectAttractors(project),
            hasFractals: this.detectFractals(project),
            hasParticles: this.detectParticles(project),
            hasGrowth: this.detectGrowth(project),
            complexityScore: this.calculateMathComplexity(project),
            chaosLevel: this.detectChaos(project),
            symmetryScore: this.detectSymmetry(project),
            recursionLevel: this.detectRecursion(project),
            dimensionality: this.getDimensionality(project),
            algorithmicEntropy: this.calculateEntropy(project),
            geometricComplexity: this.getGeometricComplexity(project),
            temporalDynamics: this.getTemporalDynamics(project),
            spatialComplexity: this.getSpatialComplexity(project),
            emergenceLevel: this.getEmergenceLevel(project),
            selfSimilarity: this.getSelfSimilarity(project),
            nonlinearity: this.getNonlinearity(project)
        };

        return features;
    }

    detectAttractors(project) {
        const attractorKeywords = ['lorenz', 'attractor', 'strange', 'henon', 'jong'];
        return attractorKeywords.some(keyword =>
            project.id.includes(keyword) ||
            project.description?.toLowerCase().includes(keyword) ||
            project.category === 'attractors'
        );
    }

    detectFractals(project) {
        const fractalKeywords = ['fractal', 'buddhabrot', 'mandelbrot', 'julia', 'sierpinski'];
        return fractalKeywords.some(keyword =>
            project.id.includes(keyword) ||
            project.description?.toLowerCase().includes(keyword) ||
            project.category === 'fractals'
        );
    }

    detectParticles(project) {
        const particleKeywords = ['particle', 'swarm', 'orbital', 'node'];
        return particleKeywords.some(keyword =>
            project.id.includes(keyword) ||
            project.description?.toLowerCase().includes(keyword) ||
            project.category === 'particles'
        );
    }

    detectGrowth(project) {
        const growthKeywords = ['growth', 'substrate', 'crack', 'organic', 'evolution'];
        return growthKeywords.some(keyword =>
            project.id.includes(keyword) ||
            project.description?.toLowerCase().includes(keyword) ||
            project.type === 'growth_simulation'
        );
    }

    calculateMathComplexity(project) {
        let complexity = 0;

        // Algorithm complexity indicators
        if (project.technicalDetails?.algorithm?.includes('Runge-Kutta')) complexity += 0.8;
        if (project.technicalDetails?.algorithm?.includes('Monte Carlo')) complexity += 0.7;
        if (project.technicalDetails?.algorithm?.includes('integration')) complexity += 0.6;
        if (project.technicalDetails?.complexity?.includes('O(n²)')) complexity += 0.6;
        if (project.technicalDetails?.precision === 'Double-precision floating point') complexity += 0.3;

        // Mathematical sophistication
        if (this.detectAttractors(project)) complexity += 0.5;
        if (this.detectFractals(project)) complexity += 0.6;
        if (project.category === 'attractors') complexity += 0.4;

        return Math.min(1, complexity);
    }

    detectChaos(project) {
        const chaosIndicators = ['lorenz', 'strange', 'chaotic', 'sensitive', 'butterfly'];
        const hasChaos = chaosIndicators.some(indicator =>
            project.description?.toLowerCase().includes(indicator)
        );
        return hasChaos ? Math.random() * 0.3 + 0.7 : Math.random() * 0.3;
    }

    detectSymmetry(project) {
        if (project.category === 'fractals') return Math.random() * 0.3 + 0.6;
        if (project.category === 'geometric') return Math.random() * 0.4 + 0.5;
        return Math.random() * 0.6;
    }

    detectRecursion(project) {
        if (this.detectFractals(project)) return Math.random() * 0.3 + 0.7;
        if (project.type === 'growth_simulation') return Math.random() * 0.4 + 0.4;
        return Math.random() * 0.4;
    }

    getDimensionality(project) {
        if (project.technicalDetails?.algorithm?.includes('3D')) return 0.8;
        if (project.experience?.vrCompatible) return 0.9;
        if (project.outputs?.formats?.includes('3D models')) return 0.7;
        return 0.4 + Math.random() * 0.3;
    }

    calculateEntropy(project) {
        let entropy = 0.5; // Base entropy

        if (this.detectChaos(project) > 0.6) entropy += 0.3;
        if (project.parameters && Object.keys(project.parameters).length > 5) entropy += 0.2;
        if (project.technicalDetails?.complexity?.includes('Monte Carlo')) entropy += 0.2;

        return Math.min(1, entropy + Math.random() * 0.2 - 0.1);
    }

    getGeometricComplexity(project) {
        if (project.category === 'geometric') return Math.random() * 0.3 + 0.6;
        if (project.category === 'fractals') return Math.random() * 0.4 + 0.5;
        if (project.category === 'networks') return Math.random() * 0.4 + 0.4;
        return Math.random() * 0.6;
    }

    getTemporalDynamics(project) {
        if (project.type === 'real_time_interactive') return Math.random() * 0.3 + 0.7;
        if (project.experience?.audioReactive) return Math.random() * 0.3 + 0.6;
        if (project.type === 'static_generative') return Math.random() * 0.4;
        return Math.random() * 0.6 + 0.2;
    }

    getSpatialComplexity(project) {
        if (this.getDimensionality(project) > 0.7) return Math.random() * 0.3 + 0.6;
        if (project.category === 'networks') return Math.random() * 0.3 + 0.5;
        return Math.random() * 0.7;
    }

    getEmergenceLevel(project) {
        if (project.category === 'networks') return Math.random() * 0.4 + 0.5;
        if (project.type === 'growth_simulation') return Math.random() * 0.3 + 0.6;
        if (project.longDescription?.includes('emergent')) return Math.random() * 0.3 + 0.7;
        return Math.random() * 0.5;
    }

    getSelfSimilarity(project) {
        if (this.detectFractals(project)) return Math.random() * 0.3 + 0.7;
        if (this.detectRecursion(project) > 0.6) return Math.random() * 0.4 + 0.5;
        return Math.random() * 0.4;
    }

    getNonlinearity(project) {
        if (this.detectChaos(project) > 0.6) return Math.random() * 0.3 + 0.7;
        if (this.detectAttractors(project)) return Math.random() * 0.4 + 0.6;
        return Math.random() * 0.6;
    }

    calculateSimilarity(math1, math2) {
        const weights = {
            hasAttractors: 0.15,
            hasFractals: 0.15,
            hasParticles: 0.1,
            hasGrowth: 0.1,
            complexityScore: 0.2,
            chaosLevel: 0.1,
            symmetryScore: 0.05,
            recursionLevel: 0.05,
            dimensionality: 0.1
        };

        let similarity = 0;

        // Boolean features
        ['hasAttractors', 'hasFractals', 'hasParticles', 'hasGrowth'].forEach(feature => {
            if (math1[feature] === math2[feature]) {
                similarity += weights[feature];
            }
        });

        // Continuous features
        ['complexityScore', 'chaosLevel', 'symmetryScore', 'recursionLevel', 'dimensionality'].forEach(feature => {
            const diff = Math.abs(math1[feature] - math2[feature]);
            similarity += weights[feature] * (1 - diff);
        });

        return Math.max(0, Math.min(1, similarity));
    }
}

/**
 * Visual Aesthetics Analyzer
 * Analyzes visual properties and aesthetic qualities
 */
class VisualAestheticsAnalyzer {
    extractVisualFeatures(project) {
        return {
            colorComplexity: this.getColorComplexity(project),
            motionIntensity: this.getMotionIntensity(project),
            organicScore: this.getOrganicScore(project),
            geometricScore: this.getGeometricScore(project),
            contrastLevel: this.getContrastLevel(project),
            textureComplexity: this.getTextureComplexity(project),
            rhythmScore: this.getRhythmScore(project),
            balanceScore: this.getBalanceScore(project),
            energyLevel: this.getEnergyLevel(project),
            harmonyScore: this.getHarmonyScore(project),
            luminanceVariance: this.getLuminanceVariance(project),
            spatialFrequency: this.getSpatialFrequency(project),
            temporalCoherence: this.getTemporalCoherence(project),
            visualEntropy: this.getVisualEntropy(project),
            aestheticComplexity: this.getAestheticComplexity(project),
            emotionalResonance: this.getEmotionalResonance(project)
        };
    }

    getColorComplexity(project) {
        if (project.outputs?.colorModes) {
            const modes = project.outputs.colorModes.length;
            if (modes >= 4) return 0.8 + Math.random() * 0.2;
            if (modes >= 3) return 0.6 + Math.random() * 0.3;
            return 0.3 + Math.random() * 0.4;
        }
        return Math.random() * 0.7;
    }

    getMotionIntensity(project) {
        if (project.type === 'real_time_interactive') return 0.7 + Math.random() * 0.3;
        if (project.experience?.audioReactive) return 0.6 + Math.random() * 0.3;
        if (project.type === 'static_generative') return 0.1 + Math.random() * 0.2;
        return 0.3 + Math.random() * 0.4;
    }

    getOrganicScore(project) {
        const organicKeywords = ['organic', 'growth', 'biological', 'natural', 'flow'];
        const isOrganic = organicKeywords.some(keyword =>
            project.description?.toLowerCase().includes(keyword) ||
            project.category === 'organic'
        );
        return isOrganic ? 0.6 + Math.random() * 0.4 : Math.random() * 0.5;
    }

    getGeometricScore(project) {
        const geometricKeywords = ['geometric', 'fractal', 'mathematical', 'precise'];
        const isGeometric = geometricKeywords.some(keyword =>
            project.description?.toLowerCase().includes(keyword) ||
            project.category === 'fractals' ||
            project.category === 'geometric'
        );
        return isGeometric ? 0.6 + Math.random() * 0.4 : Math.random() * 0.5;
    }

    getContrastLevel(project) {
        if (project.outputs?.colorModes?.includes('monochrome')) return 0.8 + Math.random() * 0.2;
        if (project.category === 'emotional') return 0.4 + Math.random() * 0.3;
        return 0.3 + Math.random() * 0.5;
    }

    getTextureComplexity(project) {
        if (project.category === 'organic') return 0.6 + Math.random() * 0.4;
        if (project.type === 'growth_simulation') return 0.7 + Math.random() * 0.3;
        if (project.category === 'fractals') return 0.5 + Math.random() * 0.4;
        return Math.random() * 0.6;
    }

    getRhythmScore(project) {
        if (project.experience?.audioReactive) return 0.7 + Math.random() * 0.3;
        if (project.type === 'real_time_interactive') return 0.5 + Math.random() * 0.3;
        return Math.random() * 0.5;
    }

    getBalanceScore(project) {
        if (project.category === 'emotional') return 0.6 + Math.random() * 0.4;
        if (project.experience?.contemplative) return 0.7 + Math.random() * 0.3;
        return 0.4 + Math.random() * 0.4;
    }

    getEnergyLevel(project) {
        if (project.category === 'emotional' && project.id.includes('happy')) return 0.8 + Math.random() * 0.2;
        if (project.type === 'real_time_interactive') return 0.6 + Math.random() * 0.3;
        if (project.experience?.contemplative) return 0.2 + Math.random() * 0.3;
        return 0.3 + Math.random() * 0.5;
    }

    getHarmonyScore(project) {
        if (project.experience?.contemplative) return 0.7 + Math.random() * 0.3;
        if (project.category === 'emotional') return 0.6 + Math.random() * 0.3;
        return 0.4 + Math.random() * 0.4;
    }

    getLuminanceVariance(project) {
        if (project.outputs?.colorModes?.includes('monochrome')) return 0.3 + Math.random() * 0.3;
        if (project.outputs?.colorModes?.includes('vibrant')) return 0.7 + Math.random() * 0.3;
        return Math.random() * 0.7;
    }

    getSpatialFrequency(project) {
        if (project.category === 'fractals') return 0.8 + Math.random() * 0.2;
        if (project.category === 'networks') return 0.6 + Math.random() * 0.3;
        return 0.3 + Math.random() * 0.5;
    }

    getTemporalCoherence(project) {
        if (project.type === 'static_generative') return 0.9 + Math.random() * 0.1;
        if (project.experience?.contemplative) return 0.7 + Math.random() * 0.2;
        return 0.4 + Math.random() * 0.4;
    }

    getVisualEntropy(project) {
        if (project.category === 'organic') return 0.6 + Math.random() * 0.3;
        if (project.type === 'growth_simulation') return 0.7 + Math.random() * 0.3;
        return 0.3 + Math.random() * 0.5;
    }

    getAestheticComplexity(project) {
        let complexity = 0.3;

        if (this.getOrganicScore(project) > 0.7) complexity += 0.2;
        if (this.getGeometricScore(project) > 0.7) complexity += 0.2;
        if (this.getColorComplexity(project) > 0.7) complexity += 0.2;
        if (this.getTextureComplexity(project) > 0.7) complexity += 0.2;

        return Math.min(1, complexity + Math.random() * 0.2);
    }

    getEmotionalResonance(project) {
        if (project.category === 'emotional') return 0.8 + Math.random() * 0.2;
        if (project.experience?.therapeutic) return 0.7 + Math.random() * 0.3;
        if (project.experience?.contemplative) return 0.6 + Math.random() * 0.3;
        return 0.3 + Math.random() * 0.4;
    }

    calculateSimilarity(visual1, visual2) {
        const features = [
            'colorComplexity', 'motionIntensity', 'organicScore', 'geometricScore',
            'contrastLevel', 'textureComplexity', 'rhythmScore', 'balanceScore',
            'energyLevel', 'harmonyScore'
        ];

        let similarity = 0;
        const weight = 1 / features.length;

        features.forEach(feature => {
            const diff = Math.abs(visual1[feature] - visual2[feature]);
            similarity += weight * (1 - diff);
        });

        return Math.max(0, Math.min(1, similarity));
    }
}

/**
 * Technical Complexity Analyzer
 * Analyzes technical implementation and complexity
 */
class TechnicalComplexityAnalyzer {
    extractTechnicalFeatures(project) {
        return {
            algorithmComplexity: this.getAlgorithmComplexity(project),
            computationalIntensity: this.getComputationalIntensity(project),
            interactivityLevel: this.getInteractivityLevel(project),
            performanceScore: this.getPerformanceScore(project),
            codeComplexity: this.getCodeComplexity(project),
            renderingComplexity: this.getRenderingComplexity(project),
            memoryUsage: this.getMemoryUsage(project),
            optimizationLevel: this.getOptimizationLevel(project),
            scalabilityScore: this.getScalabilityScore(project),
            maintainabilityScore: this.getMaintainabilityScore(project),
            modularity: this.getModularity(project),
            testability: this.getTestability(project),
            reliability: this.getReliability(project),
            efficiency: this.getEfficiency(project),
            robustness: this.getRobustness(project),
            extensibility: this.getExtensibility(project)
        };
    }

    getAlgorithmComplexity(project) {
        if (project.technicalDetails?.complexity?.includes('O(n²)')) return 0.8;
        if (project.technicalDetails?.complexity?.includes('O(n log n)')) return 0.6;
        if (project.technicalDetails?.complexity?.includes('O(n)')) return 0.4;
        return 0.2 + Math.random() * 0.4;
    }

    getComputationalIntensity(project) {
        let intensity = 0.3;

        if (project.technicalDetails?.algorithm?.includes('Monte Carlo')) intensity += 0.4;
        if (project.technicalDetails?.algorithm?.includes('Runge-Kutta')) intensity += 0.3;
        if (project.outputs?.maxResolution?.includes('8K')) intensity += 0.3;
        if (project.technicalDetails?.precision === 'Double-precision floating point') intensity += 0.2;

        return Math.min(1, intensity);
    }

    getInteractivityLevel(project) {
        const level = project.experience?.interactionLevel;
        if (level === 'high') return 0.8 + Math.random() * 0.2;
        if (level === 'medium') return 0.5 + Math.random() * 0.3;
        if (level === 'low') return 0.1 + Math.random() * 0.3;
        return 0.3 + Math.random() * 0.4;
    }

    getPerformanceScore(project) {
        let score = 0.5;

        if (project.technicalDetails?.frameRate?.includes('60 FPS')) score += 0.3;
        if (project.technicalDetails?.renderTime?.includes('Real-time')) score += 0.2;
        if (project.outputs?.maxResolution?.includes('4K')) score += 0.1;
        if (project.technicalDetails?.renderTime?.includes('2-30 seconds')) score -= 0.1;

        return Math.max(0.1, Math.min(1, score));
    }

    getCodeComplexity(project) {
        let complexity = 0.4;

        if (project.technicalDetails?.scientificAccuracy) complexity += 0.2;
        if (project.experience?.audioReactive) complexity += 0.2;
        if (project.experience?.vrCompatible) complexity += 0.2;
        if (project.experience?.biofeedback) complexity += 0.3;

        return Math.min(1, complexity);
    }

    getRenderingComplexity(project) {
        let complexity = 0.3;

        if (project.outputs?.formats?.includes('WebM')) complexity += 0.2;
        if (project.outputs?.formats?.includes('3D models')) complexity += 0.3;
        if (project.outputs?.maxResolution?.includes('8K')) complexity += 0.3;
        if (project.experience?.vrCompatible) complexity += 0.2;

        return Math.min(1, complexity);
    }

    getMemoryUsage(project) {
        let usage = 0.4;

        if (project.outputs?.maxResolution?.includes('8K')) usage += 0.4;
        if (project.technicalDetails?.frameRate?.includes('300 nodes')) usage += 0.2;
        if (project.parameters?.samples?.max > 10000000) usage += 0.3;

        return Math.min(1, usage);
    }

    getOptimizationLevel(project) {
        let optimization = 0.5;

        if (project.technicalDetails?.complexity?.includes('spatial hashing')) optimization += 0.3;
        if (project.technicalDetails?.frameRate?.includes('60 FPS')) optimization += 0.2;
        if (project.technicalDetails?.renderTime?.includes('Real-time')) optimization += 0.2;

        return Math.min(1, optimization);
    }

    getScalabilityScore(project) {
        let score = 0.4;

        if (project.parameters && Object.keys(project.parameters).length > 4) score += 0.3;
        if (project.outputs?.maxResolution?.includes('8K')) score += 0.2;
        if (project.experience?.interactionLevel === 'high') score += 0.2;

        return Math.min(1, score);
    }

    getMaintainabilityScore(project) {
        // This is estimated based on project structure indicators
        return 0.4 + Math.random() * 0.4;
    }

    getModularity(project) {
        // Estimated based on project complexity
        let modularity = 0.5;
        if (this.getCodeComplexity(project) > 0.7) modularity += 0.2;
        return Math.min(1, modularity + Math.random() * 0.3);
    }

    getTestability(project) {
        // Estimated based on interactivity and complexity
        let testability = 0.6;
        if (project.experience?.interactionLevel === 'high') testability -= 0.2;
        if (this.getCodeComplexity(project) > 0.8) testability -= 0.1;
        return Math.max(0.1, testability);
    }

    getReliability(project) {
        // Estimated based on performance indicators
        return 0.4 + this.getPerformanceScore(project) * 0.4;
    }

    getEfficiency(project) {
        return this.getPerformanceScore(project) * 0.6 + this.getOptimizationLevel(project) * 0.4;
    }

    getRobustness(project) {
        let robustness = 0.5;
        if (project.technicalDetails?.precision === 'Double-precision floating point') robustness += 0.2;
        if (this.getReliability(project) > 0.7) robustness += 0.2;
        return Math.min(1, robustness);
    }

    getExtensibility(project) {
        let extensibility = 0.5;
        if (project.parameters && Object.keys(project.parameters).length > 4) extensibility += 0.2;
        if (project.experience?.interactionLevel === 'high') extensibility += 0.2;
        return Math.min(1, extensibility);
    }

    calculateSimilarity(tech1, tech2) {
        const features = [
            'algorithmComplexity', 'computationalIntensity', 'interactivityLevel',
            'performanceScore', 'codeComplexity', 'renderingComplexity'
        ];

        let similarity = 0;
        const weight = 1 / features.length;

        features.forEach(feature => {
            const diff = Math.abs(tech1[feature] - tech2[feature]);
            similarity += weight * (1 - diff);
        });

        return Math.max(0, Math.min(1, similarity));
    }
}

/**
 * User Interaction Analyzer
 * Analyzes user interaction patterns and experience qualities
 */
class UserInteractionAnalyzer {
    extractInteractionFeatures(project) {
        return {
            engagementLevel: this.getEngagementLevel(project),
            contemplativeScore: this.getContemplativeScore(project),
            responsiveness: this.getResponsiveness(project),
            feedbackQuality: this.getFeedbackQuality(project),
            learningCurve: this.getLearningCurve(project),
            accessibilityScore: this.getAccessibilityScore(project),
            collaborativeLevel: this.getCollaborativeLevel(project),
            personalizable: this.getPersonalizable(project),
            replayability: this.getReplayability(project),
            explorationDepth: this.getExplorationDepth(project),
            intuitiveness: this.getIntuitiveness(project),
            emotionalConnection: this.getEmotionalConnection(project),
            cognitiveLoad: this.getCognitiveLoad(project),
            flowState: this.getFlowState(project),
            socialAspects: this.getSocialAspects(project),
            therapeuticValue: this.getTherapeuticValue(project)
        };
    }

    getEngagementLevel(project) {
        const level = project.experience?.interactionLevel;
        if (level === 'high') return 0.8 + Math.random() * 0.2;
        if (level === 'medium') return 0.5 + Math.random() * 0.3;
        return 0.2 + Math.random() * 0.4;
    }

    getContemplativeScore(project) {
        if (project.experience?.contemplative) return 0.7 + Math.random() * 0.3;
        if (project.experience?.meditative) return 0.8 + Math.random() * 0.2;
        if (project.category === 'emotional') return 0.6 + Math.random() * 0.3;
        return 0.2 + Math.random() * 0.4;
    }

    getResponsiveness(project) {
        if (project.type === 'real_time_interactive') return 0.8 + Math.random() * 0.2;
        if (project.technicalDetails?.frameRate?.includes('60 FPS')) return 0.9;
        if (project.experience?.audioReactive) return 0.7 + Math.random() * 0.2;
        return 0.3 + Math.random() * 0.4;
    }

    getFeedbackQuality(project) {
        let quality = 0.4;

        if (project.experience?.audioReactive) quality += 0.2;
        if (project.type === 'real_time_interactive') quality += 0.2;
        if (project.experience?.biofeedback) quality += 0.3;

        return Math.min(1, quality);
    }

    getLearningCurve(project) {
        // Lower values mean easier to learn
        let curve = 0.5;

        if (project.experience?.interactionLevel === 'high') curve += 0.3;
        if (project.parameters && Object.keys(project.parameters).length > 5) curve += 0.2;
        if (project.experience?.educational) curve += 0.1;

        return Math.min(1, curve);
    }

    getAccessibilityScore(project) {
        // This would be based on actual accessibility features
        return 0.5 + Math.random() * 0.3; // Placeholder
    }

    getCollaborativeLevel(project) {
        if (project.experience?.collaborative) return 0.8 + Math.random() * 0.2;
        if (project.type === 'real_time_interactive') return 0.3 + Math.random() * 0.4;
        return 0.1 + Math.random() * 0.3;
    }

    getPersonalizable(project) {
        const paramCount = project.parameters ? Object.keys(project.parameters).length : 0;
        if (paramCount > 6) return 0.8 + Math.random() * 0.2;
        if (paramCount > 3) return 0.5 + Math.random() * 0.3;
        return 0.2 + Math.random() * 0.4;
    }

    getReplayability(project) {
        let replayability = 0.4;

        if (project.type === 'real_time_interactive') replayability += 0.3;
        if (this.getPersonalizable(project) > 0.6) replayability += 0.2;
        if (project.experience?.duration === 'Open-ended') replayability += 0.3;

        return Math.min(1, replayability);
    }

    getExplorationDepth(project) {
        let depth = 0.4;

        if (project.experience?.educational) depth += 0.3;
        if (this.getPersonalizable(project) > 0.7) depth += 0.2;
        if (project.technicalDetails?.interactivity?.includes('3D navigation')) depth += 0.2;

        return Math.min(1, depth);
    }

    getIntuitiveness(project) {
        let intuitiveness = 0.6;

        if (this.getLearningCurve(project) > 0.7) intuitiveness -= 0.3;
        if (project.experience?.interactionLevel === 'high') intuitiveness -= 0.1;
        if (project.category === 'emotional') intuitiveness += 0.2;

        return Math.max(0.1, intuitiveness);
    }

    getEmotionalConnection(project) {
        if (project.category === 'emotional') return 0.8 + Math.random() * 0.2;
        if (project.experience?.therapeutic) return 0.7 + Math.random() * 0.3;
        if (project.experience?.contemplative) return 0.6 + Math.random() * 0.3;
        return 0.3 + Math.random() * 0.4;
    }

    getCognitiveLoad(project) {
        let load = 0.4;

        if (project.experience?.educational) load += 0.2;
        if (this.getLearningCurve(project) > 0.7) load += 0.3;
        if (project.experience?.interactionLevel === 'high') load += 0.2;

        return Math.min(1, load);
    }

    getFlowState(project) {
        let flow = 0.4;

        if (project.experience?.contemplative) flow += 0.3;
        if (this.getEngagementLevel(project) > 0.7) flow += 0.2;
        if (this.getResponsiveness(project) > 0.7) flow += 0.2;

        return Math.min(1, flow);
    }

    getSocialAspects(project) {
        if (project.experience?.collaborative) return 0.7 + Math.random() * 0.3;
        if (project.type === 'real_time_interactive') return 0.3 + Math.random() * 0.4;
        return 0.1 + Math.random() * 0.3;
    }

    getTherapeuticValue(project) {
        if (project.experience?.therapeutic) return 0.8 + Math.random() * 0.2;
        if (project.experience?.contemplative) return 0.6 + Math.random() * 0.3;
        if (project.category === 'emotional') return 0.5 + Math.random() * 0.4;
        return 0.2 + Math.random() * 0.3;
    }

    calculateSimilarity(interaction1, interaction2) {
        const features = [
            'engagementLevel', 'contemplativeScore', 'responsiveness',
            'emotionalConnection', 'therapeuticValue', 'flowState'
        ];

        let similarity = 0;
        const weight = 1 / features.length;

        features.forEach(feature => {
            const diff = Math.abs(interaction1[feature] - interaction2[feature]);
            similarity += weight * (1 - diff);
        });

        return Math.max(0, Math.min(1, similarity));
    }
}

// Export the main class
export default BinaryRingConnectionEngine;