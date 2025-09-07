import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  // Ensure PWA assets are served correctly
  publicDir: 'public',
  build: {
    // Include service worker and manifest in build
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
}) 