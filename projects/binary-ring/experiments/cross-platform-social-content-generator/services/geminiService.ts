
import { GoogleGenAI, Type } from "@google/genai";
import type { TextContent } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const textGenerationModel = 'gemini-2.5-pro';
const imageGenerationModel = 'imagen-4.0-generate-001';

const contentSchema = {
  type: Type.OBJECT,
  properties: {
    linkedinPost: {
      type: Type.STRING,
      description: "A professional, long-form post for LinkedIn, typically 2-4 paragraphs.",
    },
    twitterPost: {
      type: Type.STRING,
      description: "A short, punchy, and engaging post for Twitter/X, under 280 characters.",
    },
    instagramCaption: {
      type: Type.STRING,
      description: "A visually-focused caption for Instagram, including relevant hashtags.",
    },
  },
  required: ["linkedinPost", "twitterPost", "instagramCaption"],
};

export async function generateSocialContent(idea: string, tone: string): Promise<TextContent> {
  const prompt = `
    Based on the following idea, generate social media content tailored for LinkedIn, Twitter/X, and Instagram.
    The desired tone is: ${tone}.

    Idea: "${idea}"

    Generate the content in the following JSON format:
    - linkedinPost: A professional, long-form post for LinkedIn.
    - twitterPost: A short, punchy post for Twitter/X.
    - instagramCaption: A caption for Instagram, focusing on visual storytelling and including relevant hashtags.
  `;

  try {
    const response = await ai.models.generateContent({
      model: textGenerationModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: contentSchema,
      },
    });

    const jsonText = response.text.trim();
    // In case the response is wrapped in markdown ```json ... ```
    const cleanJsonText = jsonText.replace(/^```json\s*|```$/g, '');
    const parsedContent = JSON.parse(cleanJsonText);
    
    return parsedContent as TextContent;

  } catch (error) {
    console.error("Error generating social content:", error);
    throw new Error("Failed to generate text content. Please check the console for details.");
  }
}

export async function generateImageForPost(prompt: string, aspectRatio: string): Promise<string> {
    const imagePrompt = `A visually stunning, high-quality photograph representing the concept: "${prompt}". The style should be modern, clean, and engaging for social media.`;
    
    try {
        const response = await ai.models.generateImages({
            model: imageGenerationModel,
            prompt: imagePrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error(`Error generating image with aspect ratio ${aspectRatio}:`, error);
        throw new Error(`Failed to generate image for prompt: "${prompt}".`);
    }
}
