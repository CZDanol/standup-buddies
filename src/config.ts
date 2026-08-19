import type { Config } from "./domain/types";

declare global {
  interface Window {
    standupConfig?: Config;
  }
}

function loadConfig(): Config {
  const config = window.standupConfig;
  if (!config) {
    throw new Error("Missing window.standupConfig");
  }
  return config;
}

/** The runtime configuration from public/config.js */
export const config = loadConfig();
