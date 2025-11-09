# Hashtag Cloud Visualization System

## Overview

The Hashtag Cloud System provides an interactive visualization of hashtags based on their popularity, trending metrics, and usage patterns. It integrates seamlessly with the existing hashtag management components and includes real-time updates from Supabase.

## Features

### 🎨 Visual Cloud Layout
- Dynamic positioning based on hashtag importance
- Size-based color coding and typography
- Interactive hover and selection states
- Responsive design for different screen sizes

### 📊 Analytics & Trending
- Real-time trending score calculation
- Usage frequency tracking
- Historical analytics (daily, weekly, monthly)
- Session-based usage tracking

### 🔄 Real-time Updates
- Live hashtag usage tracking
- Automatic cloud refresh on data changes
- WebSocket-based subscriptions via Supabase

### 🎛️ Advanced Filtering
- Search by hashtag name
- Filter by size categories
- Show trending-only mode
- Category-based filtering
- Minimum frequency thresholds

## Components

### HashtagCloud Component

The main visualization component that renders hashtags in a cloud layout.

```typescript
import HashtagCloud from './components/HashtagCloud';

<HashtagCloud
  selectedHashtags={selectedHashtags}
  onHashtagSelect={handleHashtagSelect}
  searchTerm={searchTerm}
  selectedSizes={selectedSizes}
  showTrendingOnly={true}
  maxHashtags={150}
  sortBy="trending"
  className="min-h-96"
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `selectedHashtags` | `Set<string>` | Currently selected hashtag names |
| `onHashtagSelect` | `(name: string) => void` | Callback when hashtag is clicked |
| `searchTerm` | `string` | Filter hashtags by search term |
| `selectedSizes` | `Set<HashtagSize>` | Show only hashtags of selected sizes |
| `categoryFilter` | `string` | Filter by category name |
| `maxHashtags` | `number` | Maximum number of hashtags to display |
| `minFrequency` | `number` | Minimum usage frequency threshold |
| `showTrendingOnly` | `boolean` | Show only trending hashtags |
| `sortBy` | `'trending' \| 'frequency' \| 'popularity'` | Sort criteria |

### Integration with HashtagManager

The cloud view is integrated into the existing HashtagManager with a new "Cloud View" tab:

```typescript
// The cloud view is automatically available in HashtagManager
<HashtagManager
  // ... existing props
/>
```

## Database Schema

### New Tables

#### hashtag_usage
Tracks individual hashtag usage events for analytics.

```sql
CREATE TABLE hashtag_usage (
  id UUID PRIMARY KEY,
  hashtag_id UUID REFERENCES hashtags(id),
  user_session TEXT,
  context TEXT, -- 'selection', 'search', 'generation', 'cloud_selection'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enhanced hashtags Table

New fields added to support cloud visualization:

```sql
ALTER TABLE hashtags ADD COLUMN
  frequency INTEGER DEFAULT 0,
  trending_score NUMERIC DEFAULT 0,
  cloud_position_x NUMERIC,
  cloud_position_y NUMERIC,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  trending_velocity NUMERIC DEFAULT 0;
```

### Views and Functions

#### hashtag_trending View
Real-time view calculating trending metrics:

```sql
-- Provides calculated trending scores based on recent usage
SELECT * FROM hashtag_trending;
```

#### get_hashtag_cloud_data Function
Optimized function to fetch cloud data with filters:

```sql
SELECT * FROM get_hashtag_cloud_data(
  category_filter := 'Content Creation',
  limit_count := 100,
  min_frequency := 1
);
```

#### track_hashtag_usage Function
Function to track hashtag usage:

```sql
SELECT track_hashtag_usage(
  hashtag_name := '#example',
  session_id := 'session123',
  usage_context := 'cloud_selection'
);
```

## Services

### HashtagCloudService

Service class for managing hashtag cloud data and operations.

```typescript
import { hashtagCloudService } from './utils/hashtagCloudService';

// Fetch cloud data
const cloudData = await hashtagCloudService.getHashtagCloudData({
  categoryFilter: 'Content Creation',
  limit: 100,
  showTrendingOnly: true
});

// Track usage
await hashtagCloudService.trackHashtagUsage({
  hashtag_name: '#example',
  session_id: 'session123',
  context: 'cloud_selection'
});

// Get trending hashtags
const trending = await hashtagCloudService.getTrendingHashtags(20);

// Subscribe to real-time updates
const subscription = hashtagCloudService.subscribeToHashtagUpdates((payload) => {
  // Handle real-time updates
});
```

### Utility Functions

#### Layout Calculation
```typescript
import { calculateOptimalLayout } from './utils/hashtagCloudUtils';

const layoutData = calculateOptimalLayout(hashtags, containerWidth, containerHeight);
```

#### Analytics
```typescript
import { generateCloudAnalytics } from './utils/hashtagCloudUtils';

const analytics = generateCloudAnalytics(hashtags);
// Returns: totalHashtags, trendingCount, topCategory, etc.
```

## Automated Cloud Generation

The scheduler in `utils/hashtagCloudAutomation.ts` produces curated clouds that can be toggled alongside the live feed.

- Persisted in `automated_tag_clusters`
- Segments defined via `listAutomationSegments()` (`global`, `content-creators`, `audio`, `video`, `ai-trending`)
- Scheduler worker: `TagCloudAutomationAgent` or `runTagCloudAutomationCycle`

### UI Toggle

`HashtagCloud.tsx` now exposes a live/automated toggle with segment selection. When `Automated` is selected, the component loads the latest entry from `automated_tag_clusters` and displays generation metadata.

```tsx
<HashtagCloud
  selectedHashtags={selected}
  onHashtagSelect={setSelected}
  // toggle the data source
/>
```

### Supabase Queue

```sql
select * from automated_tag_clusters
where segment_key = 'global'
order by generated_at desc
limit 1;
```

## Setup and Migration

### 1. Run Database Migration

```bash
# Apply the new hashtag cloud schema
supabase db push
```

### 2. Update Environment

Ensure your Supabase environment variables are set:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Initialize Data

The migration includes initial data setup with sample cloud positions and trending scores.

## Usage Examples

### Basic Cloud View

```typescript
const [selectedHashtags, setSelectedHashtags] = useState(new Set<string>());

const handleHashtagSelect = (name: string) => {
  const newSelected = new Set(selectedHashtags);
  if (newSelected.has(name)) {
    newSelected.delete(name);
  } else {
    newSelected.add(name);
  }
  setSelectedHashtags(newSelected);
};

return (
  <HashtagCloud
    selectedHashtags={selectedHashtags}
    onHashtagSelect={handleHashtagSelect}
  />
);
```

### Advanced Filtering

```typescript
const [filters, setFilters] = useState({
  searchTerm: '',
  selectedSizes: new Set(Object.values(HashtagSize)),
  showTrendingOnly: false,
  categoryFilter: undefined
});

return (
  <HashtagCloud
    selectedHashtags={selectedHashtags}
    onHashtagSelect={handleHashtagSelect}
    searchTerm={filters.searchTerm}
    selectedSizes={filters.selectedSizes}
    showTrendingOnly={filters.showTrendingOnly}
    categoryFilter={filters.categoryFilter}
    maxHashtags={200}
    sortBy="trending"
  />
);
```

### With Analytics

```typescript
import { generateCloudAnalytics } from './utils/hashtagCloudUtils';

const [analytics, setAnalytics] = useState(null);

useEffect(() => {
  hashtagCloudService.getHashtagCloudData().then(data => {
    const analyticsData = generateCloudAnalytics(data);
    setAnalytics(analyticsData);
  });
}, []);

return (
  <div>
    {analytics && (
      <div className="mb-4 p-4 bg-gray-800 rounded-lg">
        <h3>Cloud Analytics</h3>
        <p>Total Hashtags: {analytics.totalHashtags}</p>
        <p>Trending: {analytics.trendingCount}</p>
        <p>Top Category: {analytics.topCategory}</p>
      </div>
    )}
    <HashtagCloud {...props} />
  </div>
);
```

## Performance Considerations

### Optimization Features

1. **Debounced Updates**: Real-time subscriptions are debounced to prevent excessive refreshes
2. **Efficient Layout**: Smart collision detection with spatial optimization
3. **Lazy Loading**: Components load data progressively
4. **Memoization**: Heavy calculations are memoized
5. **Indexed Queries**: Database queries use optimized indexes

### Recommended Settings

- **maxHashtags**: 50-150 for optimal performance
- **minFrequency**: 1-5 to filter low-usage hashtags
- **Real-time updates**: Enable for active sessions, disable for archived data

## Customization

### Styling

The cloud uses CSS-in-JS with Tailwind classes. Customize through:

```typescript
// Custom size colors
const customSizeColorMap = {
  [HashtagSize.Mega]: 'text-yellow-400 hover:text-yellow-300',
  [HashtagSize.Large]: 'text-red-400 hover:text-red-300',
  // ... etc
};

// Custom layout configuration
const customLayoutConfig = {
  spiralTightness: 0.5,
  priorityZoneRadius: 60,
  collisionPadding: 15
};
```

### Layout Algorithms

Create custom layout algorithms by implementing the CloudLayoutConfig interface:

```typescript
const customLayout = (hashtags: HashtagCloudItem[], width: number, height: number) => {
  // Custom positioning logic
  return positioned_hashtags;
};
```

## Testing

Comprehensive test suite covering:

- Component rendering and interaction
- Integration with existing components
- Real-time subscription handling
- Database operations
- Utility function accuracy
- Error handling scenarios

Run tests:

```bash
npm test hashtag-cloud
```

## Troubleshooting

### Common Issues

1. **No hashtags displayed**
   - Check database connection
   - Verify migration ran successfully
   - Check console for API errors

2. **Real-time updates not working**
   - Verify Supabase realtime is enabled
   - Check network connectivity
   - Ensure proper subscription setup

3. **Performance issues**
   - Reduce maxHashtags limit
   - Increase minFrequency threshold
   - Check for memory leaks in subscriptions

4. **Layout collisions**
   - Increase container size
   - Adjust collision padding
   - Reduce number of displayed hashtags

### Debug Mode

Enable debug logging:

```typescript
// Add to your environment
VITE_DEBUG_HASHTAG_CLOUD=true
```

This provides detailed logging for:
- Layout calculations
- Database queries
- Real-time events
- Performance metrics

## Future Enhancements

- [ ] 3D cloud visualization
- [ ] Machine learning-based positioning
- [ ] Custom color themes
- [ ] Export cloud as image
- [ ] Advanced animation effects
- [ ] Multi-language support
- [ ] Voice interaction
- [ ] AR/VR compatibility

## API Reference

See the TypeScript definitions in the component files for complete API documentation:

- `components/HashtagCloud.tsx` - Main component interface
- `utils/hashtagCloudService.ts` - Service methods
- `utils/hashtagCloudUtils.ts` - Utility functions
- `types.ts` - Type definitions