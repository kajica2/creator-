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

      // Build configuration for performance optimization
      build: {
        sourcemap: mode === 'production' ? false : true, // Disable sourcemaps in production
        target: 'es2015',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production', // Remove console logs in production
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.debug']
          },
          mangle: true,
          format: {
            comments: false
          }
        },
        rollupOptions: {
          output: {
            sourcemapExcludeSources: false,
            // Code splitting strategy
            manualChunks: {
              // Vendor chunks
              'vendor-react': ['react', 'react-dom'],
              'vendor-ui': ['@tanstack/react-query'],
              'vendor-audio': ['tone', '@magenta/music'],
              'vendor-google': ['@google/genai'],
              'vendor-sentry': ['@sentry/react', '@sentry/tracing'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'vendor-utils': ['axios', 'file-saver', 'jszip']
            },
            // Optimize chunk file names
            chunkFileNames: (chunkInfo) => {
              if (chunkInfo.name.includes('vendor')) {
                return 'assets/vendor/[name].[hash].js';
              }
              if (chunkInfo.name.includes('components')) {
                return 'assets/components/[name].[hash].js';
              }
              return 'assets/[name].[hash].js';
            },
            assetFileNames: (assetInfo) => {
              if (assetInfo.name?.endsWith('.css')) {
                return 'assets/css/[name].[hash][extname]';
              }
              if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name || '')) {
                return 'assets/images/[name].[hash][extname]';
              }
              if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name || '')) {
                return 'assets/fonts/[name].[hash][extname]';
              }
              return 'assets/[name].[hash][extname]';
            }
          },
        },
        // Optimize bundle size
        chunkSizeWarningLimit: 1000,
        assetsInlineLimit: 4096 // Inline assets smaller than 4kb
      },

      define: {
        'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID),
        '__SENTRY_DEBUG__': mode === 'development',
        '__SENTRY_TRACING__': true,
      },
      // Performance optimizations
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          '@tanstack/react-query'
        ],
        exclude: [
          'tone', // Lazy load audio dependencies
          '@magenta/music',
          '@google/genai' // Lazy load AI dependencies
        ]
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Enable CSS code splitting
      css: {
        codeSplit: true,
        preprocessorOptions: {
          // Optimize CSS processing
        }
      }
    };
});
