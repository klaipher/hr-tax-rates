import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Той самий механізм, що в сусідньому застосунку, з однією різницею: цей
// живе в підкаталозі сайту, а не в корені. Тому базовий шлях приходить
// змінною цілком — воркфлоу складає його з шляху Pages і назви каталогу.
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
