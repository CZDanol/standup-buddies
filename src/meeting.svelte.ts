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

/** Display label of the given speaking state. */
export function speakingStateLabel(state: SpeakingState): string {
  switch (state) {
    case SpecialSpeakingState.Pause:
      return "Pause";
    case SpecialSpeakingState.Mayhem:
      return "Mayhem";
    default:
      return state.name;
  }
}

/** Short mark of the given speaking state: attendee initials ("John Doe" -> "JD"). */
export function speakingStateInitials(state: SpeakingState): string {
  switch (state) {
    case SpecialSpeakingState.Pause:
      return "-";
    case SpecialSpeakingState.Mayhem:
      return "#";
    default:
      return state.name
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0].toUpperCase())
        .join("");
  }
}

/** One finished run of a single speaking state. */
export interface SpeakingStateSegment {
  state: SpeakingState;
  startMs: number;
  endMs: number;
}

/** The runtime state of today's standup. */
export class Meeting {
  readonly title: string;

  readonly attendees: readonly Attendee[];

  /** When the meeting page was opened. */
  readonly startedAtMs = Date.now();

  /** When off, the speaking order is simply the roster order. */
  readonly shuffleEnabled: boolean;

  seed = $state(defaultSeed());

  private speakingState_ = $state<SpeakingState>(SpecialSpeakingState.Pause);
  private lastSpeaker_ = $state<Attendee | null>(null);
  private speakingStateSince = $state(Date.now());
  private now = $state(Date.now());
  /** Accumulated time per speaking state, excluding the current run. */
  private speakingStateDurationsMs = new SvelteMap<SpeakingState, number>();
  private speakingStateHistory_ = $state<SpeakingStateSegment[]>([]);

  constructor() {
    const config = window.standupConfig;
    if (!config) {
      throw new Error("Missing window.standupConfig");
    }
    this.title = config.title;
    this.shuffleEnabled = config.shuffle ?? true;
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
    this.speakingStateDurationsMs.set(this.speakingState_, this.speakingTimeMs(this.speakingState_));
    if (this.now > this.speakingStateSince) {
      this.speakingStateHistory_.push({
        state: this.speakingState_,
        startMs: this.speakingStateSince,
        endMs: this.now,
      });
    }
    this.speakingStateSince = this.now;
    this.speakingState_ = next;
    if (next instanceof Attendee) {
      this.lastSpeaker_ = next;
    }
  }

  /**
   * The attendee who most recently held the floor, kept over pauses and mayhems.
   * Before anyone has spoken it is the first present attendee in the order;
   * null only when nobody is present.
   */
  get lastSpeaker(): Attendee | null {
    return this.lastSpeaker_ ?? this.order.find((a) => a.isPresent) ?? null;
  }

  /** Finished speaking runs, oldest first; the still-running state is not included. */
  get speakingStateHistory(): readonly SpeakingStateSegment[] {
    return this.speakingStateHistory_;
  }

  /** Activates the given speaking state, or pauses if it is already active. */
  toggleSpeakingState(state: SpeakingState): void {
    if (this.speakingState_ !== state)
      this.speakingState = state;

    else if (state === SpecialSpeakingState.Pause && this.lastSpeaker)
      // Unpause - return to the last speaker
      this.speakingState = this.lastSpeaker;

    else
      this.speakingState = SpecialSpeakingState.Pause;
  }

  /**
   * The nearest present attendee in the given direction from the last
   * speaker, or null past either end.
   */
  adjacentSpeaker(step: 1 | -1): Attendee | null {
    const order = this.order;
    const reference = this.lastSpeaker;
    // No reference means nobody is present, so there is no adjacent speaker either.
    if (!reference) return null;

    let index = order.indexOf(reference) + step;
    for (; index >= 0 && index < order.length; index += step) {
      if (order[index].isPresent) {
        return order[index];
      }
    }
    return null;
  }

  /** Whether advance(step) has anywhere to go. */
  canAdvance(step: 1 | -1): boolean {
    return (
      this.adjacentSpeaker(step) !== null ||
      // Stepping past either end pauses, which is a change only while not paused.
      this.speakingState_ !== SpecialSpeakingState.Pause
    );
  }

  /**
   * Moves one present attendee over in the speaking order.
   * While paused only the pending speaker changes; otherwise the floor moves,
   * and stepping past either end pauses.
   */
  advance(step: 1 | -1): void {
    const adjacent = this.adjacentSpeaker(step);
    if (!adjacent) {
      this.speakingState = SpecialSpeakingState.Pause;
    } else if (this.speakingState_ === SpecialSpeakingState.Pause) {
      this.lastSpeaker_ = adjacent;
    } else {
      this.speakingState = adjacent;
    }
  }

  /** Total time spent in the given speaking state. */
  speakingTimeMs(state: SpeakingState): number {
    const accumulated = this.speakingStateDurationsMs.get(state) ?? 0;
    const live =
      this.speakingState_ === state ? this.now - this.speakingStateSince : 0;
    return accumulated + live;
  }

  /** Attendees in speaking order. */
  readonly order: readonly Attendee[] = $derived.by(() => {
    // Reading `attendees` is safe only because $derived evaluates lazily:
    if (!this.shuffleEnabled) {
      return this.attendees;
    }
    const pinned = this.attendees.filter((a) => a.isPinned);
    const rest = this.attendees.filter((a) => !a.isPinned);
    return [...pinned, ...seededShuffle(rest, this.seed)];
  });
}

/** The shuffle seed a meeting starts with. */
function defaultSeed(): string {
  // Today's date, so each day gets its own order. A trailing space so
  // extending the seed keeps the date readable.
  return new Date().toLocaleDateString("sv-SE") + " ";
}

/** The meeting driven by this page. */
export const meeting = new Meeting();
