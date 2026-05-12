import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['super.localhost', 'admin.localhost', '.localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('socket.io-client')) return 'vendor-socket'
          if (id.includes('lucide-react')) return 'vendor-icons'
          if (id.includes('react-dom')) return 'vendor-react-dom'
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('/react/') || id.includes('\\react\\')) return 'vendor-react'
        },
      },
    },
  },
})
