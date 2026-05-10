import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator';

export default defineConfig(({ mode }) => ({
  // Relative production assets support both custom domain and GitHub Pages project URL.
  base: mode === 'production' ? './' : '/',
  plugins: [
    react(),
    // Temporarily disabled obfuscator to test build
    // mode === 'production' && obfuscatorPlugin({...})
  ].filter(Boolean),
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    cssMinify: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    host: '0.0.0.0', // Expose to network
    port: 5555,
    allowedHosts: [
      '.trycloudflare.com'
    ],
    hmr: {
      protocol: 'ws'
    }
  }
}));
