import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API and uploaded-photo requests to the local Worker (`npm run dev` at the repo root)
    proxy: {
      '/api': process.env.API_PROXY_TARGET || 'http://localhost:8787',
      '/media': process.env.API_PROXY_TARGET || 'http://localhost:8787',
    },
  },
});
