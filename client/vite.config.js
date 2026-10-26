import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, /api calls are proxied to the Express server so there's no CORS hassle.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // also listen on your WiFi IP so phones on the same network can open it
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
