/**
 * Content Data Migration Script
 * Migrates content from JSON files to Supabase database
 */

import fs from 'fs/promises';
import path from 'path';
import ContentManager from './content-manager.js';

class ContentMigrator {
    constructor(supabaseUrl, supabaseKey) {
        this.contentManager = new ContentManager(supabaseUrl, supabaseKey);
        this.migrationStats = {
            projectsProcessed: 0,
            contentItemsCreated: 0,
            technicalDetailsCreated: 0,
            collectionsCreated: 0,
            errors: []
        };
    }

    /**
     * Load JSON data from files
     */
    async loadSourceData() {
        try {
            // Load artist catalog
            const catalogPath = '../catalog/artist-catalog.json';
            const catalogContent = await fs.readFile(catalogPath, 'utf-8');
            const catalogData = JSON.parse(catalogContent);

            // Load projects data
            const projectsPath = '../community/scripts/projects-data.js';
            const projectsContent = await fs.readFile(projectsPath, 'utf-8');

            // Extract the PROJECTS_DATABASE object (simple approach)
            const projectsMatch = projectsContent.match(/const PROJECTS_DATABASE\s*=\s*({[\s\S]*?});/);
            if (!projectsMatch) {
                throw new Error('Could not extract PROJECTS_DATABASE from projects-data.js');
            }

            // Evaluate the object (Note: In production, use a proper JS parser)
            const projectsData = eval(`(${projectsMatch[1]})`);

            return {
                catalog: catalogData,
                projects: projectsData
            };
        } catch (error) {
            console.error('Error loading source data:', error);
            throw error;
        }
    }

    /**
     * Migrate artist profile
     */
    async migrateArtistProfile(catalogData) {
        try {
            const artist = catalogData.artist;

            await this.contentManager.updateArtistProfile({
                collective_name: artist.collective,
                founded_year: parseInt(artist.founded),
                location: artist.location,
                philosophy: artist.philosophy,
                artistic_statement: artist.statement,
                medium: artist.medium,
                contact_info: artist.contact,
                influences: artist.influences,
                techniques: artist.techniques
            });

            console.log('✓ Artist profile migrated');
        } catch (error) {
            console.error('Error migrating artist profile:', error);
            this.migrationStats.errors.push('Artist profile migration failed');
        }
    }

    /**
     * Migrate project collections
     */
    async migrateCollections(catalogData, projectsData) {
        try {
            const collectionsToCreate = [];

            // From catalog collections
            if (catalogData.collections) {
                for (const collection of catalogData.collections) {
                    collectionsToCreate.push({
                        key: collection.id,
                        title: collection.title,
                        description: collection.description,
                        featured: collection.featured || false,
                        display_order: collectionsToCreate.length
                    });
                }
            }

            // From projects database collections
            if (projectsData.collections) {
                for (const [key, collection] of Object.entries(projectsData.collections)) {
                    if (!collectionsToCreate.find(c => c.key === key)) {
                        collectionsToCreate.push({
                            key: key,
                            title: collection.title,
                            description: collection.description,
                            featured: collection.featured || false,
                            display_order: collectionsToCreate.length
                        });
                    }
                }
            }

            // Create collections
            for (const collection of collectionsToCreate) {
                const { data, error } = await this.contentManager.supabase
                    .from('project_collections')
                    .upsert(collection, { onConflict: 'key' });

                if (error) {
                    console.error(`Error creating collection ${collection.key}:`, error);
                } else {
                    console.log(`✓ Collection "${collection.title}" migrated`);
                    this.migrationStats.collectionsCreated++;
                }
            }
        } catch (error) {
            console.error('Error migrating collections:', error);
            this.migrationStats.errors.push('Collections migration failed');
        }
    }

    /**
     * Migrate individual project content
     */
    async migrateProjectContent(project, source = 'catalog') {
        try {
            const projectId = await this.getOrCreateProject(project);
            if (!projectId) return;

            const contentToMigrate = {};

            // Basic content
            if (project.title) contentToMigrate.title = project.title;
            if (project.description) contentToMigrate.description = project.description;
            if (project.longDescription) contentToMigrate.long_description = project.longDescription;

            // Technical content from catalog
            if (project.technicalDetails) {
                contentToMigrate.technical_algorithm = project.technicalDetails.algorithm;
                contentToMigrate.technical_complexity = project.technicalDetails.complexity;
                contentToMigrate.technical_interactivity = project.technicalDetails.interactivity;
                contentToMigrate.technical_render_time = project.technicalDetails.renderTime;
            }

            // Experience content
            if (project.experience) {
                contentToMigrate.experience_duration = project.experience.duration;
                contentToMigrate.experience_interaction_level = project.experience.interactionLevel;
                contentToMigrate.experience_contemplative = project.experience.contemplative ? 'Yes' : 'No';
                contentToMigrate.experience_audio_reactive = project.experience.audioReactive ? 'Yes' : 'No';
            }

            // Parameters documentation
            if (project.parameters) {
                contentToMigrate.parameters_documentation = JSON.stringify(project.parameters, null, 2);
            }

            // Outputs documentation
            if (project.outputs) {
                contentToMigrate.outputs_documentation = JSON.stringify(project.outputs, null, 2);
            }

            // Import content
            await this.contentManager.importProjectContent(projectId, contentToMigrate);

            // Create technical details if available
            if (project.technicalDetails || project.algorithm || project.complexity) {
                await this.contentManager.updateTechnicalDetails(projectId, {
                    algorithm_description: project.technicalDetails?.algorithm || project.algorithm,
                    complexity_analysis: project.technicalDetails?.complexity || project.complexity,
                    performance_metrics: project.technicalDetails ? {
                        renderTime: project.technicalDetails.renderTime,
                        interactivity: project.technicalDetails.interactivity
                    } : {},
                    requirements: project.technicalDetails ? {
                        frameRate: project.technicalDetails.frameRate,
                        precision: project.technicalDetails.precision
                    } : {},
                    parameters: project.parameters || {},
                    outputs: project.outputs || {}
                });

                this.migrationStats.technicalDetailsCreated++;
            }

            console.log(`✓ Project "${project.title || project.name}" content migrated (${Object.keys(contentToMigrate).length} items)`);
            this.migrationStats.projectsProcessed++;
            this.migrationStats.contentItemsCreated += Object.keys(contentToMigrate).length;

        } catch (error) {
            console.error(`Error migrating project ${project.id || project.name}:`, error);
            this.migrationStats.errors.push(`Project ${project.id || project.name} migration failed`);
        }
    }

    /**
     * Get or create project in database
     */
    async getOrCreateProject(project) {
        try {
            const projectName = project.id || project.name;

            // Check if project exists
            const { data: existingProject } = await this.contentManager.supabase
                .from('projects')
                .select('id')
                .eq('name', projectName)
                .single();

            if (existingProject) {
                return existingProject.id;
            }

            // Create new project
            const { data: newProject, error } = await this.contentManager.supabase
                .from('projects')
                .insert({
                    name: projectName,
                    display_name: project.title || project.display_name || projectName,
                    description: project.description,
                    category: project.category,
                    is_new: project.isNew || project.is_new || false
                })
                .select('id')
                .single();

            if (error) {
                console.error(`Error creating project ${projectName}:`, error);
                return null;
            }

            return newProject.id;
        } catch (error) {
            console.error(`Error with project ${project.id || project.name}:`, error);
            return null;
        }
    }

    /**
     * Link projects to collections
     */
    async linkProjectsToCollections(catalogData, projectsData) {
        try {
            // Get all collections
            const { data: collections } = await this.contentManager.supabase
                .from('project_collections')
                .select('id, key');

            if (!collections) return;

            // Process catalog collections
            if (catalogData.collections) {
                for (const collection of catalogData.collections) {
                    const dbCollection = collections.find(c => c.key === collection.id);
                    if (!dbCollection) continue;

                    if (collection.projects) {
                        for (let i = 0; i < collection.projects.length; i++) {
                            const projectName = collection.projects[i];
                            const { data: project } = await this.contentManager.supabase
                                .from('projects')
                                .select('id')
                                .eq('name', projectName)
                                .single();

                            if (project) {
                                await this.contentManager.addProjectToCollection(
                                    dbCollection.id,
                                    project.id,
                                    i
                                );
                            }
                        }
                    }
                }
            }

            // Process projects database collections
            if (projectsData.collections) {
                for (const [collectionKey, collection] of Object.entries(projectsData.collections)) {
                    const dbCollection = collections.find(c => c.key === collectionKey);
                    if (!dbCollection) continue;

                    if (collection.projects) {
                        for (let i = 0; i < collection.projects.length; i++) {
                            const projectName = collection.projects[i];
                            const { data: project } = await this.contentManager.supabase
                                .from('projects')
                                .select('id')
                                .eq('name', projectName)
                                .single();

                            if (project) {
                                await this.contentManager.addProjectToCollection(
                                    dbCollection.id,
                                    project.id,
                                    i
                                );
                            }
                        }
                    }
                }
            }

            console.log('✓ Projects linked to collections');
        } catch (error) {
            console.error('Error linking projects to collections:', error);
            this.migrationStats.errors.push('Collection linking failed');
        }
    }

    /**
     * Run complete migration
     */
    async migrate() {
        console.log('Starting content migration...\n');

        try {
            // Load source data
            console.log('Loading source data...');
            const { catalog, projects } = await this.loadSourceData();

            // Migrate artist profile
            console.log('\nMigrating artist profile...');
            await this.migrateArtistProfile(catalog);

            // Migrate collections
            console.log('\nMigrating collections...');
            await this.migrateCollections(catalog, projects);

            // Migrate project content from catalog
            console.log('\nMigrating projects from catalog...');
            if (catalog.experiences) {
                for (const project of catalog.experiences) {
                    await this.migrateProjectContent(project, 'catalog');
                }
            }

            // Migrate project content from projects database
            console.log('\nMigrating projects from database...');
            if (projects.projects) {
                for (const project of projects.projects) {
                    await this.migrateProjectContent(project, 'projects');
                }
            }

            // Link projects to collections
            console.log('\nLinking projects to collections...');
            await this.linkProjectsToCollections(catalog, projects);

            // Refresh materialized view
            console.log('\nRefreshing content summary...');
            await this.contentManager.refreshContentSummary();

            // Print migration statistics
            this.printMigrationStats();

        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    }

    /**
     * Print migration statistics
     */
    printMigrationStats() {
        console.log('\n=== MIGRATION COMPLETE ===');
        console.log(`✓ Projects processed: ${this.migrationStats.projectsProcessed}`);
        console.log(`✓ Content items created: ${this.migrationStats.contentItemsCreated}`);
        console.log(`✓ Technical details created: ${this.migrationStats.technicalDetailsCreated}`);
        console.log(`✓ Collections created: ${this.migrationStats.collectionsCreated}`);

        if (this.migrationStats.errors.length > 0) {
            console.log(`\n⚠️  Errors encountered (${this.migrationStats.errors.length}):`);
            this.migrationStats.errors.forEach(error => console.log(`   - ${error}`));
        }

        console.log('\n=== MIGRATION STATISTICS ===');
        console.log('Run the following query to verify content:');
        console.log('SELECT COUNT(*) as total_content FROM text_content WHERE is_current = true;');
        console.log('SELECT project_name, COUNT(*) as content_count FROM content_analytics GROUP BY project_name;');
    }

    /**
     * Verify migration results
     */
    async verifyMigration() {
        try {
            const { data: contentCount } = await this.contentManager.supabase
                .from('text_content')
                .select('id', { count: 'exact' })
                .eq('is_current', true);

            const { data: projectCount } = await this.contentManager.supabase
                .from('projects')
                .select('id', { count: 'exact' });

            const analytics = await this.contentManager.getContentAnalytics();

            console.log('\n=== VERIFICATION RESULTS ===');
            console.log(`Total content items: ${contentCount.count || 0}`);
            console.log(`Total projects: ${projectCount.count || 0}`);
            console.log(`Projects with content: ${analytics.length}`);

            // Test search functionality
            const searchResults = await this.contentManager.searchContent('fractal');
            console.log(`Search test ("fractal"): ${searchResults.length} results`);

            return {
                contentItems: contentCount.count || 0,
                projects: projectCount.count || 0,
                projectsWithContent: analytics.length,
                searchResults: searchResults.length
            };
        } catch (error) {
            console.error('Error verifying migration:', error);
            return null;
        }
    }
}

// Export for use as module
export default ContentMigrator;

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
        process.exit(1);
    }

    const migrator = new ContentMigrator(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        await migrator.migrate();
        await migrator.verifyMigration();
        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}