import { SpecialSpeakingState, type Config, type MemberConfig } from "./domain/types";
import { seededShuffle } from "./domain/shuffle";

declare global {
  interface Window {
    standupConfig?: Config;
  }
}


/** One member's participation in the meeting. */
export class Attendee {
  readonly config: MemberConfig;
  private readonly meeting: Meeting;
  isPresent = $state(true);

  constructor(member: MemberConfig, meeting: Meeting) {
    this.config = member;
    this.meeting = meeting;
  }

  /** Marks the attendee present or missing. */
  setPresent(present: boolean): void {
    this.isPresent = present;
    // A missing member cannot keep the floor.
    if (!present && this.isSpeaking) {
      this.meeting.speakingState = SpecialSpeakingState.Pause;
    }
  }

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get isPinned(): boolean {
    return this.config.pinned ?? false;
  }

  get isSpeaking(): boolean {
    return this.meeting.speakingState === this;
  }
}

/** Who currently has the floor: one attendee, or a meeting-wide mode. */
export type SpeakingState = Attendee | SpecialSpeakingState;

/** The runtime state of today's standup. */
export class Meeting {
  readonly title: string;
  readonly attendees: readonly Attendee[];
  seed = $state(defaultSeed());
  speakingState = $state<SpeakingState>(SpecialSpeakingState.Pause);

  constructor() {
    const config = window.standupConfig;
    if (!config) {
      throw new Error("Missing window.standupConfig");
    }
    this.title = config.title;
    this.attendees = config.team.map((member) => new Attendee(member, this));
  }

  /** Attendees in speaking order for the current seed. */
  get order(): Attendee[] {
    const pinned = this.attendees.filter((a) => a.isPinned);
    const rest = this.attendees.filter((a) => !a.isPinned);
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
