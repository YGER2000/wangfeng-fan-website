import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  base: './',
  root: '.',
  publicDir: 'public',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 1997,
    strictPort: true,
    allowedHosts: true // 最简单的方式：允许所有主机
  },
  build: {
    outDir: 'dist',
  }
})