import type { Config as IConfig, Member } from "./domain/types";
import { seededShuffle } from "./domain/shuffle";

declare global {
  interface Window {
    standupConfig?: IConfig;
  }
}

// Declaration merging: the interface gives the class all ConfigData fields
// without redeclaring them; Object.assign fills them in at runtime.
export interface Config extends IConfig { }
export class Config {
  constructor(data: IConfig) {
    Object.assign(this, data);
  }

  /** The shuffle seed the page starts with. */
  defaultSeed(): string {
    // Today's date, so each day gets its own order. A trailing space so
    // extending the seed keeps the date readable.
    return new Date().toLocaleDateString("sv-SE") + " ";
  }

  /**
   * The speaking order for a given seed: members with `shuffle: false`
   * first (in config order), then everyone else, deterministically shuffled.
   */
  buildOrder(seed: string): Member[] {
    const pinned = this.team.filter((m) => m.shuffle === false);
    const shuffled = seededShuffle(
      this.team.filter((m) => m.shuffle !== false),
      seed,
    );
    return [...pinned, ...shuffled];
  }
}

function loadConfig(): Config {
  const data = window.standupConfig;
  if (!data) {
    throw new Error("Missing window.standupConfig");
  }
  return new Config(data);
}

/** The runtime configuration from public/config.js, validated once at startup. */
export const config = loadConfig();
