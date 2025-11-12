// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  throw new Error('Supabase credentials are not configured for log-entrance function.')
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const payloadSchema = z.object({
  role: z.enum(['visitor', 'user', 'admin']),
  drive: z
    .object({
      isConnected: z.boolean(),
      refreshToken: z.string().min(10).optional(),
    })
    .optional(),
  gemini: z
    .object({
      apiKey: z.string().min(20).optional(),
      projectId: z.string().min(1).optional(),
    })
    .optional(),
  metadata: z
    .object({
      visitId: z.string().optional(),
    })
    .optional(),
})

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for') ?? ''
  if (forwardedFor.length > 0) return forwardedFor.split(',')[0]?.trim() ?? '0.0.0.0'
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  const remoteAddr = request.headers.get('cf-connecting-ip')
  if (remoteAddr) return remoteAddr
  return '0.0.0.0'
}

function sanitizeCookies(cookieHeader: string | null) {
  if (!cookieHeader || cookieHeader.length === 0) return null
  const pairs = cookieHeader.split(';').slice(0, 20)
  const snapshot: Record<string, string> = {}
  for (const pair of pairs) {
    const [rawKey, rawValue] = pair.split('=')
    if (!rawKey) continue
    const key = rawKey.trim()
    if (!key) continue
    const value = (rawValue ?? '').trim()
    snapshot[key] = value.slice(0, 128)
  }
  return snapshot
}

async function getSupabaseUser(request: Request) {
  const authHeader = request.headers.get('authorization') ?? ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null
  const token = authHeader.replace(/bearer /i, '').trim()
  if (token.length === 0) return null
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error) {
    console.error('Supabase auth.getUser failed', error)
    return null
  }
  return data.user ?? null
}

serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (request.method !== 'POST')
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const parseResult = payloadSchema.safeParse(body)
  if (!parseResult.success) {
    return new Response(JSON.stringify({ error: 'Validation error', details: parseResult.error.format() }), {
      status: 422,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const payload = parseResult.data
  const user = await getSupabaseUser(request)
  if (payload.role === 'admin' && !user) {
    return new Response(JSON.stringify({ error: 'Admin access requires Supabase session token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const driveIsConnected = payload.drive?.isConnected ?? false
  if (driveIsConnected && !payload.drive?.refreshToken) {
    return new Response(JSON.stringify({ error: 'Drive connection requires refresh token' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const logInsert = {
    user_id: user?.id ?? null,
    role: payload.role,
    ip_address: getClientIp(request),
    user_agent: request.headers.get('user-agent')?.slice(0, 1024) ?? null,
    cookie_snapshot: sanitizeCookies(request.headers.get('cookie')),
    drive_connected: driveIsConnected,
  }

  const { data: insertedLog, error: logError } = await supabaseAdmin
    .from('entrance_logs')
    .insert(logInsert)
    .select('id')
    .single()

  if (logError) {
    console.error('Failed to insert entrance log', logError)
    return new Response(JSON.stringify({ error: 'Failed to persist entrance log' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (payload.role === 'admin' && user) {
    const adminUpsert: Record<string, any> = {
      id: user.id,
      email: user.email ?? '',
    }

    if (payload.gemini?.apiKey) {
      const trimmedKey = payload.gemini.apiKey.trim()
      adminUpsert.gemini_api_key = trimmedKey
      adminUpsert.gemini_api_key_last4 = trimmedKey.slice(-4)
    }

    if (payload.drive?.refreshToken) adminUpsert.drive_refresh_token = payload.drive.refreshToken

    const { error: adminError } = await supabaseAdmin.from('admin_users').upsert(adminUpsert)
    if (adminError) {
      console.error('Failed to store admin credentials', adminError)
      return new Response(
        JSON.stringify({ error: 'Failed to store admin credentials', logId: insertedLog.id }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  }

  return new Response(JSON.stringify({ logId: insertedLog.id }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

