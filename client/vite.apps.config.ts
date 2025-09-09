import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import { glob } from "glob";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "node_modules/p2p_apps",
    copyPublicDir: false,
    rollupOptions: {
      input: glob.sync("src/apps/*.tsx", { cwd: __dirname }),
      output: {
        entryFileNames: "apps/[name].js",
        format: "esm",
      },
      preserveEntrySignatures: "strict",
      external: ["react", "react-dom"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
