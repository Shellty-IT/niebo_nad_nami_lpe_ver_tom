import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist/local',
    emptyOutDir: false,
    target: ['edge94', 'safari17'],
    rollupOptions: { input: { main: 'index.html', benchmark: 'benchmark.html', teacher: 'teacher.html' } },
  },
});
