-- Create hashtag_categories table
CREATE TABLE IF NOT EXISTS hashtag_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hashtags table
CREATE TABLE IF NOT EXISTS hashtags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_count TEXT,
  size TEXT NOT NULL DEFAULT 'Medium',
  tags TEXT[],
  popularity_score NUMERIC DEFAULT 0,
  related_hashtags TEXT[],
  category_id UUID REFERENCES hashtag_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ready_sets table
CREATE TABLE IF NOT EXISTS ready_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  hashtags TEXT[] NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  category_id UUID REFERENCES hashtag_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hashtags_category_id ON hashtags(category_id);
CREATE INDEX IF NOT EXISTS idx_hashtags_size ON hashtags(size);
CREATE INDEX IF NOT EXISTS idx_hashtags_popularity ON hashtags(popularity_score);
CREATE INDEX IF NOT EXISTS idx_ready_sets_category_id ON ready_sets(category_id);
CREATE INDEX IF NOT EXISTS idx_ready_sets_is_favorite ON ready_sets(is_favorite);

-- Enable Row Level Security (RLS)
ALTER TABLE hashtag_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ready_sets ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access for hashtag_categories" ON hashtag_categories
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access for hashtags" ON hashtags
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access for ready_sets" ON ready_sets
  FOR SELECT USING (true);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hashtag_categories_updated_at 
  BEFORE UPDATE ON hashtag_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hashtags_updated_at 
  BEFORE UPDATE ON hashtags 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ready_sets_updated_at 
  BEFORE UPDATE ON ready_sets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();