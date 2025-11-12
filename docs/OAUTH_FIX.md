# Supabase Google OAuth 404 Error - Fix Guide

## Problem
You're receiving a 404 error when trying to authenticate with Google OAuth:
```
https://lhgwnrwwhaalojdpkwuo.supabase.com/auth/v1/authorize?provider=google...
```

## Quick Fix Steps

### 1. Verify Supabase Project URL

**CRITICAL**: Your URL uses `.supabase.com` but it should be `.supabase.co`

Update your `.env` file:
```bash
# WRONG:
VITE_SUPABASE_URL=https://lhgwnrwwhaalojdpkwuo.supabase.com

# CORRECT:
VITE_SUPABASE_URL=https://lhgwnrwwhaalojdpkwuo.supabase.co
```

### 2. Update Vercel Environment Variables

1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Update `VITE_SUPABASE_URL` to use `.supabase.co`
3. Redeploy your application

### 3. Configure Google OAuth in Supabase

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Providers** → **Google**
3. Enable Google provider
4. Add your Google OAuth credentials:
   - Client ID (from Google Cloud Console)
   - Client Secret (from Google Cloud Console)

### 4. Configure Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit your OAuth 2.0 Client
3. Add Authorized redirect URIs:
```
https://lhgwnrwwhaalojdpkwuo.supabase.co/auth/v1/callback
https://reamp-sooty.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

4. Add Authorized JavaScript origins:
```
https://reamp-sooty.vercel.app
http://localhost:3000
```

### 5. Update Supabase Site URL

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://reamp-sooty.vercel.app`
- Redirect URLs:
  - `https://reamp-sooty.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

## Immediate Action Required

1. **Fix the `.supabase.com` → `.supabase.co` issue in your environment variables**
2. **Redeploy on Vercel after updating the environment variable**

This should resolve your 404 error immediately.