import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [
    svelte(),
  ],
  // Relative asset paths so the built dist/ works from any static host or file://
  base: "./",
});
