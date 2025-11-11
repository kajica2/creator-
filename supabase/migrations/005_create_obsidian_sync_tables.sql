-- Create Obsidian sync status table
CREATE TABLE IF NOT EXISTS obsidian_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_path TEXT NOT NULL,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'disconnected',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Obsidian notes table
CREATE TABLE IF NOT EXISTS obsidian_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'documentation',
  tags TEXT[] DEFAULT '{}',
  project TEXT,
  file_path TEXT,
  frontmatter JSONB DEFAULT '{}',
  links TEXT[] DEFAULT '{}',
  backlinks TEXT[] DEFAULT '{}',
  created TIMESTAMP WITH TIME ZONE DEFAULT now(),
  modified TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, title, project)
);

-- Create knowledge graph table
CREATE TABLE IF NOT EXISTS obsidian_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_title TEXT NOT NULL,
  node_type TEXT,
  importance DECIMAL(3,2) DEFAULT 1.0,
  connections INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, node_id)
);

-- Create graph edges table
CREATE TABLE IF NOT EXISTS obsidian_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_node TEXT NOT NULL,
  target_node TEXT NOT NULL,
  edge_type TEXT DEFAULT 'link',
  weight DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, source_node, target_node)
);

-- Add RLS policies
ALTER TABLE obsidian_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE obsidian_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE obsidian_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE obsidian_edges ENABLE ROW LEVEL SECURITY;

-- Sync status policies
CREATE POLICY "Users can view own sync status" ON obsidian_sync_status
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sync status" ON obsidian_sync_status
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync status" ON obsidian_sync_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view own notes" ON obsidian_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes" ON obsidian_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON obsidian_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON obsidian_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Graph policies
CREATE POLICY "Users can view own graph" ON obsidian_graph
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own graph" ON obsidian_graph
  FOR ALL USING (auth.uid() = user_id);

-- Edges policies
CREATE POLICY "Users can view own edges" ON obsidian_edges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own edges" ON obsidian_edges
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_obsidian_notes_user_project ON obsidian_notes(user_id, project);
CREATE INDEX idx_obsidian_notes_type ON obsidian_notes(type);
CREATE INDEX idx_obsidian_notes_modified ON obsidian_notes(modified DESC);
CREATE INDEX idx_obsidian_graph_user_node ON obsidian_graph(user_id, node_id);
CREATE INDEX idx_obsidian_edges_source ON obsidian_edges(user_id, source_node);
CREATE INDEX idx_obsidian_edges_target ON obsidian_edges(user_id, target_node);

-- Create function to update modified timestamp
CREATE OR REPLACE FUNCTION update_obsidian_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating modified timestamp
CREATE TRIGGER update_obsidian_notes_modified
  BEFORE UPDATE ON obsidian_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_obsidian_modified();