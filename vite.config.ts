import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    const plugins = [react()];

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
              // Audio libraries excluded from vendor bundle to prevent autoplay warnings
              'vendor-google': ['@google/genai'],
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
        __SUPABASE_URL__: JSON.stringify('https://lhgwnrwwhaalojdpkwuo.supabase.co'),
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
      },
      // Test configuration
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['tests/navigation-e2e.test.js'] // Exclude E2E tests that need Playwright
      }
    };
});
