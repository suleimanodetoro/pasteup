import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this project under /pasteup/
export default defineConfig({
  base: '/pasteup/',
  plugins: [react()],
})
