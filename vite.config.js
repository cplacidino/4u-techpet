import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O Vite é a ferramenta que transforma seu código React em algo que o browser entende.
// base: './' é ESSENCIAL para o Electron — sem isso, as URLs quebram no app final.

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
