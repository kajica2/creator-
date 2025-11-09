/**
 * Website Manager for Binary Ring Projects
 * Handles creation, storage, and management of generated websites in Supabase
 */

import { createClient } from '@supabase/supabase-js'

class WebsiteManager {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL || 'your-supabase-url',
            process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key'
        )
    }

    /**
     * Create a new website entry in the database
     */
    async createWebsite({
        projectName,
        title,
        description,
        htmlContent,
        cssContent = '',
        jsContent = '',
        templateUsed = 'default',
        generationParams = {},
        isPublished = false
    }) {
        try {
            // Get project ID
            const { data: project, error: projectError } = await this.supabase
                .from('projects')
                .select('id')
                .eq('name', projectName)
                .single()

            if (projectError) throw new Error(`Project not found: ${projectName}`)

            // Generate unique slug
            const { data: slugData, error: slugError } = await this.supabase
                .rpc('generate_unique_slug', { base_text: title })

            if (slugError) throw new Error(`Failed to generate slug: ${slugError.message}`)

            // Insert website
            const { data: website, error: websiteError } = await this.supabase
                .from('websites')
                .insert({
                    project_id: project.id,
                    title,
                    description,
                    html_content: htmlContent,
                    css_content: cssContent,
                    js_content: jsContent,
                    template_used: templateUsed,
                    generation_params: generationParams,
                    is_published: isPublished,
                    slug: slugData
                })
                .select()
                .single()

            if (websiteError) throw new Error(`Failed to create website: ${websiteError.message}`)

            return {
                success: true,
                website,
                url: `https://binaryring.art/${website.slug}`
            }
        } catch (error) {
            console.error('Error creating website:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Upload media file (audio, video, image) for a project
     */
    async uploadMediaFile({
        projectName,
        websiteId = null,
        file,
        fileType, // 'audio', 'video', 'image'
        filename = null,
        metadata = {}
    }) {
        try {
            // Get project ID
            const { data: project, error: projectError } = await this.supabase
                .from('projects')
                .select('id')
                .eq('name', projectName)
                .single()

            if (projectError) throw new Error(`Project not found: ${projectName}`)

            // Generate filename if not provided
            const finalFilename = filename || `${projectName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            const filePath = `${projectName}/${fileType}/${finalFilename}`

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('binary-ring-media')
                .upload(filePath, file)

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

            // Get public URL
            const { data: urlData } = this.supabase.storage
                .from('binary-ring-media')
                .getPublicUrl(filePath)

            // Insert media file record
            const { data: mediaFile, error: mediaError } = await this.supabase
                .from('media_files')
                .insert({
                    project_id: project.id,
                    website_id: websiteId,
                    filename: finalFilename,
                    original_filename: file.name || finalFilename,
                    file_type: fileType,
                    mime_type: file.type,
                    file_size: file.size,
                    file_path: filePath,
                    storage_url: urlData.publicUrl,
                    metadata
                })
                .select()
                .single()

            if (mediaError) throw new Error(`Failed to record media file: ${mediaError.message}`)

            return {
                success: true,
                mediaFile,
                url: urlData.publicUrl
            }
        } catch (error) {
            console.error('Error uploading media file:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Get all websites for a project
     */
    async getProjectWebsites(projectName) {
        try {
            const { data, error } = await this.supabase
                .from('websites')
                .select(`
                    *,
                    projects!inner(name),
                    media_files(*)
                `)
                .eq('projects.name', projectName)
                .eq('is_published', true)
                .order('created_at', { ascending: false })

            if (error) throw new Error(`Failed to fetch websites: ${error.message}`)

            return {
                success: true,
                websites: data
            }
        } catch (error) {
            console.error('Error fetching project websites:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Update project metadata
     */
    async updateProject(projectName, updates) {
        try {
            const { data, error } = await this.supabase
                .from('projects')
                .update(updates)
                .eq('name', projectName)
                .select()
                .single()

            if (error) throw new Error(`Failed to update project: ${error.message}`)

            return {
                success: true,
                project: data
            }
        } catch (error) {
            console.error('Error updating project:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Get featured gallery
     */
    async getFeaturedGallery() {
        try {
            const { data, error } = await this.supabase
                .from('gallery_items')
                .select(`
                    *,
                    galleries!inner(name, description),
                    projects(*)
                `)
                .eq('galleries.is_featured', true)
                .order('sort_order', { ascending: true })

            if (error) throw new Error(`Failed to fetch gallery: ${error.message}`)

            return {
                success: true,
                items: data
            }
        } catch (error) {
            console.error('Error fetching gallery:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Track website analytics
     */
    async trackVisit({
        websiteSlug,
        visitorId,
        pagePath,
        referrer = null,
        userAgent = null,
        ipAddress = null,
        country = null,
        sessionDuration = null
    }) {
        try {
            // Get website ID from slug
            const { data: website, error: websiteError } = await this.supabase
                .from('websites')
                .select('id')
                .eq('slug', websiteSlug)
                .single()

            if (websiteError) throw new Error(`Website not found: ${websiteSlug}`)

            // Insert analytics record
            const { data, error } = await this.supabase
                .from('website_analytics')
                .insert({
                    website_id: website.id,
                    visitor_id: visitorId,
                    page_path: pagePath,
                    referrer,
                    user_agent: userAgent,
                    ip_address: ipAddress,
                    country,
                    session_duration: sessionDuration
                })

            if (error) throw new Error(`Failed to track visit: ${error.message}`)

            return {
                success: true,
                data
            }
        } catch (error) {
            console.error('Error tracking visit:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Save parameter preset
     */
    async saveParameterPreset({
        projectName,
        presetName,
        description,
        parameters,
        isDefault = false,
        createdBy = 'anonymous'
    }) {
        try {
            // Get project ID
            const { data: project, error: projectError } = await this.supabase
                .from('projects')
                .select('id')
                .eq('name', projectName)
                .single()

            if (projectError) throw new Error(`Project not found: ${projectName}`)

            // If setting as default, unset other defaults first
            if (isDefault) {
                await this.supabase
                    .from('parameter_presets')
                    .update({ is_default: false })
                    .eq('project_id', project.id)
            }

            // Insert preset
            const { data, error } = await this.supabase
                .from('parameter_presets')
                .insert({
                    project_id: project.id,
                    name: presetName,
                    description,
                    parameters,
                    is_default: isDefault,
                    created_by: createdBy
                })
                .select()
                .single()

            if (error) throw new Error(`Failed to save preset: ${error.message}`)

            return {
                success: true,
                preset: data
            }
        } catch (error) {
            console.error('Error saving parameter preset:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Generate website template with project data
     */
    generateWebsiteTemplate(project, template = 'default') {
        const templates = {
            default: this.getDefaultTemplate(project),
            minimal: this.getMinimalTemplate(project),
            interactive: this.getInteractiveTemplate(project),
            gallery: this.getGalleryTemplate(project)
        }

        return templates[template] || templates.default
    }

    getDefaultTemplate(project) {
        return {
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.display_name} - Binary Ring</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            color: #fff;
            font-family: 'Courier New', monospace;
            overflow: hidden;
        }
        #canvas {
            display: block;
            cursor: crosshair;
        }
        .controls {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border: 1px solid #fff;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <div class="controls">
        <h3>${project.display_name}</h3>
        <p>${project.description}</p>
    </div>
    <script src="src/main.js"></script>
</body>
</html>
            `,
            css: `/* Project-specific styles for ${project.name} */`,
            js: `/* Project-specific JavaScript for ${project.name} */`
        }
    }

    getMinimalTemplate(project) {
        return {
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${project.display_name}</title>
    <style>
        body { margin: 0; background: #000; }
        canvas { display: block; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <script src="src/main.js"></script>
</body>
</html>
            `,
            css: '',
            js: ''
        }
    }

    getInteractiveTemplate(project) {
        return {
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.display_name} - Interactive</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #111;
            color: #fff;
            font-family: 'Courier New', monospace;
        }
        #canvas {
            display: block;
            cursor: crosshair;
        }
        .ui-panel {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border: 1px solid #333;
            border-radius: 8px;
            max-width: 300px;
        }
        input[type="range"] {
            width: 100%;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <div class="ui-panel">
        <h3>${project.display_name}</h3>
        <p>${project.description}</p>
        <div id="controls"></div>
    </div>
    <script src="src/main.js"></script>
</body>
</html>
            `,
            css: `/* Interactive styles for ${project.name} */`,
            js: `/* Interactive controls for ${project.name} */`
        }
    }
}

// Export for Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebsiteManager
} else {
    window.WebsiteManager = WebsiteManager
}