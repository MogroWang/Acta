import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // 相对路径，让同一份 dist 同时适配 Tauri（tauri://localhost）、
  // Capacitor（https://localhost）与 GitHub Pages 的根路径部署。
  base: './',
  plugins: [vue()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
  },
});
