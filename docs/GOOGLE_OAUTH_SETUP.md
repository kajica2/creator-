# Google OAuth Authentication Setup Guide

## Overview
This application uses Supabase Authentication with Google OAuth provider for user authentication. The implementation is already complete and ready to use.

## Prerequisites

### 1. Supabase Project Setup
- Create a Supabase project at [supabase.com](https://supabase.com)
- Navigate to Authentication > Providers in your Supabase dashboard

### 2. Google Cloud Console Setup

#### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project

#### Step 2: Configure OAuth Consent Screen
1. Navigate to **APIs & Services > OAuth consent screen**
2. Select **External** user type (unless you need internal-only access)
3. Fill in the required fields:
   - App name: Your app name
   - User support email: Your email
   - Authorized domains: Add your domain (e.g., `your-app.vercel.app`)
   - Developer contact information: Your email
4. Add the following scopes:
   - `openid`
   - `email`
   - `profile`
5. Save and continue

#### Step 3: Create OAuth 2.0 Client ID
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application** as application type
4. Add authorized JavaScript origins:
   ```
   http://localhost:3000
   http://localhost:3001
   https://your-app-domain.com
   ```
5. Add authorized redirect URIs:
   ```
   https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   http://localhost:3001/auth/callback
   https://your-app-domain.com/auth/callback
   ```
6. Save and copy your **Client ID** and **Client Secret**

### 3. Configure Supabase

1. In Supabase Dashboard, go to **Authentication > Providers**
2. Find **Google** in the list and click to expand
3. Toggle **Enable Sign in with Google** to ON
4. Enter your Google OAuth credentials:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
5. Copy the **Callback URL** shown (format: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`)
6. Add this URL to your Google OAuth authorized redirect URIs
7. Save the configuration

### 4. Environment Variables

Ensure these environment variables are set in your `.env` file:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Implementation Details

### Current Implementation Structure

```
src/
├── components/
│   ├── AuthProvider.tsx      # Main auth context and provider
│   └── LoginButton.tsx       # Google Sign-in button component
├── hooks/
│   └── useSupabaseAuth.tsx   # Legacy auth hook (optional)
├── utils/
│   └── supabaseClient.ts     # Supabase client configuration
└── router.tsx                 # Routes including auth callback
```

### Key Components

#### 1. AuthProvider (`src/components/AuthProvider.tsx`)
- Manages authentication state
- Provides `signInWithGoogle()` and `signOut()` methods
- Handles auth state changes
- Includes error handling and loading states

#### 2. LoginButton (`src/components/LoginButton.tsx`)
- Displays Google Sign-in button
- Shows user profile when authenticated
- Handles sign out functionality
- Displays error messages

#### 3. Auth Callback Handler
- Route: `/auth/callback`
- Handles OAuth redirect from Google
- Completes authentication flow
- Redirects to main app on success

### Usage in Components

```tsx
import { useAuth } from './components/AuthProvider';

function MyComponent() {
  const { user, loading, error, signInWithGoogle, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (user) {
    return (
      <div>
        Welcome, {user.user_metadata?.full_name}!
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  return (
    <button onClick={signInWithGoogle}>
      Sign in with Google
    </button>
  );
}
```

## Testing the Implementation

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to your app** (usually http://localhost:3001)

3. **Click the "Sign in with Google" button**

4. **Complete Google OAuth flow:**
   - Select your Google account
   - Grant permissions
   - You'll be redirected back to the app

5. **Verify authentication:**
   - User profile should appear
   - Sign out button should be visible
   - User data should be accessible

## Troubleshooting

### Common Issues and Solutions

#### 1. "Redirect URI mismatch" error
- **Solution**: Ensure the callback URL in Google Console matches exactly with Supabase's callback URL
- Check for trailing slashes and protocol (http vs https)

#### 2. "Invalid client" error
- **Solution**: Verify Client ID and Client Secret are correctly copied to Supabase
- Ensure no extra spaces or characters

#### 3. Authentication succeeds but user not logged in
- **Solution**: Check browser console for errors
- Verify localStorage is not blocked
- Check Supabase auth settings for email confirmations

#### 4. CORS errors
- **Solution**: Add your domain to Supabase's allowed origins
- Check browser extensions that might block requests

### Debug Mode

Enable debug logging by adding to your code:
```javascript
// In AuthProvider.tsx
console.log('Auth state change:', event, session);
console.log('User data:', user);
```

## Security Best Practices

1. **Never expose service role key** in client-side code
2. **Use Row Level Security (RLS)** in Supabase for data protection
3. **Validate user permissions** on the server side
4. **Keep dependencies updated** for security patches
5. **Use HTTPS in production** to prevent token interception

## Production Deployment

### Vercel Deployment
1. Add environment variables in Vercel dashboard
2. Update Google OAuth redirect URIs with production domain
3. Update Supabase allowed URLs

### Environment Variables for Production
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Additional Features

### Custom User Metadata
Access user information after authentication:
```javascript
const user = useAuth().user;
// Available fields:
// user.email
// user.user_metadata.full_name
// user.user_metadata.avatar_url
// user.user_metadata.email_verified
```

### Session Management
The current implementation includes:
- Automatic token refresh
- Persistent sessions (survives page refresh)
- Session expiry handling

## Support and Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Discord Community](https://discord.supabase.com)

## Next Steps

1. **Implement user profiles**: Store additional user data in a profiles table
2. **Add role-based access**: Implement admin/user roles
3. **Enable additional providers**: Add GitHub, Twitter, etc.
4. **Implement email/password auth**: As fallback option
5. **Add 2FA**: For enhanced security