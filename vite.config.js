import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/weiwei-birthday-show/" : "/",
  server: {
    port: 5173,
    strictPort: false,
  },
}));
