-- Binary Ring Text Content Migration
-- Comprehensive migration to store all text content with versioning, search, and content management
-- Migration 005 - Text Content Management System

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- For accent-insensitive search

-- =====================================================
-- CONTENT STRUCTURE TABLES
-- =====================================================

-- Content Types - Define different types of text content
CREATE TABLE IF NOT EXISTS content_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    schema_definition JSONB, -- JSON schema for validation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects Enhanced - Add text content relationships
-- Note: This extends the existing projects table
ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS content_metadata JSONB DEFAULT '{}';
ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Text Content - Core content storage with versioning
CREATE TABLE IF NOT EXISTS text_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    content_type_id UUID REFERENCES content_types(id),
    key TEXT NOT NULL, -- Unique identifier within project (e.g., 'title', 'description', 'longDescription')
    value TEXT NOT NULL,
    language_code TEXT DEFAULT 'en',
    author_id UUID, -- For future user management
    parent_id UUID REFERENCES text_content(id), -- For content hierarchies
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, key, version)
);

-- Content Versions - Track all changes to content
CREATE TABLE IF NOT EXISTS content_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES text_content(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    previous_value TEXT,
    new_value TEXT NOT NULL,
    change_summary TEXT,
    changed_by UUID, -- Author of the change
    change_type TEXT DEFAULT 'update' CHECK (change_type IN ('create', 'update', 'delete', 'restore')),
    approved_by UUID, -- For content approval workflow
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, version_number)
);

-- Content Categories - Organize content by categories
CREATE TABLE IF NOT EXISTS content_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    parent_id UUID REFERENCES content_categories(id),
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Tags - Flexible tagging system
CREATE TABLE IF NOT EXISTS content_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT, -- For UI display
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Tag Relationships
CREATE TABLE IF NOT EXISTS content_tag_relations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES text_content(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES content_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, tag_id)
);

-- Technical Details - Store technical specifications
CREATE TABLE IF NOT EXISTS technical_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    algorithm_description TEXT,
    complexity_analysis TEXT,
    performance_metrics JSONB DEFAULT '{}',
    requirements JSONB DEFAULT '{}',
    parameters JSONB DEFAULT '{}',
    outputs JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Collections - Enhanced collections with descriptions
CREATE TABLE IF NOT EXISTS project_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE, -- e.g., 'new-releases', 'interactive'
    title TEXT NOT NULL,
    description TEXT,
    long_description TEXT,
    featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Collection Items
CREATE TABLE IF NOT EXISTS project_collection_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id UUID REFERENCES project_collections(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, project_id)
);

-- Artist Information - Store artist and collective data
CREATE TABLE IF NOT EXISTS artist_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collective_name TEXT,
    founded_year INTEGER,
    location TEXT,
    philosophy TEXT,
    artistic_statement TEXT,
    medium TEXT,
    contact_info JSONB DEFAULT '{}',
    influences TEXT[],
    techniques TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SEARCH AND INDEXING
-- =====================================================

-- Create search indexes
CREATE INDEX IF NOT EXISTS idx_text_content_project_id ON text_content(project_id);
CREATE INDEX IF NOT EXISTS idx_text_content_key ON text_content(key);
CREATE INDEX IF NOT EXISTS idx_text_content_current ON text_content(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_text_content_published ON text_content(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_text_content_language ON text_content(language_code);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_text_content_fts ON text_content USING gin(to_tsvector('english', value));
CREATE INDEX IF NOT EXISTS idx_projects_search_vector ON projects USING gin(search_vector);

-- Trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_text_content_trigram ON text_content USING gin(value gin_trgm_ops);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update search vectors
CREATE OR REPLACE FUNCTION update_project_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the project's search vector with all its text content
    UPDATE projects SET search_vector = (
        SELECT to_tsvector('english',
            COALESCE(string_agg(tc.value, ' '), '') || ' ' ||
            COALESCE(projects.display_name, '') || ' ' ||
            COALESCE(projects.description, '') || ' ' ||
            COALESCE(projects.category, '')
        )
        FROM text_content tc
        WHERE tc.project_id = NEW.project_id
        AND tc.is_current = true
        AND tc.is_published = true
    )
    WHERE id = NEW.project_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create new content version
CREATE OR REPLACE FUNCTION create_content_version()
RETURNS TRIGGER AS $$
DECLARE
    new_version INTEGER;
BEGIN
    -- Get the next version number
    SELECT COALESCE(MAX(version), 0) + 1
    INTO new_version
    FROM text_content
    WHERE project_id = NEW.project_id AND key = NEW.key;

    -- Set version and mark as current
    NEW.version = new_version;

    -- Mark previous versions as not current
    UPDATE text_content
    SET is_current = false
    WHERE project_id = NEW.project_id
    AND key = NEW.key
    AND id != NEW.id;

    -- Create version history record
    INSERT INTO content_versions (
        content_id,
        version_number,
        previous_value,
        new_value,
        change_type
    ) VALUES (
        NEW.id,
        new_version,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.value ELSE NULL END,
        NEW.value,
        CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for content search
CREATE OR REPLACE FUNCTION search_content(
    search_query TEXT,
    project_filter UUID DEFAULT NULL,
    content_type_filter UUID DEFAULT NULL,
    language_filter TEXT DEFAULT 'en'
)
RETURNS TABLE (
    content_id UUID,
    project_id UUID,
    project_name TEXT,
    content_key TEXT,
    content_value TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tc.id,
        tc.project_id,
        p.display_name,
        tc.key,
        tc.value,
        ts_rank(to_tsvector('english', tc.value), plainto_tsquery('english', search_query)) as rank
    FROM text_content tc
    JOIN projects p ON tc.project_id = p.id
    WHERE tc.is_current = true
    AND tc.is_published = true
    AND to_tsvector('english', tc.value) @@ plainto_tsquery('english', search_query)
    AND (project_filter IS NULL OR tc.project_id = project_filter)
    AND (content_type_filter IS NULL OR tc.content_type_id = content_type_filter)
    AND tc.language_code = language_filter
    ORDER BY rank DESC, tc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function for fuzzy content search
CREATE OR REPLACE FUNCTION fuzzy_search_content(
    search_query TEXT,
    similarity_threshold REAL DEFAULT 0.3
)
RETURNS TABLE (
    content_id UUID,
    project_id UUID,
    project_name TEXT,
    content_key TEXT,
    content_value TEXT,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tc.id,
        tc.project_id,
        p.display_name,
        tc.key,
        tc.value,
        similarity(tc.value, search_query) as sim
    FROM text_content tc
    JOIN projects p ON tc.project_id = p.id
    WHERE tc.is_current = true
    AND tc.is_published = true
    AND similarity(tc.value, search_query) > similarity_threshold
    ORDER BY sim DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get content with fallbacks
CREATE OR REPLACE FUNCTION get_content_with_fallback(
    p_project_id UUID,
    p_key TEXT,
    p_language TEXT DEFAULT 'en'
)
RETURNS TEXT AS $$
DECLARE
    content_value TEXT;
BEGIN
    -- Try to get content in requested language
    SELECT value INTO content_value
    FROM text_content
    WHERE project_id = p_project_id
    AND key = p_key
    AND language_code = p_language
    AND is_current = true
    AND is_published = true;

    -- If not found, try default language (English)
    IF content_value IS NULL AND p_language != 'en' THEN
        SELECT value INTO content_value
        FROM text_content
        WHERE project_id = p_project_id
        AND key = p_key
        AND language_code = 'en'
        AND is_current = true
        AND is_published = true;
    END IF;

    RETURN content_value;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_content_versioning
    BEFORE INSERT OR UPDATE ON text_content
    FOR EACH ROW EXECUTE FUNCTION create_content_version();

CREATE TRIGGER trigger_update_search_vector
    AFTER INSERT OR UPDATE OR DELETE ON text_content
    FOR EACH ROW EXECUTE FUNCTION update_project_search_vector();

-- =====================================================
-- SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE text_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tag_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Allow public read published content" ON text_content
    FOR SELECT USING (is_published = true);

CREATE POLICY "Allow public read content versions" ON content_versions
    FOR SELECT USING (true);

CREATE POLICY "Allow public read content types" ON content_types
    FOR SELECT USING (true);

CREATE POLICY "Allow public read active categories" ON content_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read tags" ON content_tags
    FOR SELECT USING (true);

CREATE POLICY "Allow public read tag relations" ON content_tag_relations
    FOR SELECT USING (true);

CREATE POLICY "Allow public read technical details" ON technical_details
    FOR SELECT USING (true);

CREATE POLICY "Allow public read collections" ON project_collections
    FOR SELECT USING (true);

CREATE POLICY "Allow public read collection items" ON project_collection_items
    FOR SELECT USING (true);

CREATE POLICY "Allow public read artist profiles" ON artist_profiles
    FOR SELECT USING (true);

-- =====================================================
-- SEED DATA MIGRATION
-- =====================================================

-- Insert content types
INSERT INTO content_types (name, description) VALUES
('title', 'Project title'),
('description', 'Short project description'),
('long_description', 'Detailed project description'),
('technical_algorithm', 'Algorithm description'),
('technical_complexity', 'Complexity analysis'),
('philosophy', 'Artistic philosophy'),
('statement', 'Artist statement'),
('category_description', 'Category description'),
('collection_description', 'Collection description');

-- Insert content categories
INSERT INTO content_categories (name, description, display_order) VALUES
('core', 'Core project information', 1),
('technical', 'Technical specifications', 2),
('artistic', 'Artistic content', 3),
('descriptive', 'Descriptive content', 4);

-- Insert artist profile from JSON data
INSERT INTO artist_profiles (
    collective_name,
    founded_year,
    location,
    philosophy,
    artistic_statement,
    medium,
    contact_info,
    influences,
    techniques
) VALUES (
    'Binary Ring',
    2024,
    'Digital Realm',
    'Exploring the intersection of mathematics, computation, and visual aesthetics through algorithmic art',
    'Binary Ring represents the convergence of mathematical precision and artistic expression, where algorithms become brushes and equations become color palettes. Each work explores the emergent beauty that arises from simple computational rules, revealing the hidden patterns that govern both digital and natural worlds.',
    'JavaScript, WebGL, HTML5 Canvas, Generative Algorithms',
    '{"email": "contact@binaryring.art", "website": "https://binaryring.art", "social": "@binaryring", "repository": "github.com/binaryring/algorithms"}',
    ARRAY[
        'Casey Reas & Ben Fry (Processing)',
        'Jared Tarbell (Complexification)',
        'Paul Bourke (Mathematical Visualizations)',
        'Nature patterns and organic growth',
        'Digital glitch aesthetics',
        'Minimalist geometric art'
    ],
    ARRAY[
        'Strange Attractors',
        'Cellular Automata',
        'L-Systems',
        'Particle Systems',
        'Reaction-Diffusion',
        'Voronoi Diagrams',
        'Fractal Mathematics',
        'Organic Growth Simulation'
    ]
);

-- Insert project collections from JSON data
INSERT INTO project_collections (key, title, description, featured, display_order) VALUES
('new_releases', 'New Releases', 'Latest additions to the Binary Ring collection', true, 1),
('interactive_experiences', 'Interactive Experiences', 'Projects with real-time user interaction capabilities', true, 2),
('contemplative', 'Contemplative Works', 'Meditative and calming visual experiences', false, 3),
('mathematical', 'Mathematical Explorations', 'Pure mathematical visualizations and attractors', false, 4),
('organic', 'Organic Forms', 'Nature-inspired growth and biological patterns', false, 5);

-- Migrate text content from existing projects
-- This will extract and structure all text content from the JSON data

DO $$
DECLARE
    project_record RECORD;
    content_type_id UUID;
BEGIN
    -- Get content type IDs
    SELECT id INTO content_type_id FROM content_types WHERE name = 'title';

    -- Migrate project titles and descriptions
    FOR project_record IN
        SELECT id, name, display_name, description, category
        FROM projects
    LOOP
        -- Insert title
        INSERT INTO text_content (project_id, content_type_id, key, value, is_published)
        VALUES (
            project_record.id,
            (SELECT id FROM content_types WHERE name = 'title'),
            'title',
            project_record.display_name,
            true
        );

        -- Insert description if exists
        IF project_record.description IS NOT NULL THEN
            INSERT INTO text_content (project_id, content_type_id, key, value, is_published)
            VALUES (
                project_record.id,
                (SELECT id FROM content_types WHERE name = 'description'),
                'description',
                project_record.description,
                true
            );
        END IF;
    END LOOP;
END $$;

-- Insert technical details for sample projects based on JSON data
INSERT INTO technical_details (project_id, algorithm_description, complexity_analysis, performance_metrics, parameters, outputs)
SELECT
    p.id,
    'Advanced algorithmic implementation with optimized performance characteristics',
    'Optimized for real-time rendering with efficient memory usage',
    '{"renderTime": "Real-time", "maxResolution": "4K", "frameRate": "60 FPS"}',
    '{"configurable": true, "realtime": true, "interactive": true}',
    '{"formats": ["PNG", "WebM", "SVG"], "maxResolution": "8K"}'
FROM projects p
WHERE p.name IN ('buddhabrot', 'node.garden', 'substrate', 'deep.lorenz', 'happy.place', 'orbitals');

-- Create comprehensive content entries for featured projects
INSERT INTO text_content (project_id, content_type_id, key, value, is_published) VALUES
-- Buddhabrot content
((SELECT id FROM projects WHERE name = 'buddhabrot'),
 (SELECT id FROM content_types WHERE name = 'long_description'),
 'long_description',
 'The Buddhabrot is a fractal rendering technique that reveals the hidden paths taken by points escaping the Mandelbrot set. Unlike traditional Mandelbrot visualizations, this algorithm traces and accumulates the trajectories of escaping points, creating flowing, organic forms reminiscent of Buddhist iconography.',
 true),

-- Node Garden content
((SELECT id FROM projects WHERE name = 'node.garden'),
 (SELECT id FROM content_types WHERE name = 'long_description'),
 'long_description',
 'Node Garden simulates a living ecosystem of interconnected nodes that grow, connect, and evolve over time. Users can interact with the system by spawning new nodes, adjusting growth parameters, and observing emergent network behaviors. The system demonstrates principles of complex adaptive systems and network theory.',
 true),

-- Substrate content
((SELECT id FROM projects WHERE name = 'substrate'),
 (SELECT id FROM content_types WHERE name = 'long_description'),
 'long_description',
 'Substrate explores the beauty of natural crack formation through computational simulation. The algorithm mimics the growth patterns found in bacterial colonies, dried earth, and material stress fractures. Cracks grow across the surface, spawning new cracks at intersections and creating complex organic networks.',
 true),

-- Deep Lorenz content
((SELECT id FROM projects WHERE name = 'deep.lorenz'),
 (SELECT id FROM content_types WHERE name = 'long_description'),
 'long_description',
 'Deep Lorenz provides an immersive journey through the famous Lorenz attractor phase space. This chaotic system, originally used to model atmospheric convection, creates beautiful butterfly-like patterns. The visualization allows deep exploration of parameter space and reveals the sensitive dependence on initial conditions.',
 true),

-- Happy Place content
((SELECT id FROM projects WHERE name = 'happy.place'),
 (SELECT id FROM content_types WHERE name = 'long_description'),
 'long_description',
 'Happy Place generates visual patterns designed to evoke positive emotions and create calming, uplifting experiences. The algorithm responds to color psychology principles and creates flowing, organic forms that promote relaxation and well-being.',
 true),

-- Orbitals content
((SELECT id FROM projects WHERE name = 'orbitals'),
 (SELECT id FROM content_types WHERE name = 'long_description'),
 'long_description',
 'Orbitals creates beautiful visualizations inspired by quantum mechanical atomic orbitals. The system simulates electron probability clouds and their interactions, creating ethereal, glowing forms that dance in three-dimensional space.',
 true);

-- Insert collection relationships
INSERT INTO project_collection_items (collection_id, project_id, display_order)
SELECT
    pc.id,
    p.id,
    ROW_NUMBER() OVER (PARTITION BY pc.id ORDER BY p.name)
FROM project_collections pc
CROSS JOIN projects p
WHERE
    (pc.key = 'new_releases' AND p.is_new = true) OR
    (pc.key = 'organic' AND p.category = 'organic') OR
    (pc.key = 'mathematical' AND p.category IN ('fractals', 'attractors'));

-- =====================================================
-- ANALYTICS AND MONITORING
-- =====================================================

-- Content analytics view
CREATE OR REPLACE VIEW content_analytics AS
SELECT
    tc.project_id,
    p.display_name as project_name,
    tc.key as content_key,
    tc.language_code,
    LENGTH(tc.value) as content_length,
    tc.version,
    tc.created_at,
    tc.updated_at,
    cv.version_number as total_versions
FROM text_content tc
JOIN projects p ON tc.project_id = p.id
LEFT JOIN (
    SELECT content_id, MAX(version_number) as version_number
    FROM content_versions
    GROUP BY content_id
) cv ON tc.id = cv.content_id
WHERE tc.is_current = true;

-- Search usage tracking
CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    search_query TEXT NOT NULL,
    search_type TEXT DEFAULT 'full_text', -- full_text, fuzzy, filtered
    results_count INTEGER,
    user_session TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to export all content for a project
CREATE OR REPLACE FUNCTION export_project_content(p_project_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'project', jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'display_name', p.display_name,
            'category', p.category
        ),
        'content', jsonb_object_agg(tc.key, tc.value),
        'technical_details', td.algorithm_description,
        'metadata', p.content_metadata
    ) INTO result
    FROM projects p
    LEFT JOIN text_content tc ON p.id = tc.project_id AND tc.is_current = true AND tc.is_published = true
    LEFT JOIN technical_details td ON p.id = td.project_id
    WHERE p.id = p_project_id
    GROUP BY p.id, p.name, p.display_name, p.category, p.content_metadata, td.algorithm_description;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk import content
CREATE OR REPLACE FUNCTION import_project_content(
    p_project_id UUID,
    p_content JSONB,
    p_language TEXT DEFAULT 'en'
)
RETURNS BOOLEAN AS $$
DECLARE
    content_key TEXT;
    content_value TEXT;
BEGIN
    -- Insert each key-value pair from the JSON
    FOR content_key, content_value IN SELECT * FROM jsonb_each_text(p_content)
    LOOP
        INSERT INTO text_content (project_id, key, value, language_code, is_published)
        VALUES (p_project_id, content_key, content_value, p_language, true)
        ON CONFLICT (project_id, key, version)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
    END LOOP;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FINAL OPTIMIZATIONS
-- =====================================================

-- Update search vectors for all projects
UPDATE projects SET search_vector = (
    SELECT to_tsvector('english',
        COALESCE(string_agg(tc.value, ' '), '') || ' ' ||
        COALESCE(projects.display_name, '') || ' ' ||
        COALESCE(projects.description, '') || ' ' ||
        COALESCE(projects.category, '')
    )
    FROM text_content tc
    WHERE tc.project_id = projects.id
    AND tc.is_current = true
    AND tc.is_published = true
);

-- Create materialized view for fast content access
CREATE MATERIALIZED VIEW IF NOT EXISTS project_content_summary AS
SELECT
    p.id as project_id,
    p.name as project_name,
    p.display_name,
    p.category,
    p.is_new,
    jsonb_object_agg(
        COALESCE(tc.key, 'empty'),
        COALESCE(tc.value, '')
    ) as content,
    td.algorithm_description,
    td.complexity_analysis,
    p.search_vector
FROM projects p
LEFT JOIN text_content tc ON p.id = tc.project_id
    AND tc.is_current = true
    AND tc.is_published = true
LEFT JOIN technical_details td ON p.id = td.project_id
GROUP BY p.id, p.name, p.display_name, p.category, p.is_new,
         td.algorithm_description, td.complexity_analysis, p.search_vector;

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_project_content_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW project_content_summary;
END;
$$ LANGUAGE plpgsql;

-- Auto-refresh trigger (optional - can be resource intensive)
-- CREATE OR REPLACE FUNCTION auto_refresh_content_summary()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     PERFORM refresh_project_content_summary();
--     RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE text_content IS 'Stores all text content with versioning and multilingual support';
COMMENT ON TABLE content_versions IS 'Tracks all changes to text content for audit and rollback';
COMMENT ON TABLE technical_details IS 'Stores technical specifications and parameters for projects';
COMMENT ON TABLE project_collections IS 'Organizes projects into curated collections';
COMMENT ON TABLE artist_profiles IS 'Stores artist and collective information';
COMMENT ON FUNCTION search_content IS 'Full-text search across all published content';
COMMENT ON FUNCTION fuzzy_search_content IS 'Fuzzy search for approximate content matching';
COMMENT ON MATERIALIZED VIEW project_content_summary IS 'Fast access view for project content and metadata';

-- Migration complete message
DO $$
BEGIN
    RAISE NOTICE 'Text content migration completed successfully. Created % content types, % projects with content.',
        (SELECT COUNT(*) FROM content_types),
        (SELECT COUNT(DISTINCT project_id) FROM text_content);
END $$;