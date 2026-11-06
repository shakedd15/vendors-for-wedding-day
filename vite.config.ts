import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = process.env.VITE_BASE_PATH || env.VITE_BASE_PATH || "/";
  return {
    plugins: [react(), tailwindcss()],
    base: `/${base.split("/").filter(Boolean).join("/")}${base === "/" ? "" : "/"}`,
  };
});
