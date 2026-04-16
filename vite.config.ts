import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react({
      // Enable React performance optimizations
      babel: {
        plugins: [],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // Build optimizations
  build: {
    target: "esnext",
    minify: "esbuild",
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          vendor: ["react", "react-dom", "react-i18next"],
          ui: [
            "@/components/ui/button",
            "@/components/ui/dialog",
            "@/components/ui/input",
            "@/components/ui/select",
          ],
          codemirror: [
            "@codemirror/autocomplete",
            "@codemirror/commands",
            "@codemirror/lang-sql",
            "@codemirror/language",
            "@codemirror/state",
            "@codemirror/view",
          ],
          mui: ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
        },
      },
    },
    // Tree shaking
    cssCodeSplit: true,
    // Generate sourcemaps for production builds
    sourcemap: false,
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-i18next",
      "@/components/ui/button",
      "@/components/ui/dialog",
    ],
    exclude: ["@tauri-apps/api"],
  },

  // Production console removal
  esbuild: {
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
}));
