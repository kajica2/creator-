
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY is not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export async function generateJournalPrompt(theme: string): Promise<string> {
  if (!API_KEY) {
    return "What is one promise you can keep to yourself today?";
  }
  try {
    const prompt = `Generate a short, insightful, one-sentence journal prompt for a mindfulness app. The theme is "${theme}". The prompt should encourage self-reflection.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    const text = response.text;
    return text.trim();
  } catch (error) {
    console.error("Error generating journal prompt from Gemini:", error);
    // Provide a fallback prompt
    return `Reflect on the theme of ${theme}. What does it mean to you today?`;
  }
}
