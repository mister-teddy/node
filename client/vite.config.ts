import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { spawn } from "child_process";
import { readdir, rename, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "build-apps",
      async closeBundle() {
        const child = spawn(
          "npx",
          ["vite", "build", "--config", "vite.apps.config.ts"],
          { stdio: "inherit", shell: true }
        );
        child.on("close", async (code) => {
          if (code !== 0) {
            console.error(`apps build failed with code ${code}`);
            return;
          }
          // Move files from output-apps/apps to output/apps
          const srcDir = join(
            process.cwd(),
            "node_modules",
            "p2p_apps",
            "apps"
          );
          const destDir = join(process.cwd(), "output", "apps");
          if (existsSync(srcDir)) {
            try {
              await mkdir(destDir, { recursive: true });
              const files = await readdir(srcDir);
              for (const file of files) {
                const srcFile = join(srcDir, file);
                const destFile = join(destDir, file);
                await rename(srcFile, destFile);
              }
              console.log("Moved app files to output/apps");
            } catch (err) {
              console.error("Failed to move app files:", err);
            }
          }
        });
      },
    },
  ],
  build: {
    outDir: "output",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  worker: {
    format: "es",
  },
  optimizeDeps: {
    exclude: ["sqlocal"],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
