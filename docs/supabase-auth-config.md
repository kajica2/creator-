## Supabase Auth Configuration

Set the following environment variables in `.env.local` (Vite) and your server environment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_ADMIN_EMAIL`
- `SUPABASE_ADMIN_MAGIC_LINK_REDIRECT`

### Auth Settings

In the Supabase dashboard, enable:

- **Email/Password**
- **Magic Link**
- **Google OAuth** (required for Google Drive access)

Disable other providers if not needed.

Set redirect URLs to `${NEXT_PUBLIC_SITE_URL}/admin` for admin portal access.

