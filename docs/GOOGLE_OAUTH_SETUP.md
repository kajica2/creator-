# Google OAuth Setup Instructions

## Required Redirect URIs for Supabase Authentication

### Production Environment
```
https://lhgwnrwwhaalojdpkwuo.supabase.co/auth/v1/callback
```

### Development Environment
```
http://localhost:3000/auth/v1/callback
http://localhost:3006/auth/v1/callback
```

### Vercel Production (Alternative)
```
https://viral-hashtag-image-ot5vhy1wh-kai-djurics-projects.vercel.app/auth/v1/callback
```

## Step-by-Step Setup

### 1. Access Google Cloud Console
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Select the project you're using for OAuth
- Navigate to **APIs & Services** → **Credentials**

### 2. Configure OAuth 2.0 Client
- Open your existing OAuth 2.0 Client ID
- In the **Authorized redirect URIs** section, add all required URIs:
  - Supabase production URI
  - Local development URIs
  - Vercel production URI (if needed)

### 3. Save Changes
- Click **Save** to apply the changes
- Changes may take a few minutes to propagate

### 4. Verify Configuration
- Test the OAuth flow in your application
- Ensure the redirect URIs match exactly (including http/https)

## Troubleshooting

### Common Issues
1. **Redirect URI mismatch**: Ensure the URI in your app matches exactly what's configured in Google Cloud Console
2. **HTTP vs HTTPS**: Development uses HTTP, production uses HTTPS
3. **Port numbers**: Verify correct port numbers (3000, 3006, etc.)

### Testing Steps
1. Try logging in with Google OAuth
2. Check browser console for any redirect errors
3. Verify Supabase authentication logs
4. Test with different environments (local vs production)

## Environment Variables
Make sure your `.env` or `.env.local` file includes:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
GOOGLE_CLIENT_ID=176960048944-j40r4l900qsef8aekqbg28fummvfcvj7.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=176960048944-j40r4l900qsef8aekqbg28fummvfcvj7.apps.googleusercontent.com
```

**Note**: The `GOOGLE_CLIENT_ID` is used by Vite build configuration, while `VITE_GOOGLE_CLIENT_ID` is exposed to client-side code.

## Support
If issues persist, check:
- Supabase project settings
- Google Cloud Console quotas and restrictions
- Browser security settings
- Network/firewall configurations