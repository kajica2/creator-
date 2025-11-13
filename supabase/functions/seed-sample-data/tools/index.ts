import { GoogleGenAI, Type } from 'https://esm.sh/@google/genai@0.14.0'

export interface ToolContentResult {
  content: any
  hashtags?: string[]
  metadata?: Record<string, any>
}

export async function generateToolContent(
  client: GoogleGenAI,
  toolType: string,
  personaContext: string
): Promise<ToolContentResult | null> {
  const contextPrefix = personaContext
    ? `ARTIST CONTEXT: "${personaContext}". Use this to inform the generation. `
    : ''

  switch (toolType) {
    case 'AI Story':
      return generateAIStory(client, contextPrefix)
    case 'Suno Lyrics':
      return generateSunoLyrics(client, contextPrefix)
    case 'Website Strategy':
      return generateWebsiteStrategy(client, contextPrefix)
    case 'AI Skill Guide':
      return generateAISkill(client, contextPrefix)
    case 'Tensor Mutation':
      return generateTensorMutation(client, contextPrefix)
    case 'AI Concept':
      return generateAIConcept(client, contextPrefix)
    case 'Text-to-Image':
      return generateTextToImage(client, contextPrefix)
    case 'Batch Image Prompts':
      return generateBatchPrompts(client, contextPrefix)
    case 'AI Website':
      return generateAIWebsite(client, contextPrefix)
    case 'Thinking Mode':
      return generateThinkingMode(client, contextPrefix)
    default:
      console.error(`Unknown tool type: ${toolType}`)
      return null
  }
}

async function generateAIStory(client: GoogleGenAI, contextPrefix: string): Promise<ToolContentResult | null> {
  try {
    const hashtags = ['#DigitalArt', '#CreativeCoding', '#NewMediaArt']
    const prompt = `${contextPrefix}As a social media expert for an audio-visual artist, craft a compelling Instagram caption. The post showcases a new piece of work. Weave the following themes and keywords seamlessly into a narrative: ${hashtags.join(', ')}. The story should be engaging, provide context to the art, and encourage viewers to comment, share, or save the post. Keep it concise and impactful.`

    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'A catchy, short title for the Instagram post.' },
            story: {
              type: Type.STRING,
              description: 'The full caption/story for the post, written in an engaging and artistic tone.',
            },
          },
          required: ['title', 'story'],
        },
      },
    })

    const jsonStr = response.text.trim()
    const parsedData = JSON.parse(jsonStr)

    return {
      content: parsedData,
      hashtags,
      metadata: { wordCount: parsedData.story?.length || 0 },
    }
  } catch (error) {
    console.error('Error generating AI Story:', error)
    return null
  }
}

async function generateSunoLyrics(client: GoogleGenAI, contextPrefix: string): Promise<ToolContentResult | null> {
  try {
    const topic = 'atmospheric soundscape'
    const prompt = `${contextPrefix}Generate song lyrics for Suno AI based on this theme: "${topic}". The structure should be clear and ready for music generation, using tags like [Verse], [Chorus], [Bridge], [Instrumental], [Intro], [Outro]. Create a catchy title and the full lyrics.`

    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'A catchy title for the song.' },
            lyrics: {
              type: Type.STRING,
              description: 'The full song lyrics, formatted with tags like [Verse], [Chorus], etc.',
            },
          },
          required: ['title', 'lyrics'],
        },
      },
    })

    const jsonStr = response.text.trim()
    const parsedData = JSON.parse(jsonStr)

    return {
      content: parsedData,
      hashtags: ['#Music', '#Lyrics', '#SunoAI'],
      metadata: { topic },
    }
  } catch (error) {
    console.error('Error generating Suno Lyrics:', error)
    return null
  }
}

async function generateWebsiteStrategy(
  client: GoogleGenAI,
  contextPrefix: string
): Promise<ToolContentResult | null> {
  try {
    const artistDescription = 'an audio-visual artist creating immersive digital experiences'
    const selectedTargets = ['fans', 'clients', 'collaborators']
    const prompt = `${contextPrefix}Generate a website strategy for an artist who creates: "${artistDescription}". The website needs to specifically target: ${selectedTargets.join(', ')}. Focus on converting visitors from these groups into fans, clients, or collaborators.`

    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mainGoal: { type: Type.STRING, description: 'The single, primary goal of the website.' },
            keySections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: 'Name of a key website section (e.g., "Homepage", "Portfolio").',
                  },
                  contentIdeas: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'List of content ideas for this section.',
                  },
                },
                required: ['name', 'contentIdeas'],
              },
            },
            toneAndStyle: {
              type: Type.STRING,
              description: 'Description of the visual and textual tone.',
            },
            callToAction: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The main call-to-action button text." },
                description: { type: Type.STRING, description: "A brief explanation of the CTA's purpose." },
              },
              required: ['text', 'description'],
            },
            targetAudienceEngagement: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  target: { type: Type.STRING, description: 'The target audience.' },
                  strategy: {
                    type: Type.STRING,
                    description: 'A specific strategy to engage this audience on the website.',
                  },
                },
                required: ['target', 'strategy'],
              },
            },
          },
          required: ['mainGoal', 'keySections', 'toneAndStyle', 'callToAction', 'targetAudienceEngagement'],
        },
      },
    })

    const jsonStr = response.text.trim()
    const parsedData = JSON.parse(jsonStr)

    return {
      content: parsedData,
      hashtags: ['#WebDesign', '#Strategy', '#Portfolio'],
      metadata: { targets: selectedTargets },
    }
  } catch (error) {
    console.error('Error generating Website Strategy:', error)
    return null
  }
}

async function generateAISkill(client: GoogleGenAI, contextPrefix: string): Promise<ToolContentResult | null> {
  try {
    const skillTopic = 'Creative Coding with p5.js'
    const prompt = `${contextPrefix}Generate a comprehensive learning guide for the following skill: "${skillTopic}".`

    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skillName: { type: Type.STRING, description: 'The official name of the skill.' },
            description: {
              type: Type.STRING,
              description: 'A concise, one-paragraph overview of the skill.',
            },
            coreConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'A list of 3-5 fundamental concepts or terminologies.',
            },
            learningPath: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: {
                    type: Type.STRING,
                    description: 'The title of the learning step (e.g., "1. Master the Basics").',
                  },
                  description: {
                    type: Type.STRING,
                    description: 'A brief explanation of what to do in this step.',
                  },
                },
                required: ['step', 'description'],
              },
            },
            projectIdeas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'A list of 3 practical project ideas to apply the skill.',
            },
          },
          required: ['skillName', 'description', 'coreConcepts', 'learningPath', 'projectIdeas'],
        },
      },
    })

    const jsonStr = response.text.trim()
    const parsedData = JSON.parse(jsonStr)

    return {
      content: parsedData,
      hashtags: ['#Learning', '#Skills', '#Tutorial'],
      metadata: { skillTopic },
    }
  } catch (error) {
    console.error('Error generating AI Skill:', error)
    return null
  }
}

async function generateTensorMutation(
  client: GoogleGenAI,
  contextPrefix: string
): Promise<ToolContentResult | null> {
  try {
    const concept = 'Digital Minimalism'
    const prompt = `${contextPrefix}You are an AI muse for avant-garde audio-visual artists. Your task is to perform a 'Tensor Mutation' on a given concept. This means you take a simple idea and expand it into multiple creative dimensions. For the concept "${concept}", generate a new 'mutatedConcept' title and then break it down into four dimensions: 'Visual Cortex' (visual ideas), 'Sonic Spectrum' (sound & music ideas), 'Temporal Echo' (ideas about time, interaction, duration), and 'Philosophical Core' (the deeper meaning or question). Provide 3-4 concrete ideas for each dimension. The response must be structured and creative.`

    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            initialConcept: { type: Type.STRING },
            mutatedConcept: { type: Type.STRING },
            dimensions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dimensionName: { type: Type.STRING },
                  ideas: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['dimensionName', 'ideas'],
              },
            },
          },
          required: ['initialConcept', 'mutatedConcept', 'dimensions'],
        },
      },
    })

    const jsonStr = response.text.trim()
    const parsedData = JSON.parse(jsonStr)

    return {
      content: parsedData,
      hashtags: ['#Concept', '#Creative', '#Innovation'],
      metadata: { initialConcept: concept },
    }
  } catch (error) {
    console.error('Error generating Tensor Mutation:', error)
    return null
  }
}

async function generateAIConcept(client: GoogleGenAI, contextPrefix: string): Promise<ToolContentResult | null> {
  try {
    const theme = 'Neon Dreams'
    const prompt = `${contextPrefix}Generate a creative concept for an audio-visual art piece based on the theme: "${theme}". Provide a new, evocative name for the concept, a short artistic description, a list of related keywords for social media, and three distinct visual prompts for an AI image generator.`

    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            concept: { type: Type.STRING, description: 'The evocative name of the new concept.' },
            description: {
              type: Type.STRING,
              description: 'A one-paragraph artistic description of the concept.',
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'A list of 5-7 relevant keywords.',
            },
            visualPrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Three detailed visual prompts for an AI image generator.',
            },
          },
          required: ['concept', 'description', 'keywords', 'visualPrompts'],
        },
      },
    })

    const jsonStr = response.text.trim()
    const parsedData = JSON.parse(jsonStr)

    return {
      content: parsedData,
      hashtags: parsedData.keywords || [],
      metadata: { theme },
    }
  } catch (error) {
    console.error('Error generating AI Concept:', error)
    return null
  }
}

async function generateTextToImage(
  client: GoogleGenAI,
  contextPrefix: string
): Promise<ToolContentResult | null> {
  try {
    const prompt = 'A futuristic cityscape at night with neon lights'
    const enhancePrompt = `${contextPrefix}Enhance and expand the following image prompt for an AI image generator like DALL-E, Midjourney, or Stable Diffusion. Make it highly detailed, specific about style, lighting, composition, and artistic elements. Include technical photography terms and artistic styles that would create a stunning image.

Original prompt: ${prompt}

Enhanced prompt:`

    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: enhancePrompt,
    })

    const enhancedPromptText = response.text.trim()

    return {
      content: {
        enhancedPrompt: enhancedPromptText,
        originalPrompt: prompt,
        aspectRatio: '1:1',
        placeholderImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2MzY2ZjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlYzQ4OTkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FbmhhbmNlZCBQcm9tcHQgR2VuZXJhdGVkPC90ZXh0Pjwvc3ZnPg==',
      },
      hashtags: ['#ImageGeneration', '#AIArt', '#DigitalArt'],
      metadata: { aspectRatio: '1:1' },
    }
  } catch (error) {
    console.error('Error generating Text-to-Image:', error)
    return null
  }
}

async function generateBatchPrompts(
  client: GoogleGenAI,
  contextPrefix: string
): Promise<ToolContentResult | null> {
  try {
    const folderTheme = 'Cyberpunk Aesthetics'
    const promptCount = 5
    const prompt = `${contextPrefix}You are a creative director for a digital artist. Generate a list of ${promptCount} unique, detailed, and inspiring text-to-image prompts for a media folder with the theme: "${folderTheme}". Each prompt should be a complete sentence or two, describing a scene, mood, and style. They should be suitable for models like Imagen or Midjourney.`

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: `An array of ${promptCount} text-to-image prompts.`,
            },
          },
          required: ['prompts'],
        },
      },
    })

    const jsonStr = response.text.trim()
    const parsedData = JSON.parse(jsonStr)

    return {
      content: parsedData,
      hashtags: ['#BatchPrompts', '#ImagePrompts', '#Creative'],
      metadata: { folderTheme, promptCount },
    }
  } catch (error) {
    console.error('Error generating Batch Prompts:', error)
    return null
  }
}

async function generateAIWebsite(client: GoogleGenAI, contextPrefix: string): Promise<ToolContentResult | null> {
  try {
    const topic = 'Digital Art Portfolio'
    const prompt = `${contextPrefix}
You are an expert web developer specializing in websites for avant-garde audio-visual artists. Generate the complete HTML for a single-page portfolio website. It must be fully self-contained and use Tailwind CSS via a CDN link in the head. Use dark mode aesthetics with a modern, minimalist, futuristic feel.

The website's theme is: "${topic}".

Create a portfolio with sections for gallery, about, and contact. Use placeholder content that reflects the theme.

The entire response must be a single JSON object with one key: "htmlContent", where the value is the complete HTML code as a string, starting with <!DOCTYPE html>.`

    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            htmlContent: {
              type: Type.STRING,
              description: 'The full HTML content of the website.',
            },
          },
          required: ['htmlContent'],
        },
      },
    })

    const { htmlContent } = JSON.parse(response.text.trim())

    return {
      content: { htmlContent },
      hashtags: ['#WebDesign', '#Portfolio', '#HTML'],
      metadata: { topic },
    }
  } catch (error) {
    console.error('Error generating AI Website:', error)
    return null
  }
}

async function generateThinkingMode(
  client: GoogleGenAI,
  contextPrefix: string
): Promise<ToolContentResult | null> {
  try {
    const query = 'How can audio-visual artists leverage AI tools to enhance their creative workflow?'
    const fullPrompt = `${contextPrefix}The user has a complex query and requires a detailed, well-reasoned response. Here is the query: "${query}".`

    const genAIResponse = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: fullPrompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
      },
    })

    return {
      content: {
        query,
        response: genAIResponse.text,
      },
      hashtags: ['#Thinking', '#Analysis', '#AI'],
      metadata: { thinkingBudget: 32768 },
    }
  } catch (error) {
    console.error('Error generating Thinking Mode:', error)
    return null
  }
}

