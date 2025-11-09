import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Mock environment variables
beforeAll(() => {
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.VITE_GOOGLE_API_KEY = 'test-google-api-key';
  process.env.VITE_SENTRY_DSN = 'test-sentry-dsn';
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

// Mock Audio API
class AudioContextMock {
  createOscillator = vi.fn();
  createGain = vi.fn();
  createAnalyser = vi.fn();
  createMediaStreamSource = vi.fn();
  close = vi.fn();
  suspend = vi.fn();
  resume = vi.fn();
  destination = {};
}

global.AudioContext = AudioContextMock as any;
global.webkitAudioContext = AudioContextMock as any;

// Mock MediaDevices
global.navigator.mediaDevices = {
  getUserMedia: vi.fn(),
  enumerateDevices: vi.fn().mockResolvedValue([]),
  getDisplayMedia: vi.fn(),
  getSupportedConstraints: vi.fn().mockReturnValue({}),
  ondevicechange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
} as any;

// Suppress console errors in tests unless needed
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});