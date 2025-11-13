// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts'
import { getGeminiClient } from './utils.ts'
import { SAMPLE_PERSONAS } from './personas.ts'
import { generateToolContent } from './tools/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  throw new Error('Supabase credentials are not configured for seed-sample-data function.')
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const payloadSchema = z.object({
  userId: z.string().uuid().optional(),
})

interface ExecutionResult {
  tool: string
  success: boolean
  error?: string
  contentId?: string
  personaId?: string
}

interface ExecutionReport {
  startTime: string
  endTime: string
  duration: number
  totalTools: number
  successful: number
  failed: number
  personasCreated: number
  contentGenerated: number
  results: ExecutionResult[]
  errors: string[]
}

// Tools to test (matching prompt_type enum)
const TOOLS_TO_TEST = [
  { name: 'AI Story', type: 'AI Story' },
  { name: 'Suno Lyrics', type: 'Suno Lyrics' },
  { name: 'Website Strategy', type: 'Website Strategy' },
  { name: 'AI Skill Guide', type: 'AI Skill Guide' },
  { name: 'Tensor Mutation', type: 'Tensor Mutation' },
  { name: 'AI Concept', type: 'AI Concept' },
  { name: 'Text-to-Image', type: 'Text-to-Image' },
  { name: 'Batch Image Prompts', type: 'Batch Image Prompts' },
  { name: 'AI Website', type: 'AI Website' },
  { name: 'Thinking Mode', type: 'Thinking Mode' },
]

async function createOrGetUser(userId?: string): Promise<string> {
  if (userId) {
    // Verify user exists
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (!error && data?.user) {
      return userId
    }
  }

  // Create a test user for seeding
  const testEmail = `seed-test-${Date.now()}@example.com`
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    email_confirm: true,
    password: crypto.randomUUID(),
  })

  if (error || !data?.user) {
    throw new Error(`Failed to create test user: ${error?.message || 'Unknown error'}`)
  }

  return data.user.id
}

async function createPersona(userId: string, persona: { name: string; context: string }): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('personas')
      .insert({
        user_id: userId,
        name: persona.name,
        context: persona.context,
        is_default: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`Failed to create persona ${persona.name}:`, error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error(`Error creating persona ${persona.name}:`, error)
    return null
  }
}

async function storeContent(
  userId: string,
  personaId: string,
  tool: string,
  promptType: string,
  content: any,
  hashtags: string[] = [],
  metadata: Record<string, any> = {}
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('persona_content')
      .insert({
        user_id: userId,
        persona_id: personaId,
        tool: tool,
        prompt_type: promptType as any,
        content: content,
        hashtags: hashtags,
        metadata: metadata,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`Failed to store content for ${tool}:`, error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error(`Error storing content for ${tool}:`, error)
    return null
  }
}

async function seedHashtags(): Promise<{ seeded: boolean; count: number }> {
  try {
    // Check if hashtags already exist
    const { count, error: countError } = await supabaseAdmin
      .from('hashtags')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error checking hashtags:', countError)
      return { seeded: false, count: 0 }
    }

    if (count && count > 0) {
      console.log(`Hashtags already seeded (${count} existing)`)
      return { seeded: true, count }
    }

    // Hashtags should be seeded via migrations, but if not, we'll note it
    console.log('Hashtags should be seeded via migrations. Skipping manual seeding.')
    return { seeded: true, count: 0 }
  } catch (error) {
    console.error('Error in seedHashtags:', error)
    return { seeded: false, count: 0 }
  }
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const startTime = new Date().toISOString()
  const report: ExecutionReport = {
    startTime,
    endTime: '',
    duration: 0,
    totalTools: 0,
    successful: 0,
    failed: 0,
    personasCreated: 0,
    contentGenerated: 0,
    results: [],
    errors: [],
  }

  try {
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
      return new Response(
        JSON.stringify({ error: 'Validation error', details: parseResult.error.format() }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { userId: providedUserId } = parseResult.data

    // Create or get user
    const userId = await createOrGetUser(providedUserId)
    console.log(`Using user ID: ${userId}`)

    // Initialize Gemini client
    const geminiClient = getGeminiClient()

    // Seed hashtags (check only)
    const hashtagResult = await seedHashtags()
    console.log(`Hashtag seeding check: ${hashtagResult.seeded ? 'OK' : 'Failed'}`)

    // Create personas
    const personaIds: Record<string, string> = {}
    for (const persona of SAMPLE_PERSONAS) {
      const personaId = await createPersona(userId, persona)
      if (personaId) {
        personaIds[persona.name] = personaId
        report.personasCreated++
        console.log(`Created persona: ${persona.name} (${personaId})`)
      } else {
        report.errors.push(`Failed to create persona: ${persona.name}`)
      }
    }

    // Generate content for each tool and persona
    report.totalTools = TOOLS_TO_TEST.length * SAMPLE_PERSONAS.length

    for (const tool of TOOLS_TO_TEST) {
      for (const persona of SAMPLE_PERSONAS) {
        const personaId = personaIds[persona.name]
        if (!personaId) {
          report.results.push({
            tool: tool.name,
            success: false,
            error: `Persona ${persona.name} not created`,
          })
          report.failed++
          continue
        }

        try {
          console.log(`Generating ${tool.name} content for ${persona.name}...`)

          const content = await generateToolContent(geminiClient, tool.type, persona.context)

          if (content) {
            const contentId = await storeContent(
              userId,
              personaId,
              tool.name,
              tool.type,
              content.content,
              content.hashtags || [],
              content.metadata || {}
            )

            if (contentId) {
              report.results.push({
                tool: tool.name,
                success: true,
                contentId,
                personaId,
              })
              report.successful++
              report.contentGenerated++
              console.log(`✓ Generated ${tool.name} for ${persona.name}`)
            } else {
              report.results.push({
                tool: tool.name,
                success: false,
                error: 'Failed to store content in database',
                personaId,
              })
              report.failed++
            }
          } else {
            report.results.push({
              tool: tool.name,
              success: false,
              error: 'Content generation returned null',
              personaId,
            })
            report.failed++
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          report.results.push({
            tool: tool.name,
            success: false,
            error: errorMessage,
            personaId,
          })
          report.failed++
          report.errors.push(`${tool.name} for ${persona.name}: ${errorMessage}`)
          console.error(`✗ Failed ${tool.name} for ${persona.name}:`, errorMessage)
        }
      }
    }

    const endTime = new Date()
    report.endTime = endTime.toISOString()
    report.duration = endTime.getTime() - new Date(startTime).getTime()

    return new Response(JSON.stringify(report, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const endTime = new Date()
    report.endTime = endTime.toISOString()
    report.duration = endTime.getTime() - new Date(startTime).getTime()
    report.errors.push(error instanceof Error ? error.message : String(error))

    return new Response(JSON.stringify(report, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

