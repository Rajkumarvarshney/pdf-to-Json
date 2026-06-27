import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false,
    warmup: {
      // Pre-transform the most important files on server start
      clientFiles: [
        './src/main.jsx',
        './src/App.jsx',
        './src/pages/LandingPage.jsx',
        './src/index.css',
      ],
    },
  },
  optimizeDeps: {
    // Only exclude pdfjs-dist (it's lazy-loaded per upload)
    exclude: ['pdfjs-dist'],
  },
})
