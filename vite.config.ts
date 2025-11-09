import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    const plugins = [react()];

    // Add Sentry plugin only in production or when explicitly enabled
    if (mode === 'production' || env.VITE_ENABLE_SENTRY_BUILD === 'true') {
      plugins.push(
        sentryVitePlugin({
          org: env.SENTRY_ORG,
          project: env.SENTRY_PROJECT || 'viral-hashtag-image-ai',
          authToken: env.SENTRY_AUTH_TOKEN,

          // Source maps configuration
          sourcemaps: {
            assets: './dist/**',
            ignore: ['node_modules/**'],
            urlPrefix: '~/assets',
          },

          // Release configuration
          release: {
            name: env.SENTRY_RELEASE || `viral-ai-${Date.now()}`,
            cleanArtifacts: true,
            setCommits: {
              auto: true,
            },
          },

          // Deploy configuration
          deploy: {
            env: mode,
          },

          // Debug mode for development
          debug: mode === 'development',

          // Telemetry
          telemetry: false,
        })
      );
    }

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins,

      // Build configuration for better source maps
      build: {
        sourcemap: true,
        rollupOptions: {
          output: {
            sourcemapExcludeSources: false,
          },
        },
      },

      define: {
        'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID),
        '__SENTRY_DEBUG__': mode === 'development',
        '__SENTRY_TRACING__': true,
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
