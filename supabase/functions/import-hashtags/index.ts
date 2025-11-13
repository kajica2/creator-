// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts'
import { generateHashtags } from './hashtag-generator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  throw new Error('Supabase credentials are not configured for import-hashtags function.')
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const payloadSchema = z.object({
  targetCount: z.number().int().min(1).max(1000).optional().default(300),
  clearExisting: z.boolean().optional().default(false),
})

interface ImportResult {
  categoriesCreated: number
  hashtagsImported: number
  hashtagsSkipped: number
  errors: string[]
  categoryIds: Record<string, string>
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
  const result: ImportResult = {
    categoriesCreated: 0,
    hashtagsImported: 0,
    hashtagsSkipped: 0,
    errors: [],
    categoryIds: {},
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

    const { targetCount, clearExisting } = parseResult.data

    // Clear existing hashtags if requested
    if (clearExisting) {
      console.log('Clearing existing hashtags...')
      const { error: deleteError } = await supabaseAdmin.from('hashtags').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (deleteError) {
        console.error('Error clearing hashtags:', deleteError)
        result.errors.push(`Failed to clear existing hashtags: ${deleteError.message}`)
      }
    }

    // Generate hashtags
    console.log(`Generating ${targetCount} hashtags...`)
    const hashtagData = generateHashtags(targetCount)

    // Create or get categories
    for (const category of hashtagData.categories) {
      try {
        // Check if category exists
        const { data: existingCategory } = await supabaseAdmin
          .from('hashtag_categories')
          .select('id')
          .eq('name', category.name)
          .single()

        let categoryId: string

        if (existingCategory) {
          categoryId = existingCategory.id
          console.log(`Category "${category.name}" already exists`)
        } else {
          // Create category
          const { data: newCategory, error: categoryError } = await supabaseAdmin
            .from('hashtag_categories')
            .insert({
              name: category.name,
              description: category.description || null,
            })
            .select('id')
            .single()

          if (categoryError || !newCategory) {
            result.errors.push(`Failed to create category "${category.name}": ${categoryError?.message || 'Unknown error'}`)
            continue
          }

          categoryId = newCategory.id
          result.categoriesCreated++
          console.log(`Created category: ${category.name}`)
        }

        result.categoryIds[category.name] = categoryId

        // Import hashtags for this category
        for (const hashtag of category.hashtags) {
          try {
            // Check if hashtag already exists
            const { data: existing } = await supabaseAdmin
              .from('hashtags')
              .select('id')
              .eq('name', hashtag.name)
              .single()

            if (existing) {
              result.hashtagsSkipped++
              continue
            }

            // Insert hashtag
            const { error: insertError } = await supabaseAdmin.from('hashtags').insert({
              name: hashtag.name,
              display_count: hashtag.count || null,
              size: hashtag.size || 'Medium',
              tags: hashtag.tags || [],
              popularity_score: hashtag.popularityScore || 0,
              related_hashtags: hashtag.relatedHashtags || [],
              category_id: categoryId,
            })

            if (insertError) {
              result.errors.push(`Failed to insert hashtag "${hashtag.name}": ${insertError.message}`)
            } else {
              result.hashtagsImported++
            }
          } catch (error) {
            result.errors.push(`Error processing hashtag "${hashtag.name}": ${error instanceof Error ? error.message : String(error)}`)
          }
        }
      } catch (error) {
        result.errors.push(`Error processing category "${category.name}": ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    const endTime = new Date().toISOString()
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime()

    return new Response(
      JSON.stringify(
        {
          ...result,
          startTime,
          endTime,
          duration,
          targetCount,
          success: result.errors.length === 0,
        },
        null,
        2
      ),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    const endTime = new Date().toISOString()
    result.errors.push(error instanceof Error ? error.message : String(error))

    return new Response(
      JSON.stringify(
        {
          ...result,
          startTime,
          endTime,
          success: false,
        },
        null,
        2
      ),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

