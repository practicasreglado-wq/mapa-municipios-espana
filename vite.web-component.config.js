import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/web-component.js',
      name: 'SpainMap',
      fileName: (format) => `spain-map.${format === 'es' ? 'js' : 'umd.js'}`,
      formats: ['es', 'umd']
    },
    outDir: 'dist/component',
    rollupOptions: {
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
