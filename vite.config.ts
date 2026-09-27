import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    strictPort: true,
  },
  preview: {
    port: 4173,
    host: "0.0.0.0",
  },
  // SPA fallback so /demo and other client routes refresh correctly.
  appType: "spa",
});
