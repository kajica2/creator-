# Binary Ring Content Management System

A comprehensive Supabase-based content management system for the Binary Ring generative art project collection. This system provides structured storage, versioning, search capabilities, and dynamic content management for all text content.

## Features

### 🗄️ **Structured Content Storage**
- Hierarchical content organization with types and categories
- Multi-language support with fallback mechanisms
- Flexible metadata storage using JSONB

### 📝 **Version Control**
- Complete edit history for all content changes
- Rollback capabilities to previous versions
- Change tracking with author attribution
- Approval workflows for content publishing

### 🔍 **Advanced Search**
- Full-text search across all content using PostgreSQL's search vectors
- Fuzzy search for approximate matching using trigrams
- Category and tag-based filtering
- Search analytics and usage tracking

### 🏗️ **Content Management**
- CRUD operations for projects, collections, and content
- Bulk import/export functionality
- Content validation and schema enforcement
- Materialized views for fast content access

### 🔒 **Security & Performance**
- Row Level Security (RLS) for data protection
- Optimized database indexes for fast queries
- Caching through materialized views
- Public read access with controlled write permissions

## Database Schema

### Core Tables

#### `text_content`
Stores all text content with versioning support:
```sql
- id (UUID) - Primary key
- project_id (UUID) - Reference to projects
- content_type_id (UUID) - Type of content
- key (TEXT) - Content identifier (e.g., 'title', 'description')
- value (TEXT) - The actual content
- language_code (TEXT) - Language (default: 'en')
- version (INTEGER) - Version number
- is_current (BOOLEAN) - Current version flag
- is_published (BOOLEAN) - Publication status
```

#### `content_versions`
Tracks all content changes:
```sql
- id (UUID) - Primary key
- content_id (UUID) - Reference to text_content
- version_number (INTEGER) - Version sequence
- previous_value (TEXT) - Old content
- new_value (TEXT) - New content
- change_type (TEXT) - create/update/delete/restore
- changed_by (UUID) - Author of change
```

#### `technical_details`
Stores technical specifications:
```sql
- id (UUID) - Primary key
- project_id (UUID) - Reference to projects
- algorithm_description (TEXT) - Algorithm details
- complexity_analysis (TEXT) - Performance analysis
- parameters (JSONB) - Configuration parameters
- requirements (JSONB) - System requirements
```

#### `project_collections`
Organizes projects into curated collections:
```sql
- id (UUID) - Primary key
- key (TEXT) - Unique identifier
- title (TEXT) - Display title
- description (TEXT) - Collection description
- featured (BOOLEAN) - Featured status
```

## Installation & Setup

### 1. Database Migration

Run the migration script in your Supabase SQL editor:

```sql
-- Execute this in Supabase SQL editor
-- File: migrations/005_text_content_migration.sql
```

This will create:
- All necessary tables and indexes
- Search functionality and triggers
- Row Level Security policies
- Initial content types and categories

### 2. Environment Setup

Create a `.env` file with your Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Data Migration

Migrate existing content from JSON files:

```bash
# Install dependencies
npm install @supabase/supabase-js

# Run migration script
node migrate-content-data.js
```

## Usage

### Content Manager Class

```javascript
import ContentManager from './content-manager.js';

const contentManager = new ContentManager(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);
```

### Basic Operations

#### Retrieve Content
```javascript
// Get all content for a project
const projectContent = await contentManager.getProjectContent('project-id');

// Get specific content with language fallback
const title = await contentManager.getContent('project-id', 'title', 'en');

// Get all projects with content
const allProjects = await contentManager.getAllProjectsWithContent();
```

#### Create/Update Content
```javascript
// Set individual content
await contentManager.setContent(
    'project-id',
    'description',
    'New project description',
    'en', // language
    { author: 'user-id' } // metadata
);

// Bulk import content
await contentManager.importProjectContent('project-id', {
    title: 'Project Title',
    description: 'Project description',
    long_description: 'Detailed description...',
    technical_algorithm: 'Algorithm description'
});
```

#### Search Content
```javascript
// Full-text search
const results = await contentManager.searchContent('fractal mandelbrot', {
    projectFilter: null, // optional project filter
    language: 'en',
    limit: 20
});

// Fuzzy search
const fuzzyResults = await contentManager.fuzzySearch(
    'buddahbrot', // misspelled query
    0.3, // similarity threshold
    10   // limit
);

// Filter projects
const filteredProjects = await contentManager.searchProjects({
    category: 'fractals',
    isNew: true,
    search: 'interactive'
});
```

### Advanced Features

#### Version Management
```javascript
// Get content history
const versions = await contentManager.getContentVersions('content-id');

// Restore previous version
await contentManager.restoreContentVersion('content-id', 3);
```

#### Collections Management
```javascript
// Get all collections
const collections = await contentManager.getCollections(true); // featured only

// Add project to collection
await contentManager.addProjectToCollection(
    'collection-id',
    'project-id',
    0 // display order
);
```

#### Technical Details
```javascript
// Get technical specifications
const techDetails = await contentManager.getTechnicalDetails('project-id');

// Update technical details
await contentManager.updateTechnicalDetails('project-id', {
    algorithm_description: 'Updated algorithm description',
    complexity_analysis: 'O(n²) complexity with optimizations',
    performance_metrics: {
        renderTime: 'Real-time',
        maxResolution: '4K'
    }
});
```

## Search Functionality

### Full-Text Search

The system uses PostgreSQL's built-in full-text search with English language support:

```sql
-- Search across all content
SELECT * FROM search_content('fractal buddha', NULL, NULL, 'en');

-- Project search vectors are automatically updated
SELECT * FROM projects WHERE search_vector @@ plainto_tsquery('english', 'interactive');
```

### Fuzzy Search

Uses trigram similarity for approximate matching:

```sql
-- Find content similar to query (handles typos)
SELECT * FROM fuzzy_search_content('buddahbrot', 0.3);
```

### Search Analytics

Track search usage:

```sql
-- View search analytics
SELECT search_query, COUNT(*), AVG(results_count)
FROM search_analytics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY search_query
ORDER BY COUNT(*) DESC;
```

## Performance Optimizations

### Indexes

The system creates optimized indexes for:
- Content lookup by project and key
- Full-text search vectors
- Trigram similarity matching
- Version queries

### Materialized Views

Fast content access through `project_content_summary`:

```sql
-- Refresh materialized view
SELECT refresh_project_content_summary();

-- Query optimized view
SELECT * FROM project_content_summary WHERE category = 'fractals';
```

### Caching Strategy

1. **Application Level**: Cache frequently accessed content
2. **Database Level**: Materialized views for complex queries
3. **CDN Level**: Cache static content exports

## Security Model

### Row Level Security

- **Public Read**: Published content is publicly accessible
- **Authenticated Write**: Content creation requires authentication
- **Admin Access**: Full access to all content and versions

### Content Approval

Optional approval workflow:
```javascript
// Mark content for approval
await contentManager.setContent(projectId, key, value, 'en', {
    requires_approval: true,
    submitted_by: 'user-id'
});

// Approve content (admin only)
await contentManager.supabase
    .from('content_versions')
    .update({
        approved_by: 'admin-id',
        approved_at: new Date().toISOString()
    })
    .eq('id', versionId);
```

## Backup & Migration

### Export All Content

```javascript
// Create complete backup
const backup = await contentManager.exportAllContent();

// Save to file
fs.writeFileSync('backup.json', JSON.stringify(backup, null, 2));
```

### Import from Backup

```javascript
// Restore from backup
const backupData = JSON.parse(fs.readFileSync('backup.json', 'utf-8'));
await contentManager.importFromBackup(backupData);
```

## API Integration

### REST API Endpoints

The content can be accessed via Supabase's auto-generated REST API:

```bash
# Get project content
GET /rest/v1/project_content_summary?project_id=eq.PROJECT_ID

# Search content
POST /rest/v1/rpc/search_content
{
  "search_query": "fractal",
  "project_filter": null,
  "language_filter": "en"
}

# Get collections
GET /rest/v1/project_collections?select=*,project_collection_items(*)
```

### GraphQL Support

Supabase also provides GraphQL access to all tables and functions.

## Monitoring & Analytics

### Content Analytics

```javascript
// Get content statistics
const analytics = await contentManager.getContentAnalytics();

// Search usage patterns
const searchStats = await contentManager.supabase
    .from('search_analytics')
    .select('search_query, COUNT(*)', { count: 'exact' })
    .group('search_query');
```

### Performance Monitoring

Monitor database performance:

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;

-- Monitor search performance
EXPLAIN ANALYZE SELECT * FROM search_content('fractal buddha');
```

## Troubleshooting

### Common Issues

1. **Search Not Working**: Ensure search vectors are updated
   ```sql
   -- Manually update search vectors
   UPDATE projects SET search_vector = to_tsvector('english',
       COALESCE(display_name, '') || ' ' ||
       COALESCE(description, '') || ' ' ||
       COALESCE(category, '')
   );
   ```

2. **Slow Queries**: Check index usage and refresh materialized views
   ```sql
   REFRESH MATERIALIZED VIEW project_content_summary;
   ```

3. **Version Conflicts**: Ensure version triggers are working
   ```sql
   -- Check trigger exists
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_content_versioning';
   ```

### Debug Mode

Enable detailed logging:

```javascript
const contentManager = new ContentManager(url, key);
contentManager.debug = true; // Enable debug logging
```

## Contributing

1. **Schema Changes**: Add new migrations in numbered order
2. **Content Types**: Add new types to `content_types` table
3. **Search Enhancement**: Extend search functions for new requirements
4. **Performance**: Monitor query performance and add indexes as needed

## License

This content management system is part of the Binary Ring project. See the main project LICENSE for details.