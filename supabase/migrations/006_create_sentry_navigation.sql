-- Create table for Sentry navigation items
CREATE TABLE IF NOT EXISTS sentry_navigation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'platform', 'solutions', 'about', 'help'
  subcategory TEXT, -- For items like 'Error Monitoring' under 'Platform'
  description TEXT,
  url TEXT, -- Where this navigation item would lead
  popularity_score NUMERIC DEFAULT 0, -- Importance/popularity (0-100)
  usage_frequency INTEGER DEFAULT 0, -- How often it's accessed
  display_order INTEGER DEFAULT 0, -- Order within category

  -- Cloud visualization fields
  cloud_position_x NUMERIC,
  cloud_position_y NUMERIC,
  cloud_size NUMERIC DEFAULT 1, -- Visual size multiplier (0.5-3.0)
  color_code TEXT, -- Hex color for the category

  -- Metadata
  is_featured BOOLEAN DEFAULT FALSE, -- Highlight important items
  is_new BOOLEAN DEFAULT FALSE, -- Mark new features
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for navigation categories
CREATE TABLE IF NOT EXISTS sentry_navigation_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  color_code TEXT NOT NULL, -- Base color for this category
  description TEXT,
  icon TEXT, -- Icon name or emoji
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS sentry_navigation_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  navigation_item_id UUID REFERENCES sentry_navigation_items(id) ON DELETE CASCADE,
  user_session TEXT,
  action TEXT DEFAULT 'view', -- 'view', 'click', 'hover'
  context TEXT, -- Additional context about the interaction
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert navigation categories
INSERT INTO sentry_navigation_categories (name, display_name, color_code, description, icon, display_order) VALUES
('platform', 'Platform', '#EF4444', 'Core platform features and monitoring tools', '⚡', 1),
('solutions', 'Solutions', '#3B82F6', 'Industry-specific solutions and use cases', '🎯', 2),
('about', 'About', '#10B981', 'Company information and resources', 'ℹ️', 3),
('help', 'Get Help', '#F59E0B', 'Support, documentation, and resources', '❓', 4);

-- Insert Sentry navigation items
INSERT INTO sentry_navigation_items (name, category, subcategory, description, url, popularity_score, display_order, is_featured, cloud_size, color_code) VALUES
-- Platform (red theme)
('Error Monitoring', 'platform', NULL, 'Real-time error tracking and alerting', '/features/error-monitoring', 95, 1, TRUE, 2.5, '#EF4444'),
('Tracing', 'platform', NULL, 'Distributed tracing and performance monitoring', '/features/tracing', 85, 2, TRUE, 2.2, '#DC2626'),
('Session Replay', 'platform', NULL, 'Video-like reproduction of user sessions', '/features/session-replay', 80, 3, TRUE, 2.0, '#B91C1C'),
('Profiling', 'platform', NULL, 'Code-level performance insights', '/features/profiling', 75, 4, FALSE, 1.8, '#991B1B'),
('Logs', 'platform', NULL, 'Centralized log management and analysis', '/features/logs', 70, 5, FALSE, 1.6, '#7F1D1D'),
('Uptime Monitoring', 'platform', NULL, 'Website and API uptime tracking', '/features/uptime', 65, 6, FALSE, 1.4, '#FCA5A5'),
('Seer', 'platform', NULL, 'AI-powered issue resolution', '/features/seer', 90, 7, TRUE, 2.3, '#F87171'),
('Cron Monitoring', 'platform', NULL, 'Scheduled job monitoring', '/features/cron', 60, 8, FALSE, 1.3, '#FECACA'),
('Integrations', 'platform', NULL, 'Connect with your favorite tools', '/integrations', 70, 9, FALSE, 1.5, '#FEE2E2'),

-- Solutions (blue theme)
('Web/Frontend Development', 'solutions', NULL, 'Monitoring for React, Vue, Angular apps', '/solutions/frontend', 88, 1, TRUE, 2.1, '#3B82F6'),
('Mobile Crash Reporting', 'solutions', NULL, 'iOS and Android crash tracking', '/solutions/mobile', 82, 2, FALSE, 1.9, '#2563EB'),
('Game Crash Reporting', 'solutions', NULL, 'Unity and Unreal Engine monitoring', '/solutions/gaming', 75, 3, FALSE, 1.7, '#1D4ED8'),
('AI Observability', 'solutions', NULL, 'Monitor AI/ML model performance', '/solutions/ai', 85, 4, TRUE, 2.0, '#1E40AF'),
('Application Performance Monitoring', 'solutions', NULL, 'Full-stack APM solution', '/solutions/apm', 90, 5, TRUE, 2.2, '#1E3A8A'),
('Real User Monitoring', 'solutions', NULL, 'Real user experience insights', '/solutions/rum', 78, 6, FALSE, 1.8, '#93C5FD'),
('Ecommerce', 'solutions', NULL, 'Monitoring for online stores', '/solutions/ecommerce', 70, 7, FALSE, 1.5, '#DBEAFE'),
('Enterprise', 'solutions', NULL, 'Enterprise-grade monitoring solutions', '/solutions/enterprise', 85, 8, TRUE, 2.0, '#BFDBFE'),

-- About (green theme)
('About', 'about', NULL, 'Learn about Sentry''s mission and team', '/about', 60, 1, FALSE, 1.2, '#10B981'),
('Blog', 'about', NULL, 'Latest news and technical insights', '/blog', 75, 2, FALSE, 1.6, '#059669'),
('Careers', 'about', NULL, 'Join the Sentry team', '/careers', 65, 3, FALSE, 1.3, '#047857'),
('Contact Us', 'about', NULL, 'Get in touch with Sentry', '/contact', 50, 4, FALSE, 1.0, '#065F46'),
('Trust', 'about', NULL, 'Security and compliance information', '/trust', 70, 5, FALSE, 1.4, '#6EE7B7'),

-- Help (yellow/orange theme)
('Docs', 'help', NULL, 'Comprehensive documentation', '/docs', 95, 1, TRUE, 2.4, '#F59E0B'),
('Help Center', 'help', NULL, 'Support articles and FAQs', '/help', 80, 2, FALSE, 1.8, '#D97706'),
('Status', 'help', NULL, 'System status and uptime', '/status', 70, 3, FALSE, 1.5, '#B45309'),
('Dev Resources', 'help', NULL, 'Developer tools and resources', '/developers', 75, 4, FALSE, 1.6, '#92400E');

-- Create view for navigation cloud data with category information
CREATE OR REPLACE VIEW sentry_navigation_cloud AS
SELECT
  sni.id,
  sni.name,
  sni.category,
  sni.subcategory,
  sni.description,
  sni.url,
  sni.popularity_score,
  sni.usage_frequency,
  sni.cloud_position_x,
  sni.cloud_position_y,
  sni.cloud_size,
  sni.color_code,
  sni.is_featured,
  sni.is_new,
  snc.display_name as category_display_name,
  snc.icon as category_icon,
  snc.description as category_description,
  COALESCE(daily_usage.usage_today, 0) as usage_today,
  COALESCE(weekly_usage.usage_week, 0) as usage_week,
  -- Calculate size based on popularity and usage
  GREATEST(0.8, LEAST(3.0,
    sni.cloud_size * (1 + sni.popularity_score / 100.0) * (1 + COALESCE(daily_usage.usage_today, 0) / 10.0)
  )) as calculated_size
FROM sentry_navigation_items sni
LEFT JOIN sentry_navigation_categories snc ON sni.category = snc.name
LEFT JOIN (
  SELECT
    snu.navigation_item_id,
    COUNT(*) as usage_today
  FROM sentry_navigation_usage snu
  WHERE snu.created_at >= NOW() - INTERVAL '1 day'
  GROUP BY snu.navigation_item_id
) daily_usage ON sni.id = daily_usage.navigation_item_id
LEFT JOIN (
  SELECT
    snu.navigation_item_id,
    COUNT(*) as usage_week
  FROM sentry_navigation_usage snu
  WHERE snu.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY snu.navigation_item_id
) weekly_usage ON sni.id = weekly_usage.navigation_item_id;

-- Function to track navigation usage
CREATE OR REPLACE FUNCTION track_sentry_navigation_usage(
  item_name TEXT,
  session_id TEXT DEFAULT NULL,
  action_type TEXT DEFAULT 'view',
  usage_context TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  item_record sentry_navigation_items%ROWTYPE;
BEGIN
  -- Find the navigation item by name
  SELECT * INTO item_record FROM sentry_navigation_items WHERE name = item_name;

  IF item_record.id IS NOT NULL THEN
    -- Insert usage record
    INSERT INTO sentry_navigation_usage (navigation_item_id, user_session, action, context)
    VALUES (item_record.id, session_id, action_type, usage_context);

    -- Update usage frequency
    UPDATE sentry_navigation_items
    SET usage_frequency = usage_frequency + 1,
        updated_at = NOW()
    WHERE id = item_record.id;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get navigation cloud data
CREATE OR REPLACE FUNCTION get_sentry_navigation_cloud(
  category_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  include_featured_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  subcategory TEXT,
  description TEXT,
  url TEXT,
  popularity_score NUMERIC,
  cloud_position_x NUMERIC,
  cloud_position_y NUMERIC,
  color_code TEXT,
  calculated_size NUMERIC,
  category_display_name TEXT,
  category_icon TEXT,
  is_featured BOOLEAN,
  is_new BOOLEAN,
  usage_today BIGINT,
  usage_week BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    snc.id,
    snc.name,
    snc.category,
    snc.subcategory,
    snc.description,
    snc.url,
    snc.popularity_score,
    snc.cloud_position_x,
    snc.cloud_position_y,
    snc.color_code,
    snc.calculated_size,
    snc.category_display_name,
    snc.category_icon,
    snc.is_featured,
    snc.is_new,
    snc.usage_today,
    snc.usage_week
  FROM sentry_navigation_cloud snc
  WHERE
    (category_filter IS NULL OR snc.category = category_filter) AND
    (NOT include_featured_only OR snc.is_featured = TRUE)
  ORDER BY snc.popularity_score DESC, snc.usage_week DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Initialize random cloud positions
UPDATE sentry_navigation_items SET
  cloud_position_x = (RANDOM() - 0.5) * 1000,
  cloud_position_y = (RANDOM() - 0.5) * 700
WHERE cloud_position_x IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sentry_navigation_category ON sentry_navigation_items(category);
CREATE INDEX IF NOT EXISTS idx_sentry_navigation_popularity ON sentry_navigation_items(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_sentry_navigation_usage ON sentry_navigation_items(usage_frequency DESC);
CREATE INDEX IF NOT EXISTS idx_sentry_navigation_position ON sentry_navigation_items(cloud_position_x, cloud_position_y);
CREATE INDEX IF NOT EXISTS idx_sentry_navigation_usage_item ON sentry_navigation_usage(navigation_item_id);
CREATE INDEX IF NOT EXISTS idx_sentry_navigation_usage_time ON sentry_navigation_usage(created_at);

-- Enable RLS
ALTER TABLE sentry_navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentry_navigation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentry_navigation_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access
CREATE POLICY "Allow public read access for sentry_navigation_items" ON sentry_navigation_items
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access for sentry_navigation_categories" ON sentry_navigation_categories
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access for sentry_navigation_usage" ON sentry_navigation_usage
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access for sentry_navigation_usage" ON sentry_navigation_usage
  FOR INSERT WITH CHECK (true);

-- Comments
COMMENT ON TABLE sentry_navigation_items IS 'Sentry navigation items for interactive cloud visualization';
COMMENT ON TABLE sentry_navigation_categories IS 'Categories for organizing Sentry navigation items';
COMMENT ON TABLE sentry_navigation_usage IS 'Tracks user interactions with navigation items';
COMMENT ON VIEW sentry_navigation_cloud IS 'Complete navigation cloud data with calculated metrics';