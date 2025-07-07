import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Mobile configuration
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/mobile',
    rollupOptions: {
      input: './src/mobile/main.tsx'
    }
  },
  server: {
    port: 3001,
    host: true,
    open: false
  },
  define: {
    'process.env.VITE_PLATFORM': '"mobile"'
  }
})