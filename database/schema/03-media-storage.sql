-- Media Library and Storage Schema
-- This file contains tables for image/video storage, processing, and media management

-- Media collections and albums
CREATE TABLE public.media_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'general' CHECK (type IN ('general', 'campaign', 'brand', 'project')),
    tags TEXT[],
    is_public BOOLEAN DEFAULT FALSE,
    cover_image_url TEXT,
    total_items INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media files (images, videos, audio)
CREATE TABLE public.media_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES public.media_collections(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_extension TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Supabase storage path
    storage_bucket TEXT DEFAULT 'media',
    public_url TEXT,
    thumbnail_url TEXT,
    preview_url TEXT, -- for videos
    alt_text TEXT,
    caption TEXT,
    metadata JSONB DEFAULT '{}', -- EXIF, dimensions, duration, etc.
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT,
    tags TEXT[],
    is_processed BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated images from AI
CREATE TABLE public.generated_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    media_file_id UUID REFERENCES public.media_files(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    style TEXT,
    model_used TEXT,
    generation_params JSONB DEFAULT '{}', -- settings like dimensions, quality, etc.
    generation_cost DECIMAL(10,4), -- API cost tracking
    generation_time_ms INTEGER,
    seed INTEGER,
    batch_id UUID, -- for batch generations
    is_variation BOOLEAN DEFAULT FALSE,
    parent_image_id UUID REFERENCES public.generated_images(id) ON DELETE SET NULL,
    quality_score DECIMAL(3,1),
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image editing history and versions
CREATE TABLE public.image_edits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    original_image_id UUID REFERENCES public.media_files(id) ON DELETE CASCADE,
    edited_image_id UUID REFERENCES public.media_files(id) ON DELETE CASCADE,
    edit_type TEXT NOT NULL, -- 'crop', 'resize', 'filter', 'enhance', 'remove_background'
    edit_params JSONB NOT NULL,
    tool_used TEXT, -- 'internal', 'photoshop', 'canva', etc.
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch operations for images
CREATE TABLE public.image_batches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    batch_type TEXT NOT NULL CHECK (batch_type IN ('generation', 'processing', 'upload')),
    total_images INTEGER NOT NULL,
    completed_images INTEGER DEFAULT 0,
    failed_images INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    parameters JSONB DEFAULT '{}',
    error_logs TEXT[],
    total_cost DECIMAL(10,4),
    estimated_completion_time INTEGER, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media processing queue
CREATE TABLE public.media_processing_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    media_file_id UUID REFERENCES public.media_files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    processing_type TEXT NOT NULL, -- 'thumbnail', 'compress', 'transcode', 'ai_analysis'
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    parameters JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image analysis and AI tagging
CREATE TABLE public.media_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    media_file_id UUID REFERENCES public.media_files(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL, -- 'object_detection', 'face_detection', 'text_extraction', 'nsfw_detection'
    confidence_score DECIMAL(4,3),
    results JSONB NOT NULL,
    ai_tags TEXT[],
    detected_objects JSONB DEFAULT '[]',
    detected_text TEXT,
    color_palette JSONB DEFAULT '[]',
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    model_version TEXT
);

-- Media sharing and permissions
CREATE TABLE public.media_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    media_file_id UUID REFERENCES public.media_files(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    shared_with_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    permission_level TEXT DEFAULT 'view' CHECK (permission_level IN ('view', 'download', 'edit')),
    share_url TEXT UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media usage tracking
CREATE TABLE public.media_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    media_file_id UUID REFERENCES public.media_files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('view', 'download', 'share', 'edit', 'delete')),
    platform TEXT, -- where it was used
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage quotas and usage
CREATE TABLE public.storage_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    total_files INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    quota_bytes BIGINT DEFAULT 1073741824, -- 1GB default
    images_count INTEGER DEFAULT 0,
    videos_count INTEGER DEFAULT 0,
    audio_count INTEGER DEFAULT 0,
    documents_count INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_media_collections_user_id ON public.media_collections(user_id);
CREATE INDEX idx_media_collections_type ON public.media_collections(type);
CREATE INDEX idx_media_collections_is_public ON public.media_collections(is_public);

CREATE INDEX idx_media_files_user_id ON public.media_files(user_id);
CREATE INDEX idx_media_files_collection_id ON public.media_files(collection_id);
CREATE INDEX idx_media_files_mime_type ON public.media_files(mime_type);
CREATE INDEX idx_media_files_processing_status ON public.media_files(processing_status);
CREATE INDEX idx_media_files_created_at ON public.media_files(created_at DESC);
CREATE INDEX idx_media_files_file_size ON public.media_files(file_size);

CREATE INDEX idx_generated_images_user_id ON public.generated_images(user_id);
CREATE INDEX idx_generated_images_media_file_id ON public.generated_images(media_file_id);
CREATE INDEX idx_generated_images_batch_id ON public.generated_images(batch_id);
CREATE INDEX idx_generated_images_model_used ON public.generated_images(model_used);
CREATE INDEX idx_generated_images_quality_score ON public.generated_images(quality_score DESC);

CREATE INDEX idx_image_edits_user_id ON public.image_edits(user_id);
CREATE INDEX idx_image_edits_original_image_id ON public.image_edits(original_image_id);
CREATE INDEX idx_image_edits_edit_type ON public.image_edits(edit_type);

CREATE INDEX idx_image_batches_user_id ON public.image_batches(user_id);
CREATE INDEX idx_image_batches_status ON public.image_batches(status);
CREATE INDEX idx_image_batches_batch_type ON public.image_batches(batch_type);

CREATE INDEX idx_media_processing_queue_status ON public.media_processing_queue(status);
CREATE INDEX idx_media_processing_queue_priority ON public.media_processing_queue(priority DESC);
CREATE INDEX idx_media_processing_queue_created_at ON public.media_processing_queue(created_at);

CREATE INDEX idx_media_analysis_media_file_id ON public.media_analysis(media_file_id);
CREATE INDEX idx_media_analysis_analysis_type ON public.media_analysis(analysis_type);
CREATE INDEX idx_media_analysis_confidence_score ON public.media_analysis(confidence_score DESC);

CREATE INDEX idx_media_shares_media_file_id ON public.media_shares(media_file_id);
CREATE INDEX idx_media_shares_owner_id ON public.media_shares(owner_id);
CREATE INDEX idx_media_shares_shared_with_id ON public.media_shares(shared_with_id);
CREATE INDEX idx_media_shares_share_url ON public.media_shares(share_url);

CREATE INDEX idx_media_usage_media_file_id ON public.media_usage(media_file_id);
CREATE INDEX idx_media_usage_user_id ON public.media_usage(user_id);
CREATE INDEX idx_media_usage_action ON public.media_usage(action);
CREATE INDEX idx_media_usage_created_at ON public.media_usage(created_at DESC);

-- Apply updated_at triggers
CREATE TRIGGER handle_media_collections_updated_at
    BEFORE UPDATE ON public.media_collections
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_media_files_updated_at
    BEFORE UPDATE ON public.media_files
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_generated_images_updated_at
    BEFORE UPDATE ON public.generated_images
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_image_batches_updated_at
    BEFORE UPDATE ON public.image_batches
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_media_processing_queue_updated_at
    BEFORE UPDATE ON public.media_processing_queue
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_media_shares_updated_at
    BEFORE UPDATE ON public.media_shares
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_storage_usage_updated_at
    BEFORE UPDATE ON public.storage_usage
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();