/**
 * Binary Ring Neural Connection System
 * Main entry point and initialization
 *
 * @author Binary Ring Collective
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import BinaryRingConnectionEngine from './connectionEngine.js';
import NeuralConnectionAPI from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main Neural Connection System Class
 */
class BinaryRingNeuralSystem {
    constructor(options = {}) {
        this.options = {
            catalogPath: options.catalogPath || '../catalog/artist-catalog.json',
            apiPort: options.apiPort || 3001,
            enableAPI: options.enableAPI !== false,
            enableAutoUpdate: options.enableAutoUpdate !== false,
            updateInterval: options.updateInterval || 30 * 60 * 1000, // 30 minutes
            ...options
        };

        this.connectionEngine = null;
        this.api = null;
        this.updateInterval = null;
    }

    /**
     * Initialize the neural connection system
     */
    async initialize() {
        try {
            console.log('🧠 Initializing Binary Ring Neural Connection System...');

            // Load catalog data
            const catalogData = await this.loadCatalogData();

            // Initialize connection engine
            this.connectionEngine = new BinaryRingConnectionEngine(catalogData);
            await this.connectionEngine.initialize();

            // Train neural network if enough data
            if (this.connectionEngine.projects.length >= 5) {
                console.log('🔄 Training neural network...');
                await this.connectionEngine.trainNeuralNetwork();
            }

            // Start API server if enabled
            if (this.options.enableAPI) {
                await this.startAPI();
            }

            // Setup auto-update if enabled
            if (this.options.enableAutoUpdate) {
                this.setupAutoUpdate();
            }

            console.log('✅ Binary Ring Neural Connection System initialized successfully');
            this.printSystemInfo();

        } catch (error) {
            console.error('❌ Failed to initialize Neural Connection System:', error);
            throw error;
        }
    }

    /**
     * Load catalog data from file
     */
    async loadCatalogData() {
        try {
            const catalogPath = path.resolve(__dirname, this.options.catalogPath);
            console.log(`📖 Loading catalog from: ${catalogPath}`);

            const catalogContent = await fs.readFile(catalogPath, 'utf8');
            const catalogData = JSON.parse(catalogContent);

            console.log(`✅ Loaded ${catalogData.experiences?.length || 0} projects from catalog`);
            return catalogData;

        } catch (error) {
            console.error('❌ Failed to load catalog data:', error);
            throw new Error(`Could not load catalog from ${this.options.catalogPath}: ${error.message}`);
        }
    }

    /**
     * Start the API server
     */
    async startAPI() {
        try {
            this.api = new NeuralConnectionAPI(
                this.connectionEngine.catalog,
                {
                    port: this.options.apiPort,
                    corsOrigins: this.options.corsOrigins,
                    apiKey: this.options.apiKey
                }
            );

            await this.api.start();
        } catch (error) {
            console.error('❌ Failed to start API server:', error);
            throw error;
        }
    }

    /**
     * Setup automatic updates
     */
    setupAutoUpdate() {
        this.updateInterval = setInterval(async () => {
            try {
                console.log('🔄 Running automatic system update...');
                await this.updateConnections();
                console.log('✅ Automatic update completed');
            } catch (error) {
                console.error('❌ Automatic update failed:', error);
            }
        }, this.options.updateInterval);

        console.log(`⏰ Auto-update enabled (every ${Math.round(this.options.updateInterval / 60000)} minutes)`);
    }

    /**
     * Update connections and retrain if needed
     */
    async updateConnections() {
        try {
            // Reload catalog data
            const catalogData = await this.loadCatalogData();

            // Check if projects have been added
            const newProjectCount = catalogData.experiences?.length || 0;
            const currentProjectCount = this.connectionEngine.projects.length;

            if (newProjectCount > currentProjectCount) {
                console.log(`📈 Found ${newProjectCount - currentProjectCount} new projects, retraining...`);

                // Reinitialize with new data
                this.connectionEngine = new BinaryRingConnectionEngine(catalogData);
                await this.connectionEngine.initialize();

                // Retrain if enough data
                if (this.connectionEngine.projects.length >= 5) {
                    await this.connectionEngine.trainNeuralNetwork();
                }

                console.log('🔄 System updated with new projects');
            } else {
                // Just recalculate connections with any feedback updates
                await this.connectionEngine.calculateSimilarityMatrix();
                await this.connectionEngine.generateInitialConnections();
                console.log('🔄 Connection matrix updated');
            }

        } catch (error) {
            console.error('❌ Failed to update connections:', error);
            throw error;
        }
    }

    /**
     * Get project recommendations
     */
    getRecommendations(projectId, limit = 5) {
        return this.connectionEngine.getRelatedProjects(projectId, limit);
    }

    /**
     * Get network analytics
     */
    getAnalytics() {
        return this.connectionEngine.getNetworkAnalytics();
    }

    /**
     * Generate dynamic collections
     */
    generateCollections() {
        return this.connectionEngine.generateDynamicCollections();
    }

    /**
     * Export connection graph
     */
    exportGraph(format = 'json') {
        return this.connectionEngine.exportConnectionGraph(format);
    }

    /**
     * Add user feedback for connection learning
     */
    addFeedback(projectId1, projectId2, feedback) {
        this.connectionEngine.updateConnection(projectId1, projectId2, feedback);
    }

    /**
     * Print system information
     */
    printSystemInfo() {
        const analytics = this.connectionEngine.getNetworkAnalytics();

        console.log('\n📊 System Information:');
        console.log('========================');
        console.log(`Total Projects: ${analytics.totalProjects}`);
        console.log(`Total Connections: ${analytics.totalConnections}`);
        console.log(`Average Similarity: ${analytics.averageSimilarity.toFixed(3)}`);
        console.log(`Dynamic Collections: ${analytics.clusterCount}`);
        console.log(`Most Connected: ${analytics.mostConnected.project?.title || 'N/A'} (${analytics.mostConnected.connectionCount} connections)`);
        console.log(`Neural Network: ${analytics.neuralNetworkStatus.isTrained ? 'Trained' : 'Not Trained'}`);

        if (this.options.enableAPI) {
            console.log(`API Server: Running on port ${this.options.apiPort}`);
        }

        console.log('========================\n');
    }

    /**
     * Shutdown the system gracefully
     */
    async shutdown() {
        console.log('🛑 Shutting down Neural Connection System...');

        try {
            // Clear auto-update interval
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }

            // Stop API server
            if (this.api) {
                await this.api.stop();
            }

            // Dispose TensorFlow resources
            if (this.connectionEngine?.featureExtractor) {
                this.connectionEngine.featureExtractor.dispose();
            }

            // Clear feature vectors
            if (this.connectionEngine?.featureVectors) {
                for (const tensor of this.connectionEngine.featureVectors.values()) {
                    tensor.dispose();
                }
            }

            console.log('✅ Neural Connection System shut down successfully');

        } catch (error) {
            console.error('❌ Error during shutdown:', error);
        }
    }
}

/**
 * CLI interface and example usage
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        switch (command) {
            case 'start':
                await startSystem();
                break;

            case 'analyze':
                await analyzeProjects(args[1]);
                break;

            case 'export':
                await exportConnections(args[1] || 'json');
                break;

            case 'recommendations':
                await getRecommendations(args[1], args[2] ? parseInt(args[2]) : 5);
                break;

            default:
                showUsage();
        }
    } catch (error) {
        console.error('❌ Command failed:', error.message);
        process.exit(1);
    }
}

async function startSystem() {
    const system = new BinaryRingNeuralSystem({
        enableAPI: true,
        enableAutoUpdate: true,
        apiPort: process.env.PORT || 3001
    });

    await system.initialize();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received interrupt signal...');
        await system.shutdown();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received termination signal...');
        await system.shutdown();
        process.exit(0);
    });
}

async function analyzeProjects(projectId) {
    const system = new BinaryRingNeuralSystem({ enableAPI: false, enableAutoUpdate: false });
    await system.initialize();

    if (projectId) {
        // Analyze specific project
        const recommendations = system.getRecommendations(projectId);
        console.log(`\n🔍 Analysis for project: ${projectId}`);
        console.log('Related projects:');
        recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec.project.title} (similarity: ${rec.similarity.toFixed(3)})`);
            console.log(`   Reason: ${rec.reason}`);
        });
    } else {
        // Show general analytics
        const analytics = system.getAnalytics();
        console.log('\n📊 Network Analytics:');
        console.log(JSON.stringify(analytics, null, 2));
    }

    await system.shutdown();
}

async function exportConnections(format) {
    const system = new BinaryRingNeuralSystem({ enableAPI: false, enableAutoUpdate: false });
    await system.initialize();

    const graph = system.exportGraph(format);
    const filename = `binary-ring-connections.${format}`;

    if (format === 'json') {
        await fs.writeFile(filename, JSON.stringify(graph, null, 2));
    } else {
        await fs.writeFile(filename, graph);
    }

    console.log(`✅ Connection graph exported to: ${filename}`);
    await system.shutdown();
}

async function getRecommendations(projectId, limit) {
    if (!projectId) {
        throw new Error('Project ID required for recommendations');
    }

    const system = new BinaryRingNeuralSystem({ enableAPI: false, enableAutoUpdate: false });
    await system.initialize();

    const recommendations = system.getRecommendations(projectId, limit);

    console.log(`\n🎯 Recommendations for: ${projectId}`);
    if (recommendations.length === 0) {
        console.log('No similar projects found');
    } else {
        recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec.project.title}`);
            console.log(`   Similarity: ${(rec.similarity * 100).toFixed(1)}%`);
            console.log(`   Reason: ${rec.reason}`);
            console.log(`   Category: ${rec.project.category}`);
            console.log();
        });
    }

    await system.shutdown();
}

function showUsage() {
    console.log(`
Binary Ring Neural Connection System CLI

Usage:
  node index.js start                           - Start the full system with API
  node index.js analyze [project-id]           - Analyze projects or specific project
  node index.js export [format]                - Export connection graph (json|graphml|dot|csv)
  node index.js recommendations <project-id> [limit] - Get project recommendations

Examples:
  node index.js start
  node index.js analyze buddhabrot
  node index.js export json
  node index.js recommendations "node.garden" 10

Environment Variables:
  PORT                    - API server port (default: 3001)
  BINARY_RING_API_KEY     - API key for protected endpoints
`);
}

// Export the main system class and run CLI if this is the main module
export default BinaryRingNeuralSystem;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}