import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // echarts alone is ~600 kB minified; the warning is noise for a demo.
    chunkSizeWarningLimit: 2000,
  },
});
