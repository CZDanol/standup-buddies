import { SpecialSpeakingState } from "../domain/types";
import { meeting, type SpeakingState } from "../meeting.svelte";

// Sasha Trubetskoy's distinct-colors list, pre-darkened to 80% for the dark theme.
const attendeeColors = [
  "#b8143c",
  "#30903c",
  "#ccb414",
  "#364fad",
  "#c46827",
  "#741890",
  "#35aac3",
  "#c028b8",
  "#99bf37",
  "#c898aa",
  "#387a73",
  "#b098cc",
  "#7b4f1d",
  "#ccc8a0",
  "#660000",
  "#88cc9c",
  "#666600",
  "#ccad8e",
];

/** Color of the given speaking state, identical across all charts. */
export function stateColor(state: SpeakingState): string {
  switch (state) {
    case SpecialSpeakingState.Pause:
      // Pause is never charted; the color is arbitrary.
      return "#000";
    case SpecialSpeakingState.Mayhem:
      // Deliberately off-palette so Mayhem never impersonates an attendee.
      return "#808080";
    default: {
      // Colors follow the current speaking order, not the roster order.
      const index = meeting.order.indexOf(state);
      return attendeeColors[index % attendeeColors.length];
    }
  }
}
