import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The admin dashboard builds into the storefront's output under /admin/. On Vercel,
// admin.furniture8home.com is rewritten to it (see vercel.json).
export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  build: {
    outDir: '../frontend/dist/admin',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    // Forward API and photo requests to the backend running locally (`npm run dev` in the backend repo)
    proxy: {
      '/api': process.env.API_PROXY_TARGET || 'http://localhost:8787',
      '/media': process.env.API_PROXY_TARGET || 'http://localhost:8787',
      // Catalog images live in the storefront
      '/images': 'http://localhost:5173',
    },
  },
});
