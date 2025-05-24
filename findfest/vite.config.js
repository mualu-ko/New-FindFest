import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Proxy to backend; fallback to localhost if env var is missing
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        // proxy /api to backend without altering path
        // (no rewrite needed; proxies requests as-is to localhost:5000/api/...)
      },
    },
  },
})
