
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development and should not happen in the target environment.
  console.warn("API_KEY is not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getExplanationForMethod = async (methodName: string): Promise<string> => {
  if (!API_KEY) {
    return `**Error:** API key not configured. Please set the \`process.env.API_KEY\` environment variable.`;
  }

  try {
    const prompt = `
      Explain the concept of "${methodName}" for algorithmic music composition.
      Keep it concise (2-3 paragraphs) and easy for a beginner to understand.
      Focus on the core principle and how it's used to generate musical ideas.
      Use Markdown for formatting, including bold text for key terms and a single list if it helps clarity.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error(`Error fetching explanation for ${methodName}:`, error);
    return "Sorry, I couldn't fetch an explanation at this time. Please check the console for more details.";
  }
};
