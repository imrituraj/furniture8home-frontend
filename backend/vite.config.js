import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds the admin dashboard (admin/) into dist/, which the Express server serves in production.
export default defineConfig({
  root: 'admin',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
