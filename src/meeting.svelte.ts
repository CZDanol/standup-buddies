import type { Config, MemberConfig } from "./domain/types";
import { seededShuffle } from "./domain/shuffle";

declare global {
  interface Window {
    standupConfig?: Config;
  }
}


/** One member's participation in the meeting. */
export class Attendee {
  readonly config: MemberConfig;
  present = $state(true);

  constructor(member: MemberConfig) {
    this.config = member;
  }

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get pinned(): boolean {
    return this.config.pinned ?? false;
  }
}

/** The runtime state of today's standup. */
export class Meeting {
  readonly title: string;
  readonly attendees: readonly Attendee[];
  seed = $state(defaultSeed());

  constructor() {
    const config = window.standupConfig;
    if (!config) {
      throw new Error("Missing window.standupConfig");
    }
    this.title = config.title;
    this.attendees = config.team.map((member) => new Attendee(member));
  }

  /** Attendees in speaking order for the current seed. */
  get order(): Attendee[] {
    const pinned = this.attendees.filter((a) => a.pinned);
    const rest = this.attendees.filter((a) => !a.pinned);
    return [...pinned, ...seededShuffle(rest, this.seed)];
  }
}

/** The shuffle seed a meeting starts with. */
function defaultSeed(): string {
  // Today's date, so each day gets its own order. A trailing space so
  // extending the seed keeps the date readable.
  return new Date().toLocaleDateString("sv-SE") + " ";
}

/** The meeting driven by this page, built from the config in public/config.js. */
export const meeting = new Meeting();
