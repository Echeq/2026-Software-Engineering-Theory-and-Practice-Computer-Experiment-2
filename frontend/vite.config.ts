import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    manifest: 'manifest.json',
    rollupOptions: {
      input: {
        login: path.resolve(__dirname, 'src/login.ts'),
        dashboard: path.resolve(__dirname, 'src/dashboard.ts'),
        projects: path.resolve(__dirname, 'src/projects.ts'),
        tasks: path.resolve(__dirname, 'src/tasks.ts'),
        settings: path.resolve(__dirname, 'src/settings.ts'),
      },
    },
  },
});
