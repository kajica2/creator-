import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Create a new QueryClient for each test to ensure isolation
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Mock Supabase client
export const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })),
};

// All the providers for the app
interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

function AllTheProviders({ children, queryClient }: AllTheProvidersProps) {
  const testQueryClient = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Custom render function that includes all providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient }
) => {
  const { queryClient, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  picture: 'https://example.com/avatar.jpg',
  accessToken: 'test-access-token',
  ...overrides,
});

export const createMockHashtag = (overrides = {}) => ({
  name: '#test',
  count: '1000',
  size: 'Medium',
  description: 'Test hashtag',
  ...overrides,
});

export const createMockPersona = (overrides = {}) => ({
  id: 'test-persona-id',
  name: 'Test Persona',
  context: 'Test context for AI generation',
  isDefault: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  contentCount: 0,
  ...overrides,
});

export const createMockPromptHistoryItem = (overrides = {}) => ({
  id: 'test-history-id',
  type: 'AI Story',
  prompt: 'Test prompt',
  timestamp: Date.now(),
  ...overrides,
});

// Utility to wait for async updates
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock fetch responses
export const mockFetchResponse = (data: any, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  });
};

// Mock Google Generative AI
export const mockGoogleAI = {
  getGenerativeModel: vi.fn(() => ({
    generateContent: vi.fn().mockResolvedValue({
      response: {
        text: () => 'Generated AI content',
        candidates: [{ content: { parts: [{ text: 'Generated AI content' }] } }],
      },
    }),
    generateStream: vi.fn().mockResolvedValue({
      stream: (async function* () {
        yield { text: () => 'Streaming ' };
        yield { text: () => 'AI ' };
        yield { text: () => 'content' };
      })(),
    }),
  })),
};