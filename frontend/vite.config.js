import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Forward catalog requests to the backend during development
    proxy: {
      '/api': process.env.API_PROXY_TARGET || 'http://localhost:4000',
    },
  },
});
