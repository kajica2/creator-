<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1WnQEJuk1lYs_egkuF_GN3-Pg7vYuRy1e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env.local` file with your Supabase and database credentials. At minimum you need:

   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   GOOGLE_CLIENT_ID=176960048944-j40r4l900qsef8aekqbg28fummvfcvj7.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_ID=176960048944-j40r4l900qsef8aekqbg28fummvfcvj7.apps.googleusercontent.com
   POSTGRES_URL=postgres_connection_string
   POSTGRES_URL_NON_POOLING=postgres_direct_connection_string
   POSTGRES_PRISMA_URL=postgres_pgbouncer_connection_string
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres_password
   POSTGRES_DATABASE=postgres
   POSTGRES_HOST=postgres_host
   SUPABASE_JWT_SECRET=jwt_secret_from_settings
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Update the values to match your Supabase project (see `.env.local` for the full example provided by the project owner).
3. Run the app:
   `npm run dev`

## Supabase Auth & API Access

- The app now uses Supabase OAuth (Google) for authentication. The `Sign in with Google` button will redirect through Supabase and persist the session locally.
- Authenticated requests automatically refresh the session and expose the Supabase user via the global auth context (`useSupabaseAuth`).
- Serverless API routes (e.g. `/api/scrape-url`) require a valid `Authorization: Bearer <access_token>` header. The client-side helper in `api/generate-hashtags-from-url.ts` injects the token from the current session.

## Batch Media Context Import

The `Batch Import` button in the app header opens a new workflow that accepts a `.zip` bundle of media assets (images, documents, audio, video) and converts them into RAG-ready context entries.

### How it works

1. Upload an archive containing hundreds of creatives—images, mockups, marketing PDFs, etc.
2. (Optional) Provide a company URL, collection name, and notes. These are added to the AI prompt and stored alongside every asset.
3. On upload the serverless route `/api/batch-media-import`:
   - Validates the session via Supabase and streams the archive.
   - Extracts each file, infers content type, and computes checksums and dimensions.
   - Sends supported assets (currently images and text-based documents) to Gemini for structured tagging (summary, logos, objects, on-image text, dominant colours).
   - Builds a plain-text context block for each asset so the generators can immediately consume them.
   - Persists metadata in the new `media_assets` Supabase table for future retrieval.
4. The UI receives the processed sources, previews the first few results, and injects them into the active RAG context.

### Requirements

- Set `GEMINI_API_KEY` (or `VITE_GEMINI_API_KEY`) so the analyzer can call Gemini.
- Run `npm install` after pulling to pick up the new dependencies:
  - `formidable`, `file-type`, `image-size`, `mime-types`.
- Apply the migration `supabase/migrations/007_create_media_assets.sql` to add the storage table.

### Limitations & roadmap

- Non-image binary formats (audio/video) are currently catalogued but skipped from AI tagging; future iterations will add transcription hooks.
- Images larger than 1 MB are imported without embedding the base64 preview to keep the UI performant.
- Adjustable concurrency and retry behaviour can be configured later if we observe Gemini rate limits.

## Manual Test Plan

1. Start the dev server and sign in via the header `Sign in with Google` button. Confirm the avatar and name appear.
2. Open the URL Hashtag Generator tool, enter a valid URL, and verify a Supabase-authenticated request succeeds (check the network request includes an `Authorization` header and the response populates hashtag sets).
3. Sign out and attempt the same request—confirm the UI blocks generation and reports that sign-in is required.
4. (Optional) Inspect `/api/scrape-url` responses in your deployment logs to ensure unauthorized requests are rejected with HTTP 401.
# creator-
