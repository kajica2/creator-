-- Add hashtag cloud visualization fields to existing hashtags table
ALTER TABLE hashtags
ADD COLUMN IF NOT EXISTS frequency INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trending_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cloud_position_x NUMERIC,
ADD COLUMN IF NOT EXISTS cloud_position_y NUMERIC,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trending_velocity NUMERIC DEFAULT 0;

-- Create hashtag usage tracking table for real-time analytics
CREATE TABLE IF NOT EXISTS hashtag_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hashtag_id UUID REFERENCES hashtags(id) ON DELETE CASCADE,
  user_session TEXT,
  context TEXT, -- 'selection', 'search', 'generation'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hashtag trending analytics view
CREATE OR REPLACE VIEW hashtag_trending AS
SELECT
  h.*,
  COALESCE(daily_usage.usage_today, 0) as usage_today,
  COALESCE(weekly_usage.usage_week, 0) as usage_week,
  COALESCE(monthly_usage.usage_month, 0) as usage_month,
  -- Calculate trending score based on recent usage
  CASE
    WHEN COALESCE(daily_usage.usage_today, 0) > 0 THEN
      (COALESCE(daily_usage.usage_today, 0) * 10 +
       COALESCE(weekly_usage.usage_week, 0) * 2 +
       COALESCE(monthly_usage.usage_month, 0)) / 13.0
    ELSE h.trending_score
  END as calculated_trending_score
FROM hashtags h
LEFT JOIN (
  SELECT
    hu.hashtag_id,
    COUNT(*) as usage_today
  FROM hashtag_usage hu
  WHERE hu.created_at >= NOW() - INTERVAL '1 day'
  GROUP BY hu.hashtag_id
) daily_usage ON h.id = daily_usage.hashtag_id
LEFT JOIN (
  SELECT
    hu.hashtag_id,
    COUNT(*) as usage_week
  FROM hashtag_usage hu
  WHERE hu.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY hu.hashtag_id
) weekly_usage ON h.id = weekly_usage.hashtag_id
LEFT JOIN (
  SELECT
    hu.hashtag_id,
    COUNT(*) as usage_month
  FROM hashtag_usage hu
  WHERE hu.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY hu.hashtag_id
) monthly_usage ON h.id = monthly_usage.hashtag_id;

-- Create function to update hashtag usage statistics
CREATE OR REPLACE FUNCTION update_hashtag_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the hashtag's usage count and last used timestamp
  UPDATE hashtags
  SET
    usage_count = usage_count + 1,
    last_used_at = NEW.created_at,
    frequency = usage_count + 1
  WHERE id = NEW.hashtag_id;

  -- Update trending score based on recent activity
  UPDATE hashtags
  SET trending_score = (
    SELECT calculated_trending_score
    FROM hashtag_trending
    WHERE hashtag_trending.id = NEW.hashtag_id
  )
  WHERE id = NEW.hashtag_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for real-time hashtag statistics
CREATE TRIGGER update_hashtag_stats_trigger
  AFTER INSERT ON hashtag_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_hashtag_stats();

-- Create function to track hashtag usage
CREATE OR REPLACE FUNCTION track_hashtag_usage(
  hashtag_name TEXT,
  session_id TEXT DEFAULT NULL,
  usage_context TEXT DEFAULT 'selection'
)
RETURNS BOOLEAN AS $$
DECLARE
  hashtag_record hashtags%ROWTYPE;
BEGIN
  -- Find the hashtag by name
  SELECT * INTO hashtag_record FROM hashtags WHERE name = hashtag_name;

  IF hashtag_record.id IS NOT NULL THEN
    -- Insert usage record
    INSERT INTO hashtag_usage (hashtag_id, user_session, context)
    VALUES (hashtag_record.id, session_id, usage_context);

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance on cloud queries
CREATE INDEX IF NOT EXISTS idx_hashtags_frequency ON hashtags(frequency DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_trending_score ON hashtags(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON hashtags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_cloud_position ON hashtags(cloud_position_x, cloud_position_y);
CREATE INDEX IF NOT EXISTS idx_hashtag_usage_hashtag_id ON hashtag_usage(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_hashtag_usage_created_at ON hashtag_usage(created_at);

-- Update RLS policies for new tables
ALTER TABLE hashtag_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for hashtag_usage" ON hashtag_usage
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access for hashtag_usage" ON hashtag_usage
  FOR INSERT WITH CHECK (true);

-- Create function to get hashtag cloud data
CREATE OR REPLACE FUNCTION get_hashtag_cloud_data(
  category_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 100,
  min_frequency INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  display_count TEXT,
  size TEXT,
  frequency INTEGER,
  trending_score NUMERIC,
  popularity_score NUMERIC,
  cloud_position_x NUMERIC,
  cloud_position_y NUMERIC,
  category_name TEXT,
  usage_today BIGINT,
  usage_week BIGINT,
  usage_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ht.id,
    ht.name,
    ht.display_count,
    ht.size,
    ht.frequency,
    ht.calculated_trending_score as trending_score,
    ht.popularity_score,
    ht.cloud_position_x,
    ht.cloud_position_y,
    hc.name as category_name,
    ht.usage_today,
    ht.usage_week,
    ht.usage_month
  FROM hashtag_trending ht
  LEFT JOIN hashtag_categories hc ON ht.category_id = hc.id
  WHERE
    (category_filter IS NULL OR hc.name = category_filter) AND
    ht.frequency >= min_frequency
  ORDER BY ht.calculated_trending_score DESC, ht.frequency DESC, ht.popularity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Insert some initial cloud position data (will be updated by the component)
UPDATE hashtags SET
  cloud_position_x = (RANDOM() - 0.5) * 800,
  cloud_position_y = (RANDOM() - 0.5) * 600,
  frequency = GREATEST(1, (RANDOM() * 100)::INTEGER),
  trending_score = RANDOM() * 10
WHERE cloud_position_x IS NULL;

-- Comment explaining the schema additions
COMMENT ON COLUMN hashtags.frequency IS 'Number of times this hashtag has been used or selected';
COMMENT ON COLUMN hashtags.trending_score IS 'Calculated score based on recent usage patterns for trending analysis';
COMMENT ON COLUMN hashtags.cloud_position_x IS 'X coordinate for hashtag cloud visualization';
COMMENT ON COLUMN hashtags.cloud_position_y IS 'Y coordinate for hashtag cloud visualization';
COMMENT ON COLUMN hashtags.usage_count IS 'Total historical usage count';
COMMENT ON COLUMN hashtags.last_used_at IS 'Timestamp of last usage';
COMMENT ON COLUMN hashtags.trending_velocity IS 'Rate of change in trending score';

COMMENT ON TABLE hashtag_usage IS 'Tracks individual hashtag usage events for analytics';
COMMENT ON VIEW hashtag_trending IS 'Real-time view of hashtag trending data with calculated metrics';