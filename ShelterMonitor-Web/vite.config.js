import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base:"/",
  plugins: [react()],
  preview: {
  port: 8080,
  strictPort: true,
 },
  server: {
    host: '0.0.0.0',
    port: 8080,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://app:8080',
        changeOrigin: true
      },
      '/shelters': {
        target: 'http://app:8080',
        changeOrigin: true
      },
      '/maps': {
        target: 'http://app:8080',
        changeOrigin: true
      },
      '/users': {
        target: 'http://app:8080',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://app:8080',
        changeOrigin: true
      }
    }
  },
})

