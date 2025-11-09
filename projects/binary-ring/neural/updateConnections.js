/**
 * Neural Connection Update Script
 * Processes new projects and updates connection matrices
 */

import { BinaryRingConnectionEngine } from './connectionEngine.js';

// Load catalog data
async function loadCatalogData() {
    try {
        const appsResponse = await fetch('../apps/catalog.json');
        const appsData = await appsResponse.json();

        // Load existing projects data if available
        let experiencesData = { experiences: [], collections: [] };
        try {
            const experiencesResponse = await fetch('../catalog.json');
            experiencesData = await experiencesResponse.json();
        } catch (e) {
            console.log('No existing catalog found, starting fresh');
        }

        // Merge all data sources
        const fullCatalog = {
            apps: appsData.apps || [],
            experiments: appsData.experiments || [],
            experiences: experiencesData.experiences || [],
            collections: experiencesData.collections || [],
            categories: {
                ...appsData.categories,
                ...experiencesData.categories
            },
            stats: {
                totalApps: appsData.stats.totalApps,
                totalExperiments: appsData.stats.totalExperiments,
                totalExperiences: experiencesData.experiences?.length || 0,
                totalProjects: (appsData.stats.totalApps || 0) + (appsData.stats.totalExperiments || 0) + (experiencesData.experiences?.length || 0),
                lastUpdated: new Date().toISOString().split('T')[0]
            }
        };

        return fullCatalog;
    } catch (error) {
        console.error('Error loading catalog data:', error);
        return null;
    }
}

// Update neural connections for new content
async function updateNeuralConnections() {
    console.log('🧠 Updating neural connections for Binary Ring projects...');

    const catalog = await loadCatalogData();
    if (!catalog) {
        console.error('❌ Failed to load catalog data');
        return;
    }

    const engine = new BinaryRingConnectionEngine(catalog);

    console.log(`📊 Processing ${engine.projects.length} projects...`);

    // Initialize and train the model
    await engine.initializeModel();

    // Analyze new projects
    const newProjects = engine.projects.filter(project =>
        project.dateAdded === new Date().toISOString().split('T')[0]
    );

    console.log(`🆕 Found ${newProjects.length} new projects added today:`);
    newProjects.forEach(project => {
        console.log(`  - ${project.name} (${project.category})`);
    });

    // Generate connections for all projects
    const connections = await engine.generateConnections();

    // Create similarity clusters
    const clusters = engine.createSimilarityClusters(engine.projects, connections);

    console.log(`🔗 Generated ${connections.length} connections across ${clusters.length} clusters`);

    // Update recommendations
    const recommendations = {};
    for (const project of engine.projects) {
        const related = engine.findRelatedProjects(project.id, 5);
        recommendations[project.id] = related.map(r => ({
            id: r.project.id,
            name: r.project.name,
            score: r.similarity,
            reason: r.connectionType
        }));
    }

    // Save updated connections
    const connectionData = {
        lastUpdated: new Date().toISOString(),
        totalProjects: engine.projects.length,
        totalConnections: connections.length,
        clusters: clusters.map(cluster => ({
            id: cluster.id,
            theme: cluster.theme,
            projects: cluster.projects.map(p => p.id),
            averageSimilarity: cluster.averageSimilarity
        })),
        recommendations,
        metadata: {
            algorithm: 'TensorFlow.js + Cosine Similarity',
            featureVectorSize: engine.config.featureVectorSize,
            similarityThreshold: engine.config.minSimilarityThreshold
        }
    };

    // Output connection data (in a real implementation, this would save to a file)
    console.log('💾 Connection data generated:');
    console.log(JSON.stringify(connectionData, null, 2));

    return connectionData;
}

// Generate project insights
function generateProjectInsights(catalog, connections) {
    const insights = {
        trending: {
            categories: {},
            tags: {},
            technologies: {}
        },
        emerging: {
            patterns: [],
            crossConnections: []
        },
        recommendations: {
            forDevelopers: [],
            forUsers: []
        }
    };

    // Analyze category trends
    catalog.apps?.forEach(app => {
        if (!insights.trending.categories[app.category]) {
            insights.trending.categories[app.category] = 0;
        }
        insights.trending.categories[app.category]++;

        // Analyze tags
        app.tags?.forEach(tag => {
            if (!insights.trending.tags[tag]) {
                insights.trending.tags[tag] = 0;
            }
            insights.trending.tags[tag]++;
        });

        // Analyze technologies
        app.tech?.forEach(tech => {
            if (!insights.trending.technologies[tech]) {
                insights.trending.technologies[tech] = 0;
            }
            insights.trending.technologies[tech]++;
        });
    });

    // Identify emerging patterns
    const crossCategoryConnections = connections.connections?.filter(conn =>
        conn.project1.category !== conn.project2.category
    ) || [];

    insights.emerging.crossConnections = crossCategoryConnections.map(conn => ({
        categories: [conn.project1.category, conn.project2.category],
        projects: [conn.project1.name, conn.project2.name],
        strength: conn.similarity,
        reason: conn.connectionType
    }));

    // Generate recommendations
    insights.recommendations.forDevelopers = [
        "Consider building bridges between AI Tools and Wellness applications",
        "Explore cross-platform integration opportunities",
        "Investigate WebGL potential for visualization projects"
    ];

    insights.recommendations.forUsers = [
        "Try combining mindfulness apps with visualization tools",
        "Explore the connection between music generation and AI tools",
        "Experiment with cross-platform content creation workflows"
    ];

    return insights;
}

// Main execution
if (typeof window === 'undefined') {
    // Node.js environment
    updateNeuralConnections()
        .then(connectionData => {
            console.log('✅ Neural connections updated successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error updating neural connections:', error);
            process.exit(1);
        });
} else {
    // Browser environment
    window.updateNeuralConnections = updateNeuralConnections;
    window.generateProjectInsights = generateProjectInsights;
}

export { updateNeuralConnections, generateProjectInsights };