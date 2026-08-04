import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages віддає сайт із підкаталогу репозиторію, Vercel — із кореня.
// Тому базовий шлях задається змінною на етапі збірки, а не зашитий.
const { BASE_PATH } = process.env
const base = BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
