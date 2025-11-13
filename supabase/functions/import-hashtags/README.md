# Import Hashtags Edge Function

This Supabase Edge Function imports hashtags into the database. It can generate and import up to 1000 hashtags across multiple categories.

## Usage

### Basic Import (300 hashtags)

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/import-hashtags \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Custom Count

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/import-hashtags \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"targetCount": 500}'
```

### Clear Existing and Import

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/import-hashtags \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"targetCount": 300, "clearExisting": true}'
```

## Parameters

- `targetCount` (optional, default: 300): Number of hashtags to import (1-1000)
- `clearExisting` (optional, default: false): Whether to clear existing hashtags before importing

## What It Does

1. **Generates Hashtags**: Creates hashtags across multiple categories:
   - Core Artform
   - Software & Tools
   - Aesthetic & Style
   - Themes & Concepts
   - Technology
   - And more...

2. **Creates Categories**: Automatically creates hashtag categories if they don't exist

3. **Imports to Database**: Inserts hashtags into the `hashtags` table with:
   - Name (with # prefix)
   - Display count (e.g., "100M+", "500k+")
   - Size (Mega, Large, Medium, Small, Micro)
   - Tags array
   - Popularity score
   - Related hashtags
   - Category relationship

4. **Skips Duplicates**: Automatically skips hashtags that already exist

## Response Format

```json
{
  "categoriesCreated": 5,
  "hashtagsImported": 300,
  "hashtagsSkipped": 0,
  "errors": [],
  "categoryIds": {
    "Core Artform": "uuid",
    "Software & Tools": "uuid"
  },
  "startTime": "2024-01-01T00:00:00.000Z",
  "endTime": "2024-01-01T00:01:00.000Z",
  "duration": 60000,
  "targetCount": 300,
  "success": true
}
```

## Environment Variables

Required environment variables (set in Supabase dashboard):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database operations

## Notes

- The function uses the service role key to bypass RLS policies
- Hashtags are generated with realistic counts, sizes, and popularity scores
- Duplicate hashtags are automatically skipped
- Categories are created automatically if they don't exist
- The function preserves existing hashtags unless `clearExisting` is true

