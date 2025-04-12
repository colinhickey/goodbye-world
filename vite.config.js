import { defineConfig } from 'vite';

export default defineConfig({
  base: 'goodbye-world', // This should match your GitHub repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure assets are copied to dist
    copyPublicDir: true,
  }
});