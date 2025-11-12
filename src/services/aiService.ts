/**
 * Unified AI Service Layer
 * Provides fallback mechanisms between Gemini, Claude, and Replicate APIs
 */

interface AIServiceConfig {
  geminiApiKey?: string;
  anthropicApiKey?: string;
  replicateApiToken?: string;
}

interface AIProvider {
  name: string;
  available: boolean;
  priority: number;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    tokens?: number;
    cost?: number;
  };
}

interface GenerateTextOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  systemPrompt?: string;
  jsonMode?: boolean;
  schema?: any;
}

class AIService {
  private config: AIServiceConfig;
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    this.config = {
      geminiApiKey: import.meta.env?.VITE_GEMINI_API_KEY,
      anthropicApiKey: import.meta.env?.VITE_ANTHROPIC_API_KEY,
      replicateApiToken: import.meta.env?.VITE_REPLICATE_API_TOKEN,
    };

    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize provider availability and priority
    this.providers.set('gemini', {
      name: 'Google Gemini',
      available: !!this.config.geminiApiKey,
      priority: 1
    });

    this.providers.set('claude', {
      name: 'Anthropic Claude',
      available: !!this.config.anthropicApiKey,
      priority: 2
    });

    this.providers.set('replicate', {
      name: 'Replicate',
      available: !!this.config.replicateApiToken,
      priority: 3
    });
  }

  private getAvailableProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.available)
      .sort(([_, a], [__, b]) => a.priority - b.priority)
      .map(([name]) => name);
  }

  async generateText(options: GenerateTextOptions): Promise<AIResponse> {
    const availableProviders = this.getAvailableProviders();

    if (availableProviders.length === 0) {
      throw new Error('No AI providers are available. Please check your API keys.');
    }

    let lastError: Error | null = null;

    // Try each provider in priority order
    for (const providerName of availableProviders) {
      try {
        console.log(`Attempting to use ${providerName} for text generation...`);

        switch (providerName) {
          case 'gemini':
            return await this.generateWithGemini(options);
          case 'claude':
            return await this.generateWithClaude(options);
          case 'replicate':
            return await this.generateWithReplicate(options);
          default:
            continue;
        }
      } catch (error) {
        console.warn(`${providerName} failed:`, error);
        lastError = error as Error;
        continue;
      }
    }

    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }

  private async generateWithGemini(options: GenerateTextOptions): Promise<AIResponse> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    if (!this.config.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(this.config.geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: options.model || 'gemini-1.5-flash',
      generationConfig: options.jsonMode ? {
        responseMimeType: "application/json",
        responseSchema: options.schema,
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 2048,
      } : {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 2048,
      }
    });

    const fullPrompt = options.systemPrompt
      ? `${options.systemPrompt}\n\nUser: ${options.prompt}`
      : options.prompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;

    return {
      content: response.text(),
      provider: 'gemini',
      model: options.model || 'gemini-1.5-flash',
      usage: {
        tokens: response.usageMetadata?.totalTokenCount,
      }
    };
  }

  private async generateWithClaude(options: GenerateTextOptions): Promise<AIResponse> {
    if (!this.config.anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const messages = [
      {
        role: 'user',
        content: options.prompt
      }
    ];

    const requestBody = {
      model: options.model || 'claude-3-sonnet-20240229',
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature || 0.7,
      messages: messages,
      ...(options.systemPrompt && { system: options.systemPrompt })
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      provider: 'claude',
      model: options.model || 'claude-3-sonnet-20240229',
      usage: {
        tokens: data.usage?.total_tokens,
      }
    };
  }

  private async generateWithReplicate(options: GenerateTextOptions): Promise<AIResponse> {
    if (!this.config.replicateApiToken) {
      throw new Error('Replicate API token not configured');
    }

    const input = {
      prompt: options.prompt,
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature || 0.7,
      ...(options.systemPrompt && { system_prompt: options.systemPrompt })
    };

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.config.replicateApiToken}`
      },
      body: JSON.stringify({
        version: "2c1608e18606fad2812020dc541930f2d0495ce32eee50074220b87300bc16e1", // Llama 2 70B
        input: input
      })
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status} ${response.statusText}`);
    }

    const prediction = await response.json();

    // Poll for completion (simplified)
    let result = prediction;
    while (result.status === 'starting' || result.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${this.config.replicateApiToken}`
        }
      });
      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error(`Replicate prediction failed: ${result.error}`);
    }

    return {
      content: result.output.join(''),
      provider: 'replicate',
      model: 'llama-2-70b-chat',
      usage: {
        // Replicate doesn't provide token counts in this format
      }
    };
  }

  // Image generation with fallback support
  async generateImage(prompt: string, options: {
    width?: number;
    height?: number;
    model?: string;
    style?: string;
  } = {}): Promise<{ imageUrl: string; provider: string; model: string }> {
    // For now, we'll implement image generation primarily through Replicate
    // since it has the most robust image generation models

    if (!this.config.replicateApiToken) {
      throw new Error('Image generation requires Replicate API token');
    }

    const input = {
      prompt: prompt,
      width: options.width || 1024,
      height: options.height || 1024,
      num_outputs: 1,
      guidance_scale: 7.5,
      num_inference_steps: 50
    };

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.config.replicateApiToken}`
      },
      body: JSON.stringify({
        version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4", // SDXL
        input: input
      })
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status} ${response.statusText}`);
    }

    const prediction = await response.json();

    // Poll for completion
    let result = prediction;
    while (result.status === 'starting' || result.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${this.config.replicateApiToken}`
        }
      });
      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error(`Image generation failed: ${result.error}`);
    }

    return {
      imageUrl: result.output[0],
      provider: 'replicate',
      model: 'sdxl'
    };
  }

  // Get provider status for debugging
  getProviderStatus(): Record<string, AIProvider> {
    const status: Record<string, AIProvider> = {};
    this.providers.forEach((provider, name) => {
      status[name] = { ...provider };
    });
    return status;
  }

  // Check if any provider is available
  isAvailable(): boolean {
    return this.getAvailableProviders().length > 0;
  }

  // Get the preferred provider for a given task
  getPreferredProvider(task: 'text' | 'image' = 'text'): string | null {
    const available = this.getAvailableProviders();

    if (available.length === 0) return null;

    if (task === 'image') {
      // Prefer Replicate for image generation
      return available.includes('replicate') ? 'replicate' : available[0];
    }

    // For text, use priority order
    return available[0];
  }
}

// Export a singleton instance
export const aiService = new AIService();

// Export the class for testing
export { AIService };

// Convenience functions for backward compatibility
export const generateText = (options: GenerateTextOptions) => aiService.generateText(options);
export const generateImage = (prompt: string, options?: any) => aiService.generateImage(prompt, options);
export const getProviderStatus = () => aiService.getProviderStatus();
export const isAIAvailable = () => aiService.isAvailable();