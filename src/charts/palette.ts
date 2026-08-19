import { SpecialSpeakingState } from "../domain/types";
import { meeting, type SpeakingState } from "../meeting.svelte";

const attendeeColors = [
  "#e6194B",
  "#3cb44b",
  "#ffe119",
  "#4363d8",
  "#f58231",
  "#911eb4",
  "#42d4f4",
  "#f032e6",
  "#bfef45",
  "#fabed4",
  "#469990",
  "#dcbeff",
  "#9A6324",
  "#fffac8",
  "#800000",
  "#aaffc3",
  "#808000",
  "#ffd8b1",
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
