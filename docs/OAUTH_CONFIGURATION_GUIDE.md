# OAuth Configuration Guide

## Problem
Getting error: `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`

This means Google OAuth is not enabled in your Supabase project.

## Solution Steps

### 1. Supabase Dashboard Configuration

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/lhgwnrwwhaalojdpkwuo
2. **Navigate to Authentication**: Click "Authentication" in the left sidebar
3. **Go to Auth Providers**: Click "Settings" → "Auth Providers"
4. **Enable Google OAuth**:
   - Toggle the "Google" provider to "Enabled"
   - Fill in the required fields:

### 2. Google OAuth Client Configuration

Your current Google OAuth Client ID from `.env`:
```
VITE_GOOGLE_CLIENT_ID=1041032449676-8k9r3v9m4f2h1q6n7p0s2l5j8d4c6g9e.apps.googleusercontent.com
```

**You need to add the Client Secret to Supabase:**

1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Select project: `viral-hashtag-image-ai`
3. Find the OAuth 2.0 Client ID: `1041032449676-8k9r3v9m4f2h1q6n7p0s2l5j8d4c6g9e.apps.googleusercontent.com`
4. Copy the Client Secret
5. Add both to Supabase:
   - **Client ID**: `1041032449676-8k9r3v9m4f2h1q6n7p0s2l5j8d4c6g9e.apps.googleusercontent.com`
   - **Client Secret**: [Get from Google Cloud Console]

### 3. Redirect URLs Configuration

#### In Supabase (Authentication → Settings → URL Configuration):
- **Site URL**: `https://viral-hashtag-image-kx4vwmfj2-kai-djurics-projects.vercel.app`
- **Redirect URLs**:
  ```
  https://viral-hashtag-image-kx4vwmfj2-kai-djurics-projects.vercel.app/auth/callback
  http://localhost:3000/auth/callback
  ```

#### In Google Cloud Console (OAuth Client → Authorized redirect URIs):
```
https://lhgwnrwwhaalojdpkwuo.supabase.co/auth/v1/callback
http://localhost:54321/auth/v1/callback
```

### 4. Environment Variables Check

Ensure these are set in your `.env`:
```bash
VITE_SUPABASE_URL=https://lhgwnrwwhaalojdpkwuo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_CLIENT_ID=1041032449676-8k9r3v9m4f2h1q6n7p0s2l5j8d4c6g9e.apps.googleusercontent.com
```

## Testing

After configuration:

1. **Test Local Development**:
   ```bash
   npm run dev
   ```
   Try Google OAuth at: http://localhost:3000?app=true

2. **Test Production**:
   Try Google OAuth at: https://viral-hashtag-image-kx4vwmfj2-kai-djurics-projects.vercel.app?app=true

## Troubleshooting

- **Error 400**: Provider not enabled → Check Supabase Auth Providers
- **Error 401**: Invalid credentials → Check Client ID/Secret match
- **Redirect mismatch**: Update redirect URLs in both Google and Supabase
- **CORS issues**: Ensure Site URL is correct in Supabase

## Current Status

✅ Client-side OAuth code is implemented
❌ Supabase OAuth provider not enabled
❌ Google OAuth credentials not configured
❌ Redirect URLs may need adjustment

## Next Steps

1. Enable Google OAuth provider in Supabase dashboard
2. Configure Google OAuth credentials
3. Update redirect URLs
4. Test authentication flow
5. Deploy and verify production setup