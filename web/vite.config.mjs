// web/vite.config.mjs
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/', // ✅ 显式设置 base 路径
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  }
});