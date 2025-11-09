# Sentry Navigation Cloud

An interactive hashtag cloud visualization component that demonstrates how navigation hierarchies can be visualized as interactive hashtag clouds, using Sentry's navigation structure as a real-world example.

## Overview

The SentryNavigationCloud component organizes Sentry's navigation items into an interactive bubble cloud visualization where:
- **Size** indicates popularity and usage frequency
- **Color** represents different categories (Platform=red, Solutions=blue, About=green, Help=yellow/orange)
- **Position** follows a spiral algorithm with important items toward the center
- **Interactive elements** allow clicking to navigate and hovering for details

## Features

- **Real-time Analytics**: Tracks usage patterns and trending scores
- **Category Filtering**: Filter by Platform, Solutions, About, or Help categories
- **Interactive Navigation**: Click items to navigate (demo shows alert with URL)
- **Hover Tooltips**: Detailed information on hover
- **Responsive Design**: Bubble positioning adapts to container size
- **Visual Indicators**: New features (✨) and featured items (⭐)

## Database Schema

The component uses three main tables in Supabase:

### `sentry_navigation_items`
Core navigation data with cloud visualization fields:
- Basic info: `name`, `category`, `description`, `url`
- Popularity: `popularity_score`, `usage_frequency`
- Cloud visual: `cloud_position_x`, `cloud_position_y`, `cloud_size`, `color_code`
- Status: `is_featured`, `is_new`

### `sentry_navigation_categories`
Category definitions with color themes:
- `name`, `display_name`, `color_code`, `icon`

### `sentry_navigation_usage`
Real-time usage tracking:
- `navigation_item_id`, `user_session`, `action`, `context`

## Setup & Migration

1. **Run the migration:**
```bash
# Apply the migration to create the tables and seed data
supabase migration up
```

2. **Verify the data:**
```sql
-- Check seeded navigation items
SELECT name, category, popularity_score, color_code FROM sentry_navigation_items ORDER BY popularity_score DESC;

-- View cloud data with calculated metrics
SELECT * FROM sentry_navigation_cloud LIMIT 10;
```

## Usage

### Basic Usage
```tsx
import { SentryNavigationCloud } from './components/SentryNavigationCloud';

<SentryNavigationCloud
  width={1000}
  height={600}
  showCategories={true}
  interactive={true}
/>
```

### Advanced Configuration
```tsx
<SentryNavigationCloud
  // Filter to specific category
  category="platform"

  // Show only featured items
  featuredOnly={true}

  // Custom event handlers
  onItemClick={(item) => {
    // Navigate to item.url or handle custom navigation
    window.location.href = item.url;
  }}

  onItemHover={(item) => {
    // Custom hover analytics or UI updates
    console.log('Hovering:', item?.name);
  }}

  // Layout configuration
  width={1200}
  height={800}
  maxItems={30}

  // UI options
  showCategories={false}
  interactive={false} // Read-only mode
/>
```

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `category` | `SentryNavigationCategory` | `undefined` | Filter to specific category |
| `featuredOnly` | `boolean` | `false` | Show only featured items |
| `onItemClick` | `function` | `undefined` | Custom click handler |
| `onItemHover` | `function` | `undefined` | Custom hover handler |
| `maxItems` | `number` | `50` | Maximum items to display |
| `width` | `number` | `1000` | Cloud container width |
| `height` | `number` | `600` | Cloud container height |
| `showCategories` | `boolean` | `true` | Show category filter buttons |
| `interactive` | `boolean` | `true` | Enable interactions |

## Navigation Categories

### Platform (Red Theme)
Core monitoring and development tools:
- Error Monitoring, Tracing, Session Replay
- Profiling, Logs, Uptime Monitoring
- Seer (AI), Cron Monitoring, Integrations

### Solutions (Blue Theme)
Industry-specific applications:
- Web/Frontend, Mobile, Gaming
- AI Observability, APM, RUM
- Ecommerce, Enterprise

### About (Green Theme)
Company information:
- About, Blog, Careers
- Contact Us, Trust & Security

### Get Help (Yellow/Orange Theme)
Support and resources:
- Documentation, Help Center
- Status, Developer Resources

## Cloud Positioning Algorithm

The component uses an intelligent positioning algorithm:

1. **Importance Calculation**: `popularityScore + (usageToday * 10) + (usageWeek * 2)`
2. **Spiral Distribution**: Items arranged in golden ratio spiral (137.5° increments)
3. **Center Weighting**: Most important items positioned near center
4. **Jitter**: Small randomization prevents perfect alignment
5. **Boundary Respect**: Items constrained within container bounds

## Analytics & Tracking

### Real-time Usage Tracking
```sql
-- Track a navigation click
SELECT track_sentry_navigation_usage('Error Monitoring', 'session-123', 'click', 'category:platform');

-- View trending items
SELECT name, calculated_trending_score, usage_today, usage_week
FROM sentry_navigation_cloud
ORDER BY calculated_trending_score DESC;
```

### Usage Analytics
The component automatically tracks:
- **Views**: Items appearing in the cloud
- **Hovers**: User hover interactions
- **Clicks**: Navigation interactions

## Integration Patterns

### With Existing Hashtag System
The SentryNavigationCloud follows the same patterns as the main hashtag cloud:
- Uses Supabase for data storage
- Implements real-time analytics
- Follows cloud positioning algorithms
- Supports interactive features

### Extending to Other Navigation Systems
This pattern can be applied to any navigation hierarchy:

1. **Create similar tables** with your navigation data
2. **Update the TypeScript types** for your domain
3. **Customize the color themes** and categories
4. **Adjust the positioning algorithm** as needed

## Performance Considerations

- **Debounced positioning**: Prevents excessive re-calculations
- **Memoized sorting**: Caches importance calculations
- **Indexed queries**: Database indexes on key fields
- **Usage batching**: Analytics updates are batched for performance

## Demo Access

The component is available in the app navigation under:
**Gallery → Content Gallery → Sentry Navigation Cloud**

This demonstrates how traditional navigation menus can be reimagined as interactive, data-driven visualizations that provide insights into usage patterns while maintaining usability.