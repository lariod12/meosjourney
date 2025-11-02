import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator';

export default defineConfig(({ mode }) => ({
  // Use root base for custom domain (https://meosjourney.info)
  base: '/',
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
    // Fix ipv6 issue with vite about hrm 
    host: '::1', hmr: { host: '[::1]', protocol: 'ws'} }
}));
