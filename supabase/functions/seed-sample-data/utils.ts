import { GoogleGenAI } from 'https://esm.sh/@google/genai@0.14.0'

let cachedClient: GoogleGenAI | null = null

export function getGeminiClient(): GoogleGenAI {
  if (cachedClient) {
    return cachedClient
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('VITE_GEMINI_API_KEY')

  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your environment.'
    )
  }

  cachedClient = new GoogleGenAI({ apiKey })
  return cachedClient
}

