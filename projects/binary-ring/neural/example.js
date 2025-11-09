/**
 * Binary Ring Neural Connection Engine - Usage Examples
 *
 * This file demonstrates how to use the Neural Connection Engine
 * for various analysis and recommendation tasks.
 *
 * @author Binary Ring Collective
 * @version 1.0.0
 */

import BinaryRingNeuralSystem from './index.js';
import fs from 'fs/promises';

/**
 * Basic usage example
 */
async function basicUsageExample() {
    console.log('🔬 Basic Usage Example');
    console.log('======================\n');

    // Initialize the system
    const system = new BinaryRingNeuralSystem({
        enableAPI: false,    // Disable API for this example
        enableAutoUpdate: false  // Disable auto-updates
    });

    await system.initialize();

    // Get recommendations for a specific project
    const projectId = 'buddhabrot';
    const recommendations = system.getRecommendations(projectId, 5);

    console.log(`🎯 Recommendations for "${projectId}":`);
    recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.project.title}`);
        console.log(`   Similarity: ${(rec.similarity * 100).toFixed(1)}%`);
        console.log(`   Category: ${rec.project.category}`);
        console.log(`   Reason: ${rec.reason}\n`);
    });

    await system.shutdown();
}

/**
 * Analytics example
 */
async function analyticsExample() {
    console.log('📊 Analytics Example');
    console.log('====================\n');

    const system = new BinaryRingNeuralSystem({
        enableAPI: false,
        enableAutoUpdate: false
    });

    await system.initialize();

    // Get overall network analytics
    const analytics = system.getAnalytics();

    console.log('Network Overview:');
    console.log(`- Total Projects: ${analytics.totalProjects}`);
    console.log(`- Total Connections: ${analytics.totalConnections}`);
    console.log(`- Average Similarity: ${(analytics.averageSimilarity * 100).toFixed(1)}%`);
    console.log(`- Dynamic Collections: ${analytics.clusterCount}`);
    console.log(`- Most Connected: ${analytics.mostConnected.project?.title || 'N/A'} (${analytics.mostConnected.connectionCount} connections)\n`);

    console.log('Category Distribution:');
    Object.entries(analytics.categoryDistribution).forEach(([category, count]) => {
        console.log(`- ${category}: ${count} projects`);
    });

    console.log('\nType Distribution:');
    Object.entries(analytics.typeDistribution).forEach(([type, count]) => {
        console.log(`- ${type}: ${count} projects`);
    });

    console.log('\nComplexity Statistics:');
    console.log(`- Min: ${analytics.complexityStats.min.toFixed(3)}`);
    console.log(`- Max: ${analytics.complexityStats.max.toFixed(3)}`);
    console.log(`- Average: ${analytics.complexityStats.average.toFixed(3)}`);
    console.log(`- Median: ${analytics.complexityStats.median.toFixed(3)}`);

    await system.shutdown();
}

/**
 * Dynamic collections example
 */
async function collectionsExample() {
    console.log('📚 Dynamic Collections Example');
    console.log('==============================\n');

    const system = new BinaryRingNeuralSystem({
        enableAPI: false,
        enableAutoUpdate: false
    });

    await system.initialize();

    // Generate dynamic collections
    const collections = system.generateCollections();

    console.log(`Found ${collections.length} dynamic collections:\n`);

    collections.forEach((collection, index) => {
        console.log(`${index + 1}. ${collection.title}`);
        console.log(`   Description: ${collection.description}`);
        console.log(`   Projects: ${collection.projects.length}`);
        console.log(`   Cohesion Score: ${(collection.cohesion_score * 100).toFixed(1)}%`);
        console.log(`   Projects: ${collection.projects.slice(0, 3).join(', ')}${collection.projects.length > 3 ? '...' : ''}\n`);
    });

    await system.shutdown();
}

/**
 * User feedback learning example
 */
async function feedbackLearningExample() {
    console.log('🧠 Feedback Learning Example');
    console.log('=============================\n');

    const system = new BinaryRingNeuralSystem({
        enableAPI: false,
        enableAutoUpdate: false
    });

    await system.initialize();

    const project1 = 'buddhabrot';
    const project2 = 'deep.lorenz';

    // Get initial similarity
    const initialSimilarity = system.connectionEngine.getSimilarity(project1, project2);
    console.log(`Initial similarity between "${project1}" and "${project2}": ${(initialSimilarity * 100).toFixed(1)}%`);

    // Simulate user feedback - they find these very relevant
    system.addFeedback(project1, project2, 'very_relevant');

    // Get updated similarity
    const updatedSimilarity = system.connectionEngine.getSimilarity(project1, project2);
    console.log(`Updated similarity after positive feedback: ${(updatedSimilarity * 100).toFixed(1)}%`);

    // Show the change
    const change = ((updatedSimilarity - initialSimilarity) * 100).toFixed(1);
    console.log(`Change: ${change > 0 ? '+' : ''}${change}%\n`);

    // Now simulate negative feedback for different projects
    const project3 = 'happy.place';
    const project4 = 'substrate';

    const initialSim2 = system.connectionEngine.getSimilarity(project3, project4);
    console.log(`Initial similarity between "${project3}" and "${project4}": ${(initialSim2 * 100).toFixed(1)}%`);

    system.addFeedback(project3, project4, 'not_relevant');

    const updatedSim2 = system.connectionEngine.getSimilarity(project3, project4);
    console.log(`Updated similarity after negative feedback: ${(updatedSim2 * 100).toFixed(1)}%`);

    const change2 = ((updatedSim2 - initialSim2) * 100).toFixed(1);
    console.log(`Change: ${change2 > 0 ? '+' : ''}${change2}%`);

    await system.shutdown();
}

/**
 * Export and visualization example
 */
async function exportExample() {
    console.log('📤 Export Example');
    console.log('=================\n');

    const system = new BinaryRingNeuralSystem({
        enableAPI: false,
        enableAutoUpdate: false
    });

    await system.initialize();

    // Export in different formats
    const formats = ['json', 'graphml', 'dot', 'csv'];

    for (const format of formats) {
        console.log(`Exporting in ${format.toUpperCase()} format...`);

        try {
            const graph = system.exportGraph(format);
            const filename = `binary-ring-connections-example.${format}`;

            if (format === 'json') {
                await fs.writeFile(filename, JSON.stringify(graph, null, 2));
                console.log(`- Nodes: ${graph.nodes.length}`);
                console.log(`- Edges: ${graph.edges.length}`);
            } else {
                await fs.writeFile(filename, graph);
            }

            console.log(`✅ Saved to: ${filename}\n`);

        } catch (error) {
            console.error(`❌ Failed to export ${format}: ${error.message}\n`);
        }
    }

    await system.shutdown();
}

/**
 * Similarity comparison example
 */
async function similarityComparisonExample() {
    console.log('🔍 Similarity Comparison Example');
    console.log('=================================\n');

    const system = new BinaryRingNeuralSystem({
        enableAPI: false,
        enableAutoUpdate: false
    });

    await system.initialize();

    // Compare different project pairs
    const comparisons = [
        ['buddhabrot', 'deep.lorenz'],      // Both mathematical/attractors
        ['node.garden', 'orbitals'],       // Both interactive particles
        ['substrate', 'happy.place'],      // Organic vs emotional
        ['buddhabrot', 'happy.place']      // Very different categories
    ];

    console.log('Project Similarity Analysis:');
    console.log('============================\n');

    for (const [id1, id2] of comparisons) {
        const similarity = system.connectionEngine.calculateProjectSimilarity(id1, id2);
        const explanation = system.connectionEngine.explainConnection(id1, id2);

        const project1 = system.connectionEngine.projects.find(p => p.id === id1);
        const project2 = system.connectionEngine.projects.find(p => p.id === id2);

        console.log(`"${project1?.title}" ↔ "${project2?.title}"`);
        console.log(`Categories: ${project1?.category} ↔ ${project2?.category}`);
        console.log(`Similarity: ${(similarity * 100).toFixed(1)}%`);
        console.log(`Strength: ${similarity > 0.7 ? '🔴 Strong' : similarity > 0.4 ? '🟡 Moderate' : '🟢 Weak'}`);
        console.log(`Reason: ${explanation}\n`);
    }

    await system.shutdown();
}

/**
 * Feature analysis example
 */
async function featureAnalysisExample() {
    console.log('🔬 Feature Analysis Example');
    console.log('============================\n');

    const system = new BinaryRingNeuralSystem({
        enableAPI: false,
        enableAutoUpdate: false
    });

    await system.initialize();

    // Analyze features for specific projects
    const projectsToAnalyze = ['buddhabrot', 'node.garden', 'happy.place', 'substrate'];

    for (const projectId of projectsToAnalyze) {
        const project = system.connectionEngine.projects.find(p => p.id === projectId);
        const preprocessed = system.connectionEngine.preprocessedProjects.find(p => p.id === projectId);

        if (!project || !preprocessed) continue;

        console.log(`📊 ${project.title} (${project.category})`);
        console.log('─'.repeat(40));

        // Mathematical features
        const mathFeatures = Object.entries(preprocessed.mathematical)
            .filter(([k, v]) => typeof v === 'boolean' && v)
            .map(([k]) => k);

        console.log(`Mathematical: ${mathFeatures.join(', ') || 'None detected'}`);
        console.log(`Complexity: ${(preprocessed.complexity * 100).toFixed(1)}%`);

        // Key scores
        console.log(`Chaos Level: ${(preprocessed.mathematical.chaosLevel * 100).toFixed(1)}%`);
        console.log(`Organic Score: ${(preprocessed.visual.organicScore * 100).toFixed(1)}%`);
        console.log(`Engagement: ${(preprocessed.interaction.engagementLevel * 100).toFixed(1)}%`);
        console.log(`Contemplative: ${(preprocessed.interaction.contemplativeScore * 100).toFixed(1)}%`);

        console.log(`Tags: ${preprocessed.tags.join(', ')}\n`);
    }

    await system.shutdown();
}

/**
 * Real-time update simulation
 */
async function realTimeUpdateExample() {
    console.log('⚡ Real-time Update Example');
    console.log('===========================\n');

    const system = new BinaryRingNeuralSystem({
        enableAPI: false,
        enableAutoUpdate: false
    });

    await system.initialize();

    console.log('Simulating real-time learning...\n');

    // Simulate multiple user interactions
    const interactions = [
        ['buddhabrot', 'deep.lorenz', 'very_relevant'],
        ['node.garden', 'orbitals', 'relevant'],
        ['substrate', 'happy.place', 'not_relevant'],
        ['buddhabrot', 'happy.place', 'not_relevant'],
        ['deep.lorenz', 'henon.phase.deep', 'very_relevant']
    ];

    for (const [id1, id2, feedback] of interactions) {
        const beforeSim = system.connectionEngine.getSimilarity(id1, id2);

        system.addFeedback(id1, id2, feedback);

        const afterSim = system.connectionEngine.getSimilarity(id1, id2);
        const change = ((afterSim - beforeSim) * 100).toFixed(1);

        console.log(`Feedback: "${id1}" ↔ "${id2}" → ${feedback}`);
        console.log(`Similarity: ${(beforeSim * 100).toFixed(1)}% → ${(afterSim * 100).toFixed(1)}% (${change > 0 ? '+' : ''}${change}%)\n`);
    }

    console.log('Learning complete! The system has adapted to user preferences.');

    await system.shutdown();
}

/**
 * Run all examples
 */
async function runAllExamples() {
    const examples = [
        { name: 'Basic Usage', fn: basicUsageExample },
        { name: 'Analytics', fn: analyticsExample },
        { name: 'Dynamic Collections', fn: collectionsExample },
        { name: 'Feedback Learning', fn: feedbackLearningExample },
        { name: 'Export', fn: exportExample },
        { name: 'Similarity Comparison', fn: similarityComparisonExample },
        { name: 'Feature Analysis', fn: featureAnalysisExample },
        { name: 'Real-time Updates', fn: realTimeUpdateExample }
    ];

    console.log('🚀 Binary Ring Neural Connection Engine - Examples\n');

    for (const example of examples) {
        try {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`Running: ${example.name}`);
            console.log(`${'='.repeat(60)}\n`);

            await example.fn();

            console.log(`✅ ${example.name} completed successfully\n`);

        } catch (error) {
            console.error(`❌ ${example.name} failed:`, error.message);
        }

        // Add delay between examples
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('🎉 All examples completed!');
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);
    const exampleName = args[0];

    const examples = {
        'basic': basicUsageExample,
        'analytics': analyticsExample,
        'collections': collectionsExample,
        'feedback': feedbackLearningExample,
        'export': exportExample,
        'similarity': similarityComparisonExample,
        'features': featureAnalysisExample,
        'realtime': realTimeUpdateExample,
        'all': runAllExamples
    };

    if (exampleName && examples[exampleName]) {
        await examples[exampleName]();
    } else if (exampleName) {
        console.error(`❌ Unknown example: ${exampleName}`);
        console.log('Available examples:', Object.keys(examples).join(', '));
    } else {
        // Run all examples by default
        await runAllExamples();
    }
}

// Run if this is the main module
if (process.argv[1].endsWith('example.js')) {
    main().catch(error => {
        console.error('❌ Example failed:', error);
        process.exit(1);
    });
}

export {
    basicUsageExample,
    analyticsExample,
    collectionsExample,
    feedbackLearningExample,
    exportExample,
    similarityComparisonExample,
    featureAnalysisExample,
    realTimeUpdateExample,
    runAllExamples
};