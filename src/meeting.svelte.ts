import { SvelteMap } from "svelte/reactivity";
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

  /** Total time this attendee has held the floor. */
  get speakingTimeMs(): number {
    return this.meeting.speakingTimeMs(this);
  }
}

/** Who currently has the floor: one attendee, or a meeting-wide mode. */
export type SpeakingState = Attendee | SpecialSpeakingState;

/** The runtime state of today's standup. */
export class Meeting {
  readonly title: string;
  readonly attendees: readonly Attendee[];
  seed = $state(defaultSeed());
  private speakingState_ = $state<SpeakingState>(SpecialSpeakingState.Pause);
  private speakingStateSince = $state(Date.now());
  private now = $state(Date.now());
  /** Accumulated time per speaking state, excluding the current run. */
  private speakingStateTimesMs = new SvelteMap<SpeakingState, number>();

  constructor() {
    const config = window.standupConfig;
    if (!config) {
      throw new Error("Missing window.standupConfig");
    }
    this.title = config.title;
    this.attendees = config.team.map((member) => new Attendee(member, this));
    // Repaint tick only — elapsed time is computed from timestamps, so a
    // throttled background tab cannot corrupt the totals.
    setInterval(() => {
      this.now = Date.now();
    }, 500);
  }

  get speakingState(): SpeakingState {
    return this.speakingState_;
  }

  set speakingState(next: SpeakingState) {
    // Bank the time spent in the outgoing state before switching.
    // Refreshing `now` must come first:
    // speakingTimeMs computes the live portion from it,
    // and banking must include time up to this instant, not up to the last repaint tick.
    this.now = Date.now();
    this.speakingStateTimesMs.set(this.speakingState_, this.speakingTimeMs(this.speakingState_));
    this.speakingStateSince = this.now;
    this.speakingState_ = next;
  }

  /** Total time spent in the given speaking state. */
  speakingTimeMs(state: SpeakingState): number {
    const accumulated = this.speakingStateTimesMs.get(state) ?? 0;
    const live =
      this.speakingState_ === state ? this.now - this.speakingStateSince : 0;
    return accumulated + live;
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
