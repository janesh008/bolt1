import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/admin': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/orders': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/cart': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/wishlist': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});