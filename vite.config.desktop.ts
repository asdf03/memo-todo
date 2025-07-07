import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Desktop configuration
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/desktop',
    rollupOptions: {
      input: './src/desktop/main.tsx'
    }
  },
  server: {
    port: 3000,
    host: true,
    open: false
  },
  define: {
    'process.env.VITE_PLATFORM': '"desktop"'
  }
})