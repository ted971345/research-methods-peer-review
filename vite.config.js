import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/research-methods-peer-review/', // 這一行非常重要，是讓 GitHub Pages 讀到路徑的關鍵
})