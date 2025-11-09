/**
 * Binary Ring Content Management System
 * Utility functions for managing text content in Supabase
 */

import { createClient } from '@supabase/supabase-js';

export class ContentManager {
    constructor(supabaseUrl, supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    // =====================================================
    // CONTENT RETRIEVAL
    // =====================================================

    /**
     * Get all content for a project
     */
    async getProjectContent(projectId, language = 'en') {
        try {
            const { data, error } = await this.supabase
                .from('project_content_summary')
                .select('*')
                .eq('project_id', projectId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching project content:', error);
            return null;
        }
    }

    /**
     * Get specific content by key with fallback
     */
    async getContent(projectId, contentKey, language = 'en') {
        try {
            const { data, error } = await this.supabase
                .rpc('get_content_with_fallback', {
                    p_project_id: projectId,
                    p_key: contentKey,
                    p_language: language
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching content:', error);
            return null;
        }
    }

    /**
     * Get all projects with their basic content
     */
    async getAllProjectsWithContent() {
        try {
            const { data, error } = await this.supabase
                .from('project_content_summary')
                .select('*')
                .order('project_name');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching projects with content:', error);
            return [];
        }
    }

    // =====================================================
    // CONTENT CREATION & UPDATES
    // =====================================================

    /**
     * Create or update content
     */
    async setContent(projectId, contentKey, value, language = 'en', metadata = {}) {
        try {
            const { data, error } = await this.supabase
                .from('text_content')
                .upsert({
                    project_id: projectId,
                    key: contentKey,
                    value: value,
                    language_code: language,
                    metadata: metadata,
                    is_published: true
                }, {
                    onConflict: 'project_id,key,version'
                });

            if (error) throw error;

            // Refresh materialized view
            await this.refreshContentSummary();

            return data;
        } catch (error) {
            console.error('Error setting content:', error);
            throw error;
        }
    }

    /**
     * Bulk import content from JSON
     */
    async importProjectContent(projectId, contentObject, language = 'en') {
        try {
            const { data, error } = await this.supabase
                .rpc('import_project_content', {
                    p_project_id: projectId,
                    p_content: contentObject,
                    p_language: language
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error importing content:', error);
            throw error;
        }
    }

    /**
     * Create new project with content
     */
    async createProjectWithContent(projectData, contentData) {
        try {
            // Create project first
            const { data: project, error: projectError } = await this.supabase
                .from('projects')
                .insert(projectData)
                .select()
                .single();

            if (projectError) throw projectError;

            // Import content
            await this.importProjectContent(project.id, contentData);

            return project;
        } catch (error) {
            console.error('Error creating project with content:', error);
            throw error;
        }
    }

    // =====================================================
    // SEARCH FUNCTIONALITY
    // =====================================================

    /**
     * Full-text search across all content
     */
    async searchContent(query, options = {}) {
        const {
            projectFilter = null,
            contentTypeFilter = null,
            language = 'en',
            limit = 20
        } = options;

        try {
            const { data, error } = await this.supabase
                .rpc('search_content', {
                    search_query: query,
                    project_filter: projectFilter,
                    content_type_filter: contentTypeFilter,
                    language_filter: language
                })
                .limit(limit);

            if (error) throw error;

            // Log search for analytics
            await this.logSearch(query, 'full_text', data?.length || 0);

            return data;
        } catch (error) {
            console.error('Error searching content:', error);
            return [];
        }
    }

    /**
     * Fuzzy search for approximate matching
     */
    async fuzzySearch(query, threshold = 0.3, limit = 20) {
        try {
            const { data, error } = await this.supabase
                .rpc('fuzzy_search_content', {
                    search_query: query,
                    similarity_threshold: threshold
                })
                .limit(limit);

            if (error) throw error;

            // Log search for analytics
            await this.logSearch(query, 'fuzzy', data?.length || 0);

            return data;
        } catch (error) {
            console.error('Error performing fuzzy search:', error);
            return [];
        }
    }

    /**
     * Search projects by category or tags
     */
    async searchProjects(filters = {}) {
        try {
            let query = this.supabase
                .from('project_content_summary')
                .select('*');

            if (filters.category) {
                query = query.eq('category', filters.category);
            }

            if (filters.isNew !== undefined) {
                query = query.eq('is_new', filters.isNew);
            }

            if (filters.search) {
                query = query.textSearch('search_vector', filters.search);
            }

            const { data, error } = await query.order('project_name');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error searching projects:', error);
            return [];
        }
    }

    // =====================================================
    // CONTENT VERSIONING
    // =====================================================

    /**
     * Get content version history
     */
    async getContentVersions(contentId) {
        try {
            const { data, error } = await this.supabase
                .from('content_versions')
                .select(`
                    *,
                    text_content!inner(key, project_id)
                `)
                .eq('content_id', contentId)
                .order('version_number', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching content versions:', error);
            return [];
        }
    }

    /**
     * Restore content to previous version
     */
    async restoreContentVersion(contentId, versionNumber) {
        try {
            // Get the version data
            const { data: version, error: versionError } = await this.supabase
                .from('content_versions')
                .select('new_value')
                .eq('content_id', contentId)
                .eq('version_number', versionNumber)
                .single();

            if (versionError) throw versionError;

            // Update current content
            const { data, error } = await this.supabase
                .from('text_content')
                .update({
                    value: version.new_value,
                    updated_at: new Date().toISOString()
                })
                .eq('id', contentId);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error restoring content version:', error);
            throw error;
        }
    }

    // =====================================================
    // COLLECTIONS MANAGEMENT
    // =====================================================

    /**
     * Get all collections with projects
     */
    async getCollections(includeFeatured = true) {
        try {
            let query = this.supabase
                .from('project_collections')
                .select(`
                    *,
                    project_collection_items(
                        display_order,
                        projects(
                            id,
                            name,
                            display_name,
                            category,
                            is_new
                        )
                    )
                `)
                .order('display_order');

            if (includeFeatured) {
                query = query.eq('featured', true);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching collections:', error);
            return [];
        }
    }

    /**
     * Add project to collection
     */
    async addProjectToCollection(collectionId, projectId, displayOrder = 0) {
        try {
            const { data, error } = await this.supabase
                .from('project_collection_items')
                .insert({
                    collection_id: collectionId,
                    project_id: projectId,
                    display_order: displayOrder
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding project to collection:', error);
            throw error;
        }
    }

    // =====================================================
    // TECHNICAL DETAILS
    // =====================================================

    /**
     * Get technical details for a project
     */
    async getTechnicalDetails(projectId) {
        try {
            const { data, error } = await this.supabase
                .from('technical_details')
                .select('*')
                .eq('project_id', projectId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching technical details:', error);
            return null;
        }
    }

    /**
     * Update technical details
     */
    async updateTechnicalDetails(projectId, details) {
        try {
            const { data, error } = await this.supabase
                .from('technical_details')
                .upsert({
                    project_id: projectId,
                    ...details,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'project_id'
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating technical details:', error);
            throw error;
        }
    }

    // =====================================================
    // ARTIST INFORMATION
    // =====================================================

    /**
     * Get artist profile
     */
    async getArtistProfile() {
        try {
            const { data, error } = await this.supabase
                .from('artist_profiles')
                .select('*')
                .limit(1)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching artist profile:', error);
            return null;
        }
    }

    /**
     * Update artist profile
     */
    async updateArtistProfile(profileData) {
        try {
            const { data, error } = await this.supabase
                .from('artist_profiles')
                .upsert({
                    ...profileData,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating artist profile:', error);
            throw error;
        }
    }

    // =====================================================
    // ANALYTICS & UTILITIES
    // =====================================================

    /**
     * Log search for analytics
     */
    async logSearch(query, searchType, resultsCount, userSession = null) {
        try {
            await this.supabase
                .from('search_analytics')
                .insert({
                    search_query: query,
                    search_type: searchType,
                    results_count: resultsCount,
                    user_session: userSession
                });
        } catch (error) {
            // Don't throw on analytics errors
            console.warn('Failed to log search:', error);
        }
    }

    /**
     * Get content analytics
     */
    async getContentAnalytics() {
        try {
            const { data, error } = await this.supabase
                .from('content_analytics')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching content analytics:', error);
            return [];
        }
    }

    /**
     * Refresh materialized view
     */
    async refreshContentSummary() {
        try {
            const { error } = await this.supabase
                .rpc('refresh_project_content_summary');

            if (error) throw error;
        } catch (error) {
            console.warn('Failed to refresh content summary:', error);
        }
    }

    /**
     * Export all content for backup
     */
    async exportAllContent() {
        try {
            const projects = await this.getAllProjectsWithContent();
            const collections = await this.getCollections(false);
            const artistProfile = await this.getArtistProfile();

            return {
                projects,
                collections,
                artistProfile,
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };
        } catch (error) {
            console.error('Error exporting content:', error);
            throw error;
        }
    }

    /**
     * Import content from backup
     */
    async importFromBackup(backupData) {
        try {
            const { projects, collections, artistProfile } = backupData;

            // Import projects and content
            for (const project of projects) {
                await this.createProjectWithContent(
                    {
                        name: project.project_name,
                        display_name: project.display_name,
                        category: project.category,
                        is_new: project.is_new
                    },
                    project.content
                );
            }

            // Import collections
            for (const collection of collections) {
                const { data: newCollection } = await this.supabase
                    .from('project_collections')
                    .insert(collection)
                    .select()
                    .single();

                // Add collection items
                for (const item of collection.project_collection_items) {
                    await this.addProjectToCollection(
                        newCollection.id,
                        item.project_id,
                        item.display_order
                    );
                }
            }

            // Import artist profile
            if (artistProfile) {
                await this.updateArtistProfile(artistProfile);
            }

            await this.refreshContentSummary();
            return true;
        } catch (error) {
            console.error('Error importing backup:', error);
            throw error;
        }
    }
}

// Usage example:
/*
const contentManager = new ContentManager(
    'your-supabase-url',
    'your-supabase-anon-key'
);

// Get project content
const projectContent = await contentManager.getProjectContent('project-id');

// Search content
const searchResults = await contentManager.searchContent('fractal mandelbrot');

// Update content
await contentManager.setContent(
    'project-id',
    'description',
    'New description text'
);

// Import from JSON
await contentManager.importProjectContent('project-id', {
    title: 'New Project',
    description: 'Project description',
    longDescription: 'Detailed description...'
});
*/

export default ContentManager;