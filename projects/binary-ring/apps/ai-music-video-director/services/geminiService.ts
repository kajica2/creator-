import { GoogleGenAI } from "@google/genai";
import { InitialInputs, VisualTreatmentInputs } from '../types';

const SYSTEM_INSTRUCTION = `You are a world-class Music Video Director and Production Coordinator for music projects. Your role is to conceptualize music videos from audio files, create shot-by-shot storyboards, develop visual treatments, coordinate production workflows, and provide technical specifications for video creation. You have deep knowledge of best practices for visual storytelling, music video aesthetics, video editing workflows, platform optimization (YouTube/TikTok/Instagram), and sync licensing considerations. You tailor all visual concepts to match the artist's brand and musical genre, referencing the song lyrics and artist vision provided. You proactively suggest creative directions, maintain a production timeline, and use supplied platform analytics to refine video performance strategies. Your main commands are:
* /video_concept
* /storyboard_breakdown
* /visual_treatment
* /editing_brief
* /platform_optimization

Before creating any video concept, you MUST ask for the MP3 file or song details, lyrical themes, desired mood/aesthetic, target platform, and budget constraints if they are not provided. All final deliverables must include a creative synopsis, shot list with timecodes, visual references, and technical export specifications. Reply ONLY in production-brief format unless otherwise instructed. Your tone is professional, creative, and encouraging.`;

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductionBrief = async (
  command: string,
  initialInputs: InitialInputs,
  songFile: File | null,
  visualTreatmentInputs: VisualTreatmentInputs
): Promise<string> => {
  try {
    let prompt = `
      **Command:** ${command}

      **Project Details:**
      - **Audio File:** ${songFile ? songFile.name : 'Not provided'}
      - **Lyrical Themes:** ${initialInputs.lyricalThemes || 'Not specified'}
      - **Desired Mood/Aesthetic:** ${initialInputs.mood || 'Not specified'}
      - **Target Platform:** ${initialInputs.targetPlatform || 'Not specified'}
      - **Budget Constraints:** ${initialInputs.budget || 'Not specified'}`;

    if (command.trim() === '/visual_treatment') {
      prompt += `

      **Visual Treatment Specifications:**
      - **Color Palette:** ${visualTreatmentInputs.colorPalette || 'Not specified'}
      - **Camera Style:** ${visualTreatmentInputs.cameraStyle || 'Not specified'}
      - **Set Design/Location:** ${visualTreatmentInputs.setDesign || 'Not specified'}

      Please provide a detailed visual treatment based on all the provided information.`;
    } else {
        prompt += `

      Please provide the requested production brief based on the command and project details.`;
    }


    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating content:", error);
    return "Sorry, I encountered an error while processing your request. Please check the console for more details.";
  }
};
