import { GoogleGenAI } from '@google/genai';

let cachedClient: GoogleGenAI | null = null;

const resolveGeminiApiKey = (): string => {
  const viteKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (viteKey) {
    return viteKey;
  }

  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  throw new Error(
    'Gemini API key is not configured. Set VITE_GEMINI_API_KEY (preferred) or GEMINI_API_KEY in your environment.'
  );
};

export const getGeminiClient = (): GoogleGenAI => {
  if (!cachedClient) {
    const apiKey = resolveGeminiApiKey();
    cachedClient = new GoogleGenAI({ apiKey });
  }

  return cachedClient;
};

