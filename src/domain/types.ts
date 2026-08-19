/**
 * Shape of the runtime configuration in public/config.js.
 */
export interface Config {
  title: string;
  team: Member[];
}

export interface Member {
  id: string;
  name: string;
  /**
   * Whether this member takes part in the shuffle. Defaults to true;
   * members with `shuffle: false` are pinned before the shuffled ones,
   * in config order.
   */
  shuffle?: boolean;
}
