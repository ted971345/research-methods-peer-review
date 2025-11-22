import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 下面這一行是關鍵！沒有它，GitHub Pages 就會找不到檔案
  base: '/research-methods-peer-review/',
})