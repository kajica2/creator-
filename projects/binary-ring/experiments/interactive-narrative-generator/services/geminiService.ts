
import { GoogleGenAI, Type } from "@google/genai";
import type { StoryHistoryItem } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const storySchema = {
    type: Type.OBJECT,
    properties: {
        narrative: {
            type: Type.STRING,
            description: 'The next part of the story. Should be an engaging paragraph that flows from the user\'s choice.',
        },
        choices: {
            type: Type.ARRAY,
            description: 'An array of exactly three distinct, concise choices for the user to continue the story. Each choice should be a short phrase.',
            items: {
                type: Type.STRING,
            },
        },
    },
    required: ['narrative', 'choices'],
};

const generatePrompt = (genre: string, history: StoryHistoryItem[], choice: string | null): string => {
    if (history.length === 0) {
        return `Start an interactive, branching narrative story in the ${genre} genre. The story should be immersive and intriguing. Provide the first paragraph of the story and exactly three distinct choices for the user to make.`;
    }

    const recentHistory = history.slice(-2).map(item => item.narrative).join('\n\n');
    return `This is an interactive story in the ${genre} genre. Here's a summary of what just happened:\n\n${recentHistory}\n\nThe user's last choice was: "${choice}".\n\nContinue the story based on this choice. The tone should remain consistent. Provide the next paragraph of the story and exactly three new, distinct choices.`;
};

export const fetchStorySegment = async (genre: string, history: StoryHistoryItem[], choice: string | null): Promise<any> => {
    const prompt = generatePrompt(genre, history, choice);
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: storySchema,
                temperature: 0.8,
                topP: 0.9,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error fetching story segment from Gemini:", error);
        throw new Error("Failed to generate the next part of the story. Please try again.");
    }
};
