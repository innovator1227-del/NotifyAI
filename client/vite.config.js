import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const clientEnv = loadEnv(mode, clientRoot, "");
  const serverEnvPath = resolve(clientRoot, "../server");
  const serverEnv = loadEnv(mode, serverEnvPath, "");
  const port = process.env.API_PORT || clientEnv.API_PORT || serverEnv.PORT || "5000";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: process.env.VITE_PROXY_TARGET || clientEnv.VITE_PROXY_TARGET || `http://localhost:${port}`,
          changeOrigin: true,
        },
      },
    },
  };
});
