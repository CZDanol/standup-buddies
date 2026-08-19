import { existsSync, readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteSingleFile } from "vite-plugin-singlefile";

/**
 * Injects the standup config into index.html as an inline classic script,
 * so it runs before the app module.
 */
function inlineStandupConfig(): Plugin {
  return {
    name: "inline-standup-config",
    transformIndexHtml() {
      // config.js is gitignored and holds the real team; the example is the fallback.
      const path = existsSync("config.js") ? "config.js" : "config.example.js";
      return [
        {
          tag: "script",
          children: readFileSync(path, "utf8"),
          // Prepended so the config sits at the very top of the built file,
          // where a person editing a deployed copy can find it.
          injectTo: "head-prepend",
        },
      ];
    },
  };
}

export default defineConfig({
  plugins: [
    svelte(),
    inlineStandupConfig(),
    // Inlines all built JS and CSS into dist/index.html — the whole app ships as one file.
    viteSingleFile(),
  ],
  base: "./",
});
