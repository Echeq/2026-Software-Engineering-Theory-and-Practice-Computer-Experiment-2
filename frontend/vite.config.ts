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
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        signup: path.resolve(__dirname, 'signup.html'),
        dashboard: path.resolve(__dirname, 'dashboard/index.html'),
      },
    },
  },
});
