# Supabase Database Setup

## Problem Identified
The application is falling back to local "ready sets" because the Supabase tables `hashtag_categories` and `ready_sets` don't exist in your database, causing HTTP 404 errors.

## Solution
I've created the necessary SQL migration files to create and seed the required tables:

### Migration Files Created:
1. **`001_create_hashtag_tables.sql`** - Creates the database schema with:
   - `hashtag_categories` table
   - `hashtags` table  
   - `ready_sets` table
   - Indexes and Row Level Security policies

2. **`002_seed_hashtag_data.sql`** - Seeds the tables with sample data:
   - 20 hashtag categories
   - 20 individual hashtags
   - 20 ready sets with curated hashtag collections

## How to Apply the Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Copy and paste the contents of `001_create_hashtag_tables.sql` and run it
5. Then copy and paste the contents of `002_seed_hashtag_data.sql` and run it

### Option 2: Supabase CLI
If you have the Supabase CLI installed:
```bash
# Apply the migrations
supabase db push

# Or apply specific files
supabase db reset
```

### Option 3: Direct Database Connection
You can also run the SQL directly via any PostgreSQL client connected to your Supabase database.

## Verification
After applying the migrations, the application should:
- ✅ Stop showing "Showing built-in ready sets while Supabase data is unavailable"
- ✅ Load hashtag categories and ready sets from Supabase
- ✅ No more 404 errors in the browser console

## Troubleshooting
If you still see issues after applying the migrations:

1. **Check table existence**: 
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('hashtag_categories', 'hashtags', 'ready_sets');
   ```

2. **Verify RLS policies**:
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

3. **Test data access**:
   ```sql
   SELECT * FROM hashtag_categories LIMIT 5;
   SELECT * FROM ready_sets LIMIT 5;
   ```

## Next Steps
Once the migrations are applied:
1. Restart your development server if needed
2. Refresh the application in your browser
3. Verify that hashtag data loads from Supabase
4. Deploy the updated application to production

The application will automatically detect when Supabase data is available and switch from local fallback to live database data.