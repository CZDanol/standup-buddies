/**
 * Shape of the runtime configuration in public/config.js.
 */
export interface Config {
  title: string;
  team: MemberConfig[];
}

export interface MemberConfig {
  id: string;
  name: string;

  /**
   * Whether this member is excluded from the shuffle. Defaults to false.
   */
  pinned?: boolean;
}
