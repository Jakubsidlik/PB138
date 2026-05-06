import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
<<<<<<< Updated upstream
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
=======
>>>>>>> Stashed changes
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
<<<<<<< Updated upstream
  plugins: [
    TanStackRouterVite(),
    react()
  ],
=======
  plugins: [react()],
>>>>>>> Stashed changes
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
