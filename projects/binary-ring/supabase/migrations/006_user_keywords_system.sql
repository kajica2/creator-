-- User Keywords Collection System for Binary Ring
-- Allows users to collect persistent keywords and get personalized content

-- Keywords taxonomy table
CREATE TABLE keyword_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color_hex TEXT DEFAULT '#6b7280',
    icon TEXT,
    parent_category_id UUID REFERENCES keyword_categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global keywords dictionary
CREATE TABLE keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL UNIQUE,
    category_id UUID REFERENCES keyword_categories(id),
    definition TEXT,
    related_concepts TEXT[], -- Array of related terms
    popularity_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles for keyword collection
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Can be session-based or auth-based
    username TEXT,
    email TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User collected keywords
CREATE TABLE user_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
    source TEXT, -- Where they found this keyword (project name, app, etc.)
    context TEXT, -- Additional context about why they saved it
    strength INTEGER DEFAULT 1, -- How interested they are (1-10)
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_profile_id, keyword_id)
);

-- Project/content tagging with keywords
CREATE TABLE content_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL, -- 'project', 'app', 'experiment', 'template'
    content_id TEXT NOT NULL, -- ID or name of the content
    keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
    relevance_score FLOAT DEFAULT 1.0, -- How relevant this keyword is to content
    auto_generated BOOLEAN DEFAULT false, -- AI-generated vs manually added
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_type, content_id, keyword_id)
);

-- User content interactions
CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    interaction_type TEXT NOT NULL, -- 'view', 'like', 'bookmark', 'share', 'download'
    duration_seconds INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personalized recommendations
CREATE TABLE user_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    recommendation_type TEXT NOT NULL, -- 'keyword_match', 'similar_users', 'trending', 'ai_suggested'
    confidence_score FLOAT DEFAULT 0.5, -- 0-1 confidence in recommendation
    reasoning TEXT, -- Why this was recommended
    shown_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keyword relationships (for better recommendations)
CREATE TABLE keyword_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword1_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
    keyword2_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL, -- 'similar', 'opposite', 'parent', 'child', 'related'
    strength FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(keyword1_id, keyword2_id, relationship_type)
);

-- Insert initial keyword categories
INSERT INTO keyword_categories (name, description, color_hex, icon) VALUES
('Technology', 'Programming languages, frameworks, and tools', '#4f46e5', '💻'),
('Creative', 'Art, design, music, and visual concepts', '#ec4899', '🎨'),
('Audio', 'Sound, music, frequencies, and audio processing', '#10b981', '🎵'),
('Visual', 'Graphics, visualization, and visual effects', '#f59e0b', '🌟'),
('AI/ML', 'Artificial intelligence and machine learning', '#8b5cf6', '🤖'),
('Mathematics', 'Algorithms, geometry, and mathematical concepts', '#06b6d4', '📐'),
('Interactive', 'User interaction, controls, and interfaces', '#ef4444', '🎮'),
('Experimental', 'Research, prototypes, and cutting-edge concepts', '#84cc16', '🧪'),
('Wellness', 'Mindfulness, meditation, and personal growth', '#14b8a6', '🧘'),
('Philosophy', 'Deep concepts, meaning, and existential themes', '#a855f7', '💭');

-- Insert initial keywords
INSERT INTO keywords (keyword, category_id, definition, related_concepts)
SELECT
    keyword,
    (SELECT id FROM keyword_categories WHERE name = category),
    definition,
    related_concepts
FROM (VALUES
    ('generative-art', 'Creative', 'Art created through algorithmic processes', ARRAY['algorithms', 'creativity', 'automation']),
    ('particle-systems', 'Visual', 'Simulation of many small objects for visual effects', ARRAY['physics', 'animation', 'effects']),
    ('audio-reactive', 'Audio', 'Visual elements that respond to sound input', ARRAY['visualization', 'frequency', 'real-time']),
    ('machine-learning', 'AI/ML', 'Algorithms that learn from data', ARRAY['neural-networks', 'training', 'prediction']),
    ('fractals', 'Mathematics', 'Self-similar patterns at different scales', ARRAY['geometry', 'recursion', 'patterns']),
    ('real-time', 'Interactive', 'Processing that happens without noticeable delay', ARRAY['performance', 'streaming', 'live']),
    ('mindfulness', 'Wellness', 'Present-moment awareness practice', ARRAY['meditation', 'awareness', 'presence']),
    ('consciousness', 'Philosophy', 'The state of being aware and perceiving', ARRAY['awareness', 'perception', 'existence']),
    ('frequency-analysis', 'Audio', 'Breaking down audio into component frequencies', ARRAY['fourier', 'spectrum', 'analysis']),
    ('procedural-generation', 'Creative', 'Content created through automated processes', ARRAY['algorithms', 'random', 'infinite'])
) AS initial_keywords(keyword, category, definition, related_concepts);

-- Create indexes for performance
CREATE INDEX idx_user_keywords_user_profile ON user_keywords(user_profile_id);
CREATE INDEX idx_user_keywords_keyword ON user_keywords(keyword_id);
CREATE INDEX idx_content_keywords_content ON content_keywords(content_type, content_id);
CREATE INDEX idx_content_keywords_keyword ON content_keywords(keyword_id);
CREATE INDEX idx_user_interactions_user ON user_interactions(user_profile_id);
CREATE INDEX idx_user_interactions_content ON user_interactions(content_type, content_id);
CREATE INDEX idx_user_recommendations_user ON user_recommendations(user_profile_id);
CREATE INDEX idx_keywords_search ON keywords USING gin(to_tsvector('english', keyword || ' ' || definition));

-- RLS (Row Level Security) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to keywords and categories
ALTER TABLE keyword_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to keyword_categories" ON keyword_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to keywords" ON keywords FOR SELECT USING (true);
CREATE POLICY "Allow public read access to content_keywords" ON content_keywords FOR SELECT USING (true);

-- User-specific policies (can be updated based on auth system)
CREATE POLICY "Users can access their own profile" ON user_profiles FOR ALL USING (true); -- Update with auth
CREATE POLICY "Users can manage their own keywords" ON user_keywords FOR ALL USING (true); -- Update with auth
CREATE POLICY "Users can access their own interactions" ON user_interactions FOR ALL USING (true); -- Update with auth
CREATE POLICY "Users can access their own recommendations" ON user_recommendations FOR ALL USING (true); -- Update with auth

-- Functions for keyword operations

-- Function to add a keyword to user's collection
CREATE OR REPLACE FUNCTION add_user_keyword(
    p_user_profile_id UUID,
    p_keyword TEXT,
    p_source TEXT DEFAULT NULL,
    p_context TEXT DEFAULT NULL,
    p_strength INTEGER DEFAULT 1
) RETURNS UUID AS $$
DECLARE
    v_keyword_id UUID;
    v_user_keyword_id UUID;
BEGIN
    -- Get or create keyword
    SELECT id INTO v_keyword_id FROM keywords WHERE keyword = p_keyword;

    IF v_keyword_id IS NULL THEN
        INSERT INTO keywords (keyword) VALUES (p_keyword) RETURNING id INTO v_keyword_id;
    END IF;

    -- Add to user's collection (or update if exists)
    INSERT INTO user_keywords (user_profile_id, keyword_id, source, context, strength)
    VALUES (p_user_profile_id, v_keyword_id, p_source, p_context, p_strength)
    ON CONFLICT (user_profile_id, keyword_id)
    DO UPDATE SET
        strength = GREATEST(user_keywords.strength, p_strength),
        last_accessed = NOW(),
        context = COALESCE(p_context, user_keywords.context)
    RETURNING id INTO v_user_keyword_id;

    -- Update keyword popularity
    UPDATE keywords SET popularity_score = popularity_score + 1 WHERE id = v_keyword_id;

    RETURN v_user_keyword_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get personalized content recommendations
CREATE OR REPLACE FUNCTION get_user_recommendations(
    p_user_profile_id UUID,
    p_content_type TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    content_type TEXT,
    content_id TEXT,
    title TEXT,
    description TEXT,
    keywords TEXT[],
    match_score FLOAT,
    recommendation_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_keyword_interests AS (
        -- Get user's keywords with strength weights
        SELECT uk.keyword_id, k.keyword, uk.strength
        FROM user_keywords uk
        JOIN keywords k ON uk.keyword_id = k.id
        WHERE uk.user_profile_id = p_user_profile_id
    ),
    content_matches AS (
        -- Find content that matches user's keywords
        SELECT
            ck.content_type,
            ck.content_id,
            ck.content_type || ':' || ck.content_id as full_content_id,
            SUM(ck.relevance_score * uki.strength) as match_score,
            ARRAY_AGG(DISTINCT uki.keyword) as matching_keywords
        FROM content_keywords ck
        JOIN user_keyword_interests uki ON ck.keyword_id = uki.keyword_id
        WHERE (p_content_type IS NULL OR ck.content_type = p_content_type)
        GROUP BY ck.content_type, ck.content_id
        HAVING SUM(ck.relevance_score * uki.strength) > 0
        ORDER BY match_score DESC
        LIMIT p_limit
    )
    SELECT
        cm.content_type,
        cm.content_id,
        cm.content_id as title, -- Will be replaced with actual titles from content tables
        'Matches your interests in: ' || array_to_string(cm.matching_keywords, ', ') as description,
        cm.matching_keywords as keywords,
        cm.match_score,
        'Based on your collected keywords: ' || array_to_string(cm.matching_keywords, ', ') as recommendation_reason
    FROM content_matches cm;
END;
$$ LANGUAGE plpgsql;

-- Function to search keywords
CREATE OR REPLACE FUNCTION search_keywords(
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    keyword_id UUID,
    keyword TEXT,
    category_name TEXT,
    definition TEXT,
    popularity_score INTEGER,
    related_concepts TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        k.id,
        k.keyword,
        kc.name,
        k.definition,
        k.popularity_score,
        k.related_concepts
    FROM keywords k
    LEFT JOIN keyword_categories kc ON k.category_id = kc.id
    WHERE
        k.keyword ILIKE '%' || p_search_term || '%' OR
        k.definition ILIKE '%' || p_search_term || '%' OR
        p_search_term = ANY(k.related_concepts)
    ORDER BY
        CASE WHEN k.keyword ILIKE p_search_term || '%' THEN 1 ELSE 2 END,
        k.popularity_score DESC,
        k.keyword
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;