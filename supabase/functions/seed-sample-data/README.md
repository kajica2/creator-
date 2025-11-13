# Seed Sample Data Edge Function

This Supabase Edge Function generates sample data for testing all AI tools in the application. It creates personas, generates content for each tool, and stores everything in the database.

## Usage

### Manual Trigger

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/seed-sample-data \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"userId": "optional-user-id"}'
```

### With User ID

If you provide a `userId`, the function will use that user. Otherwise, it creates a test user automatically.

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/seed-sample-data \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"userId": "00000000-0000-0000-0000-000000000000"}'
```

## What It Does

1. **Creates 5 Sample Personas**:
   - Cyberpunk Storyteller
   - Poetic Lyricist
   - Tech Strategist
   - Minimalist Artist
   - Ambient Composer

2. **Generates Content for Each Tool**:
   - AI Story
   - Suno Lyrics
   - Website Strategy
   - AI Skill Guide
   - Tensor Mutation
   - AI Concept
   - Text-to-Image
   - Batch Image Prompts
   - AI Website
   - Thinking Mode

3. **Stores in Database**:
   - Personas in `personas` table
   - Content in `persona_content` table
   - Links content to personas with proper relationships

## Response Format

The function returns a detailed execution report:

```json
{
  "startTime": "2024-01-01T00:00:00.000Z",
  "endTime": "2024-01-01T00:05:00.000Z",
  "duration": 300000,
  "totalTools": 50,
  "successful": 48,
  "failed": 2,
  "personasCreated": 5,
  "contentGenerated": 48,
  "results": [
    {
      "tool": "AI Story",
      "success": true,
      "contentId": "uuid",
      "personaId": "uuid"
    }
  ],
  "errors": []
}
```

## Environment Variables

Required environment variables (set in Supabase dashboard):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database operations
- `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY` - Gemini API key for content generation

## Notes

- The function uses the service role key to bypass RLS policies
- Content is generated using Gemini API with persona-specific contexts
- Hashtags are checked but not seeded (should be done via migrations)
- Each tool execution is wrapped in try-catch to prevent one failure from stopping the entire process

