/**
 * Shape of the runtime configuration.
 */
export interface Config {
  title: string;
  team: MemberConfig[];

  /**
   * Whether the speaking order is shuffled. Defaults to true;
   * when false, the order is simply the roster order.
   */
  shuffle?: boolean;
}

export interface MemberConfig {
  id: string;
  name: string;

  /**
   * Whether this member is excluded from the shuffle. Defaults to false.
   */
  pinned?: boolean;
}

/**
 * A meeting-wide speaking state that is not tied to one attendee.
 * Note: declared here (a plain .ts module) because Svelte's native TS
 * support cannot compile enum declarations in .svelte/.svelte.ts files.
 */
export enum SpecialSpeakingState {
  Pause = "pause",
  Mayhem = "mayhem",
}
