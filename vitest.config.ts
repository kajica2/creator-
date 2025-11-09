import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.*',
        '**/types.ts',
        '**/*.d.ts',
        'dist/',
        '.vite/',
        'coverage/',
        'public/',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 75,
        lines: 80,
      },
    },
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@components': resolve(__dirname, './components'),
      '@utils': resolve(__dirname, './utils'),
      '@hooks': resolve(__dirname, './hooks'),
      '@types': resolve(__dirname, './types'),
      '@data': resolve(__dirname, './data'),
      '@services': resolve(__dirname, './services'),
      '@config': resolve(__dirname, './config'),
    },
  },
});