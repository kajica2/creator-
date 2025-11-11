import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock the Google GenAI client
const mockGeminiClient = {
  models: {
    generateContent: vi.fn(),
    generateImages: vi.fn(),
  }
};

vi.mock('../utils/geminiClient', () => ({
  getGeminiClient: () => mockGeminiClient
}));

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ data: [], error: null })),
    })),
    insert: vi.fn(() => ({ data: null, error: null })),
  })),
};

vi.mock('../utils/supabaseClient', () => ({
  supabase: mockSupabaseClient
}));

// Import components after mocking
import { AIStoryGenerator } from '../components/AIStoryGenerator';
import { SunoLyricsGenerator } from '../components/SunoLyricsGenerator';
import { TextToImageGenerator } from '../components/TextToImageGenerator';
import { AIConceptGenerator } from '../components/AIConceptGenerator';
import { WebsiteStrategyGenerator } from '../components/WebsiteStrategyGenerator';
import { AudioTranscriber } from '../components/AudioTranscriber';
import { HashtagManager } from '../components/HashtagManager';

describe('AI Features MVP Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AI Story Generator', () => {
    const defaultProps = {
      selectedHashtags: [{ name: '#music', count: '1M', size: 'Large' as const }],
      onPromptGenerated: vi.fn(),
      language: 'en' as const,
      aiContext: '',
      ragSources: [],
      user: null,
      onAttemptGeneration: vi.fn((fn) => fn()),
      onContentGenerated: vi.fn(),
    };

    it('should render story generator interface', () => {
      render(<AIStoryGenerator {...defaultProps} />);

      expect(screen.getByText('Hashtags for Your Story (1)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate AI Story/i })).toBeInTheDocument();
    });

    it('should show error when no hashtags selected', async () => {
      const propsWithoutHashtags = { ...defaultProps, selectedHashtags: [] };
      render(<AIStoryGenerator {...propsWithoutHashtags} />);

      const generateButton = screen.getByRole('button', { name: /Generate AI Story/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Please select some hashtags first/i)).toBeInTheDocument();
      });
    });

    it('should call Gemini API and display generated story', async () => {
      const mockResponse = {
        text: '{"title": "Digital Dreams", "story": "An inspiring story about music and technology..."}'
      };
      mockGeminiClient.models.generateContent.mockResolvedValue(mockResponse);

      render(<AIStoryGenerator {...defaultProps} />);

      const generateButton = screen.getByRole('button', { name: /Generate AI Story/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Digital Dreams')).toBeInTheDocument();
        expect(screen.getByText(/inspiring story about music/i)).toBeInTheDocument();
      });

      expect(mockGeminiClient.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          config: expect.objectContaining({
            responseMimeType: 'application/json'
          })
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error');
      mockGeminiClient.models.generateContent.mockRejectedValue(mockError);

      render(<AIStoryGenerator {...defaultProps} />);

      const generateButton = screen.getByRole('button', { name: /Generate AI Story/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/An error occurred: API Error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Suno Lyrics Generator', () => {
    const defaultProps = {
      onPromptGenerated: vi.fn(),
      language: 'en' as const,
      aiContext: '',
      ragSources: [],
      user: null,
      onAttemptGeneration: vi.fn((fn) => fn()),
      onContentGenerated: vi.fn(),
    };

    it('should render lyrics generator interface', () => {
      render(<SunoLyricsGenerator {...defaultProps} />);

      expect(screen.getByLabelText('Describe Your Song')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate Suno Lyrics/i })).toBeInTheDocument();
    });

    it('should show error when no topic provided', async () => {
      render(<SunoLyricsGenerator {...defaultProps} />);

      const generateButton = screen.getByRole('button', { name: /Generate Suno Lyrics/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Please describe the song's theme or topic/i)).toBeInTheDocument();
      });
    });

    it('should generate lyrics with valid input', async () => {
      const mockResponse = {
        text: '{"title": "Synthwave Night", "lyrics": "[Verse]\\nCruising through the neon lights\\n[Chorus]\\nSynthwave night..."}'
      };
      mockGeminiClient.models.generateContent.mockResolvedValue(mockResponse);

      render(<SunoLyricsGenerator {...defaultProps} />);

      const topicInput = screen.getByLabelText('Describe Your Song');
      await userEvent.type(topicInput, 'A synthwave track about night driving');

      const generateButton = screen.getByRole('button', { name: /Generate Suno Lyrics/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Synthwave Night')).toBeInTheDocument();
        expect(screen.getByText(/Cruising through the neon lights/i)).toBeInTheDocument();
      });
    });
  });

  describe('Text-to-Image Generator', () => {
    const defaultProps = {
      onPromptGenerated: vi.fn(),
      language: 'en' as const,
      aiContext: '',
      ragSources: [],
      user: null,
      onAttemptGeneration: vi.fn((fn) => fn()),
      onContentGenerated: vi.fn(),
    };

    it('should render image generator interface', () => {
      render(<TextToImageGenerator {...defaultProps} />);

      expect(screen.getByLabelText('Describe the image you want to create')).toBeInTheDocument();
      expect(screen.getByText('Aspect Ratio')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate Image/i })).toBeInTheDocument();
    });

    it('should show error when no prompt provided', async () => {
      render(<TextToImageGenerator {...defaultProps} />);

      const generateButton = screen.getByRole('button', { name: /Generate Image/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a prompt to generate an image/i)).toBeInTheDocument();
      });
    });

    it('should generate image with valid prompt', async () => {
      const mockResponse = {
        generatedImages: [{
          image: { imageBytes: 'base64imagedata' }
        }]
      };
      mockGeminiClient.models.generateImages.mockResolvedValue(mockResponse);

      render(<TextToImageGenerator {...defaultProps} />);

      const promptInput = screen.getByLabelText('Describe the image you want to create');
      await userEvent.type(promptInput, 'A futuristic cityscape');

      const generateButton = screen.getByRole('button', { name: /Generate Image/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByAltText('Generated by AI')).toBeInTheDocument();
      });

      expect(mockGeminiClient.models.generateImages).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'imagen-4.0-generate-001',
          config: expect.objectContaining({
            numberOfImages: 1,
            outputMimeType: 'image/jpeg'
          })
        })
      );
    });
  });

  describe('AI Concept Generator', () => {
    const defaultProps = {
      onPromptGenerated: vi.fn(),
      language: 'en' as const,
      aiContext: '',
      ragSources: [],
      user: null,
      onAttemptGeneration: vi.fn((fn) => fn()),
      onContentGenerated: vi.fn(),
    };

    it('should render concept generator interface', () => {
      render(<AIConceptGenerator {...defaultProps} />);

      expect(screen.getByLabelText('Enter a Theme or Keyword')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate AI Concept/i })).toBeInTheDocument();
    });

    it('should generate concept with valid theme', async () => {
      const mockResponse = {
        text: '{"concept": "Digital Entropy", "description": "A mesmerizing exploration of chaos...", "keywords": ["chaos", "digital", "entropy"], "visualPrompts": ["A swirling vortex of data", "Glitched reality fragments", "Algorithmic decay"]}'
      };
      mockGeminiClient.models.generateContent.mockResolvedValue(mockResponse);

      render(<AIConceptGenerator {...defaultProps} />);

      const themeInput = screen.getByLabelText('Enter a Theme or Keyword');
      await userEvent.type(themeInput, 'Entropy');

      const generateButton = screen.getByRole('button', { name: /Generate AI Concept/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Digital Entropy')).toBeInTheDocument();
        expect(screen.getByText(/mesmerizing exploration of chaos/i)).toBeInTheDocument();
        expect(screen.getByText('Keywords')).toBeInTheDocument();
        expect(screen.getByText('Visual Prompts')).toBeInTheDocument();
      });
    });
  });

  describe('Website Strategy Generator', () => {
    const defaultProps = {
      onPromptGenerated: vi.fn(),
      language: 'en' as const,
      aiContext: '',
      ragSources: [],
      user: null,
      onAttemptGeneration: vi.fn((fn) => fn()),
      onContentGenerated: vi.fn(),
    };

    it('should render strategy generator interface', () => {
      render(<WebsiteStrategyGenerator {...defaultProps} />);

      expect(screen.getByText('1. Select Target Audiences')).toBeInTheDocument();
      expect(screen.getByLabelText('2. Describe Your Work')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate AI Website Strategy/i })).toBeInTheDocument();
    });

    it('should show error when inputs missing', async () => {
      render(<WebsiteStrategyGenerator {...defaultProps} />);

      const generateButton = screen.getByRole('button', { name: /Generate AI Website Strategy/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Please select at least one target audience and describe your work/i)).toBeInTheDocument();
      });
    });

    it('should generate strategy with valid inputs', async () => {
      const mockResponse = {
        text: '{"mainGoal": "Convert visitors into fans", "keySections": [{"name": "Portfolio", "contentIdeas": ["Showcase latest work"]}], "toneAndStyle": "Modern and engaging", "callToAction": {"text": "Join Newsletter", "description": "Build fan base"}, "targetAudienceEngagement": [{"target": "General Fans", "strategy": "Emotional connection through storytelling"}]}'
      };
      mockGeminiClient.models.generateContent.mockResolvedValue(mockResponse);

      render(<WebsiteStrategyGenerator {...defaultProps} />);

      // Select target audience
      const fansButton = screen.getByRole('button', { name: 'General Fans' });
      fireEvent.click(fansButton);

      // Enter description
      const descInput = screen.getByLabelText('2. Describe Your Work');
      await userEvent.type(descInput, 'Electronic music producer creating ambient soundscapes');

      const generateButton = screen.getByRole('button', { name: /Generate AI Website Strategy/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('🎯 Main Goal')).toBeInTheDocument();
        expect(screen.getByText('Convert visitors into fans')).toBeInTheDocument();
      });
    });
  });

  describe('Audio Transcriber', () => {
    const defaultProps = {
      onPromptGenerated: vi.fn(),
      language: 'en' as const,
      aiContext: '',
      ragSources: [],
      user: null,
      onAttemptGeneration: vi.fn((fn) => fn()),
      onContentGenerated: vi.fn(),
    };

    // Mock MediaRecorder
    const mockMediaRecorder = {
      start: vi.fn(),
      stop: vi.fn(),
      ondataavailable: vi.fn(),
      onstop: vi.fn(),
    };

    beforeEach(() => {
      // Mock getUserMedia
      Object.defineProperty(window.navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }]
          }),
        },
        writable: true,
      });

      // Mock MediaRecorder
      global.MediaRecorder = vi.fn().mockImplementation(() => mockMediaRecorder);
    });

    it('should render audio transcriber interface', () => {
      render(<AudioTranscriber {...defaultProps} />);

      expect(screen.getByText('Audio Transcriber')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start Recording/i })).toBeInTheDocument();
    });

    it('should start recording when button clicked', async () => {
      render(<AudioTranscriber {...defaultProps} />);

      const startButton = screen.getByRole('button', { name: /Start Recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(window.navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
        expect(screen.getByText('Recording...')).toBeInTheDocument();
      });
    });
  });

  describe('Hashtag Manager', () => {
    const defaultProps = {
      hashtagCategories: [{
        category: 'Music',
        hashtags: [
          { name: '#music', count: '1M', size: 'Large' as const },
          { name: '#beats', count: '500K', size: 'Medium' as const }
        ]
      }],
      readySets: [{
        id: '1',
        title: 'Electronic Music',
        hashtags: ['#electronic', '#edm', '#techno'],
        category: 'Music',
        size: 'Large' as const,
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }],
      selectedHashtags: new Set(),
      onHashtagSelect: vi.fn(),
      onSelectSet: vi.fn(),
    };

    it('should render hashtag manager interface', () => {
      render(<HashtagManager {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Explore' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cloud View' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ready Sets' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'URL Generator' })).toBeInTheDocument();
    });

    it('should display hashtag categories in explore view', () => {
      render(<HashtagManager {...defaultProps} />);

      expect(screen.getByText('Music')).toBeInTheDocument();
      expect(screen.getByText('#music')).toBeInTheDocument();
      expect(screen.getByText('#beats')).toBeInTheDocument();
    });

    it('should switch to ready sets view', () => {
      render(<HashtagManager {...defaultProps} />);

      const readySetsButton = screen.getByRole('button', { name: 'Ready Sets' });
      fireEvent.click(readySetsButton);

      expect(screen.getByText('Electronic Music')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      mockGeminiClient.models.generateContent.mockRejectedValue(networkError);

      const props = {
        selectedHashtags: [{ name: '#test', count: '1K', size: 'Small' as const }],
        onPromptGenerated: vi.fn(),
        language: 'en' as const,
        aiContext: '',
        ragSources: [],
        user: null,
        onAttemptGeneration: vi.fn((fn) => fn()),
        onContentGenerated: vi.fn(),
      };

      render(<AIStoryGenerator {...props} />);

      const generateButton = screen.getByRole('button', { name: /Generate AI Story/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/An error occurred: Network error/i)).toBeInTheDocument();
      });
    });

    it('should handle malformed JSON responses', async () => {
      const invalidResponse = { text: 'invalid json' };
      mockGeminiClient.models.generateContent.mockResolvedValue(invalidResponse);

      const props = {
        selectedHashtags: [{ name: '#test', count: '1K', size: 'Small' as const }],
        onPromptGenerated: vi.fn(),
        language: 'en' as const,
        aiContext: '',
        ragSources: [],
        user: null,
        onAttemptGeneration: vi.fn((fn) => fn()),
        onContentGenerated: vi.fn(),
      };

      render(<AIStoryGenerator {...props} />);

      const generateButton = screen.getByRole('button', { name: /Generate AI Story/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/An error occurred/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during generation', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockGeminiClient.models.generateContent.mockReturnValue(pendingPromise);

      const props = {
        selectedHashtags: [{ name: '#test', count: '1K', size: 'Small' as const }],
        onPromptGenerated: vi.fn(),
        language: 'en' as const,
        aiContext: '',
        ragSources: [],
        user: null,
        onAttemptGeneration: vi.fn((fn) => fn()),
        onContentGenerated: vi.fn(),
      };

      render(<AIStoryGenerator {...props} />);

      const generateButton = screen.getByRole('button', { name: /Generate AI Story/i });
      fireEvent.click(generateButton);

      // Should show loading state
      expect(screen.getByText('Crafting Story...')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!({ text: '{"title": "Test", "story": "Test story"}' });

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });
  });
});