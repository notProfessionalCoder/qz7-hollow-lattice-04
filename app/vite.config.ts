/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Tauri 开发服务器固定 1420 端口
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  envPrefix: ["VITE_", "TAURI_ENV_"],
  // three.js 单包较大；本地桌面应用，不在意首屏体积
  build: { target: "es2022", outDir: "dist", chunkSizeWarningLimit: 1500 },
  test: { environment: "jsdom" },
});
