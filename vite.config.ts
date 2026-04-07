import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages: set base to '/<repo-name>/' e.g. '/mixtastic/'
// For custom domain or local dev, use '/'
export default defineConfig({
  plugins: [react()],
  base: '/mixtastic/',
})
