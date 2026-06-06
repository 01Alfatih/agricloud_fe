import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    // Paksa SATU instance React. Tanpa ini, saat Vite re-optimize dependency
    // di tengah sesi dev, React bisa ke-bundle dobel → error runtime
    // "Cannot read properties of null (reading 'useState')".
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // Pre-bundle React di awal agar tidak ada re-optimize mendadak yang
  // mem-fork instance React saat halaman sedang dibuka.
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
  },
})
