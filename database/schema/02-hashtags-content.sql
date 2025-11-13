-- Hashtag and Content Management Schema
-- This file contains tables for hashtag management, content creation, and social media content

-- Hashtag categories and management
CREATE TABLE public.hashtag_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT, -- hex color for UI
    icon TEXT, -- icon identifier
    is_trending BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual hashtags
CREATE TABLE public.hashtags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tag TEXT UNIQUE NOT NULL, -- without # symbol
    category_id UUID REFERENCES public.hashtag_categories(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,
    engagement_score DECIMAL(3,1) DEFAULT 0.0,
    trending_score INTEGER DEFAULT 0,
    last_trending_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}', -- platform-specific data
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hashtag sets (collections of hashtags)
CREATE TABLE public.hashtag_sets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.hashtag_categories(id) ON DELETE SET NULL,
    hashtags TEXT[] NOT NULL, -- array of hashtag tags
    engagement_score DECIMAL(3,1) DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trending hashtags tracking
CREATE TABLE public.trending_hashtags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    hashtag_id UUID REFERENCES public.hashtags(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'instagram', 'twitter', 'tiktok', etc.
    growth_rate DECIMAL(5,2), -- percentage growth
    post_count BIGINT,
    engagement_rate DECIMAL(5,2),
    trend_position INTEGER,
    region TEXT DEFAULT 'global',
    date_recorded DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hashtag_id, platform, date_recorded, region)
);

-- Content templates
CREATE TABLE public.content_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT NOT NULL CHECK (template_type IN ('post', 'story', 'reel', 'thread', 'video')),
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- placeholders in content
    hashtag_set_id UUID REFERENCES public.hashtag_sets(id) ON DELETE SET NULL,
    category TEXT,
    tags TEXT[],
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated content
CREATE TABLE public.generated_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('story', 'lyrics', 'strategy', 'concept', 'post', 'caption')),
    title TEXT,
    content TEXT NOT NULL,
    prompt TEXT, -- original prompt used for generation
    model_used TEXT, -- AI model identifier
    generation_params JSONB DEFAULT '{}',
    hashtag_set_id UUID REFERENCES public.hashtag_sets(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.content_templates(id) ON DELETE SET NULL,
    quality_score DECIMAL(3,1),
    is_favorite BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    published_platforms TEXT[],
    engagement_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content variations and A/B tests
CREATE TABLE public.content_variations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parent_content_id UUID REFERENCES public.generated_content(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    variation_type TEXT NOT NULL, -- 'hashtags', 'tone', 'length', 'style'
    title TEXT,
    content TEXT NOT NULL,
    hashtags TEXT[],
    performance_metrics JSONB DEFAULT '{}',
    is_winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User favorites and bookmarks
CREATE TABLE public.user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('hashtag', 'hashtag_set', 'content', 'template')),
    item_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);

-- Content collaboration
CREATE TABLE public.content_collaborations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES public.generated_content(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    collaborator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    permission_level TEXT DEFAULT 'view' CHECK (permission_level IN ('view', 'comment', 'edit')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, collaborator_id)
);

-- Content publishing schedule
CREATE TABLE public.content_schedule (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES public.generated_content(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed', 'cancelled')),
    platform_post_id TEXT, -- ID from the social platform
    error_message TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    engagement_snapshot JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_hashtags_tag ON public.hashtags(tag);
CREATE INDEX idx_hashtags_category_id ON public.hashtags(category_id);
CREATE INDEX idx_hashtags_engagement_score ON public.hashtags(engagement_score DESC);
CREATE INDEX idx_hashtags_trending_score ON public.hashtags(trending_score DESC);

CREATE INDEX idx_hashtag_sets_user_id ON public.hashtag_sets(user_id);
CREATE INDEX idx_hashtag_sets_category_id ON public.hashtag_sets(category_id);
CREATE INDEX idx_hashtag_sets_is_public ON public.hashtag_sets(is_public);
CREATE INDEX idx_hashtag_sets_engagement_score ON public.hashtag_sets(engagement_score DESC);

CREATE INDEX idx_trending_hashtags_platform ON public.trending_hashtags(platform);
CREATE INDEX idx_trending_hashtags_date_recorded ON public.trending_hashtags(date_recorded DESC);
CREATE INDEX idx_trending_hashtags_growth_rate ON public.trending_hashtags(growth_rate DESC);

CREATE INDEX idx_content_templates_user_id ON public.content_templates(user_id);
CREATE INDEX idx_content_templates_type ON public.content_templates(template_type);
CREATE INDEX idx_content_templates_is_public ON public.content_templates(is_public);

CREATE INDEX idx_generated_content_user_id ON public.generated_content(user_id);
CREATE INDEX idx_generated_content_type ON public.generated_content(content_type);
CREATE INDEX idx_generated_content_created_at ON public.generated_content(created_at DESC);
CREATE INDEX idx_generated_content_quality_score ON public.generated_content(quality_score DESC);

CREATE INDEX idx_content_variations_parent_id ON public.content_variations(parent_content_id);
CREATE INDEX idx_content_variations_user_id ON public.content_variations(user_id);

CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_item_type ON public.user_favorites(item_type);

CREATE INDEX idx_content_schedule_user_id ON public.content_schedule(user_id);
CREATE INDEX idx_content_schedule_scheduled_for ON public.content_schedule(scheduled_for);
CREATE INDEX idx_content_schedule_status ON public.content_schedule(status);

-- Apply updated_at triggers
CREATE TRIGGER handle_hashtag_categories_updated_at
    BEFORE UPDATE ON public.hashtag_categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_hashtags_updated_at
    BEFORE UPDATE ON public.hashtags
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_hashtag_sets_updated_at
    BEFORE UPDATE ON public.hashtag_sets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_content_templates_updated_at
    BEFORE UPDATE ON public.content_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_generated_content_updated_at
    BEFORE UPDATE ON public.generated_content
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_content_variations_updated_at
    BEFORE UPDATE ON public.content_variations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_content_schedule_updated_at
    BEFORE UPDATE ON public.content_schedule
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default hashtag categories
INSERT INTO public.hashtag_categories (name, description, color, icon) VALUES
('Business', 'Business, entrepreneurship, and professional content', '#3B82F6', 'briefcase'),
('Lifestyle', 'Daily life, personal experiences, and lifestyle content', '#10B981', 'heart'),
('Technology', 'Tech, AI, innovation, and digital transformation', '#8B5CF6', 'cpu'),
('Fitness', 'Health, fitness, wellness, and sports content', '#F59E0B', 'dumbbell'),
('Food', 'Food, cooking, recipes, and culinary content', '#EF4444', 'utensils'),
('Travel', 'Travel, destinations, and adventure content', '#06B6D4', 'plane'),
('Fashion', 'Fashion, style, beauty, and trends', '#EC4899', 'shirt'),
('Art', 'Creative arts, design, and visual content', '#F97316', 'palette'),
('Music', 'Music, audio, and entertainment content', '#84CC16', 'music'),
('Education', 'Learning, tutorials, and educational content', '#6366F1', 'book');