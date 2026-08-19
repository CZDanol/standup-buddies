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
}
