import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { musicCatalogPlugin } from "./build/musicCatalogPlugin";

export default defineConfig({
  plugins: [musicCatalogPlugin(), react(), tailwindcss()],
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true
  }
});
