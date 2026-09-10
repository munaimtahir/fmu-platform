import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Opt-in: `ANALYZE=1 npm run build` writes dist/bundle-analysis.html.
    // Not run by default so a normal `npm run build` stays fast/side-effect-free.
    process.env.ANALYZE
      ? visualizer({ filename: 'dist/bundle-analysis.html', gzipSize: true, brotliSize: true, open: false })
      : null,
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        // Split the large, rarely-changing vendor libraries out of the main
        // entry chunk so they cache independently of app code and of each
        // other - most routes only need a subset of these.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query', '@tanstack/react-table'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    reporters: 'default',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e', 'test-results', 'playwright-report'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
