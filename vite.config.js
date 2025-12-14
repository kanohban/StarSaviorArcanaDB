import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.ts?$/, // This line is actually ignoring the real issue which is .js used as .jsx
    // Correct approach for Vite + React + JS files:
    include: /src\/.*\.[tj]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  // base: './', // Commented out for dev, can enable for build if needed or use conditional config
})
