-- Supabase Database Schema for Binary Ring Website Storage
-- This stores all generated websites and their metadata

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table - stores all binary ring projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    is_new BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parameters JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft'))
);

-- Websites table - stores generated website data
CREATE TABLE IF NOT EXISTS websites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    html_content TEXT NOT NULL,
    css_content TEXT,
    js_content TEXT,
    template_used TEXT,
    generation_params JSONB DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media files table - stores audio, video, images for each project
CREATE TABLE IF NOT EXISTS media_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT,
    file_type TEXT NOT NULL CHECK (file_type IN ('audio', 'video', 'image')),
    mime_type TEXT,
    file_size BIGINT,
    file_path TEXT NOT NULL,
    storage_url TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery table - stores curated collections of projects
CREATE TABLE IF NOT EXISTS galleries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery items - many-to-many relationship
CREATE TABLE IF NOT EXISTS gallery_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(gallery_id, project_id)
);

-- Website analytics table
CREATE TABLE IF NOT EXISTS website_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
    visitor_id TEXT,
    page_path TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    country TEXT,
    session_duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project parameters presets
CREATE TABLE IF NOT EXISTS parameter_presets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parameters JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_websites_project_id ON websites(project_id);
CREATE INDEX IF NOT EXISTS idx_websites_slug ON websites(slug);
CREATE INDEX IF NOT EXISTS idx_websites_published ON websites(is_published);
CREATE INDEX IF NOT EXISTS idx_media_files_project_id ON media_files(project_id);
CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_gallery_items_gallery_id ON gallery_items(gallery_id);
CREATE INDEX IF NOT EXISTS idx_website_analytics_website_id ON website_analytics(website_id);
CREATE INDEX IF NOT EXISTS idx_website_analytics_created_at ON website_analytics(created_at);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameter_presets ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to active projects" ON projects
    FOR SELECT USING (status = 'active');

CREATE POLICY "Allow public read access to published websites" ON websites
    FOR SELECT USING (is_published = true);

CREATE POLICY "Allow public read access to active media files" ON media_files
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access to galleries" ON galleries
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to gallery items" ON gallery_items
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to presets" ON parameter_presets
    FOR SELECT USING (true);

-- Allow anonymous analytics tracking
CREATE POLICY "Allow insert analytics" ON website_analytics
    FOR INSERT WITH CHECK (true);

-- Functions and triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_galleries_updated_at BEFORE UPDATE ON galleries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_unique_slug(base_text TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase and replace spaces/special chars with hyphens
    slug := lower(regexp_replace(base_text, '[^a-zA-Z0-9]+', '-', 'g'));
    slug := trim(both '-' from slug);

    -- Check if slug exists and add counter if needed
    WHILE EXISTS (SELECT 1 FROM websites WHERE websites.slug = slug) LOOP
        counter := counter + 1;
        slug := lower(regexp_replace(base_text, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || counter;
        slug := trim(both '-' from slug);
    END LOOP;

    RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Insert initial project data
INSERT INTO projects (name, display_name, description, category, is_new) VALUES
('buddhabrot', 'Buddhabrot', 'Fractal path tracing in the Mandelbrot set creating organic, Buddha-like silhouettes.', 'fractals', false),
('substrate', 'Substrate', 'Crack growth simulation inspired by bacterial colonies and material decomposition.', 'organic', false),
('node.garden', 'Node Garden', 'Dynamic network visualization with organic growth patterns and interactive nodes.', 'networks', true),
('deep.lorenz', 'Deep Lorenz', 'Extended exploration of Lorenz attractor dynamics with phase space visualization.', 'attractors', false),
('invader.fractal', 'Invader Fractal', 'Space invader inspired recursive patterns creating complex fractal geometries.', 'fractals', false),
('orbitals', 'Orbitals', 'Quantum-inspired particle dynamics visualizing atomic orbital structures.', 'particles', true),
('bubble.chamber', 'Bubble Chamber', 'Physics-based bubble simulation with collision detection and surface tension.', 'physics', false),
('happy.place', 'Happy Place', 'Emotion-driven pattern generation creating positive, uplifting visual experiences.', 'emotional', true),
('city.traveler', 'City Traveler', 'Urban pattern generation with pathfinding algorithms and architectural growth.', 'spatial', false),
('peter.de.jong', 'Peter de Jong', 'Strange attractor visualization creating flowing, organic mathematical patterns.', 'attractors', false),
('bone.piles', 'Bone Piles', 'Skeletal structure generation with procedural bone formation and arrangement.', 'organic', false),
('guts', 'Guts', 'Visceral organic form generation exploring internal biological structures.', 'organic', true),
('sand.dollar', 'Sand Dollar', 'Circular particle pattern formation inspired by marine life geometries.', 'particles', false),
('moonlight.soyuz', 'Moonlight Soyuz', 'Space-themed procedural generation with celestial mechanics and orbital patterns.', 'space', false),
('tree.garden.ii', 'Tree Garden II', 'Advanced procedural tree generation creating lush, organic garden environments.', 'organic', false),
('inter.aggregate', 'Inter Aggregate', 'Real-time interactive aggregation systems responding to user input and environmental factors.', 'interactive', true);

-- Insert default gallery
INSERT INTO galleries (name, description, is_featured) VALUES
('Featured Works', 'Curated selection of standout generative art pieces', true),
('New Releases', 'Latest additions to the Binary Ring collection', true),
('Interactive Experiments', 'Projects with real-time user interaction capabilities', false);

-- Create storage bucket policies (for Supabase Storage)
-- Note: These would be run in the Supabase dashboard or via the API

/*
-- Storage bucket for media files
INSERT INTO storage.buckets (id, name, public) VALUES ('binary-ring-media', 'binary-ring-media', true);

-- Storage policy for media uploads
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'binary-ring-media');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'binary-ring-media');
*/