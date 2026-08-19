import { SpecialSpeakingState } from "../domain/types";
import { meeting, type SpeakingState } from "../meeting.svelte";

/**
 * The shared chart palette (ApexCharts' default hues, reordered).
 * The first slot is reserved for Mayhem so its color never depends on the
 * attendee count; attendees take the remaining slots in roster order.
 */
export const seriesPalette = [
  "#FF4560",
  "#008FFB",
  "#00E396",
  "#FEB019",
  "#775DD0",
  "#546E7A",
  "#26A69A",
  "#D10CE8",
];

/** Color of the given speaking state, identical across all charts. */
export function stateColor(state: SpeakingState): string {
  switch (state) {
    case SpecialSpeakingState.Pause:
      // Pause is never charted; the color is arbitrary.
      return "#808080";
    case SpecialSpeakingState.Mayhem:
      return seriesPalette[0];
    default: {
      const attendeeSlots = seriesPalette.length - 1;
      const index = meeting.attendees.indexOf(state);
      return seriesPalette[1 + (index % attendeeSlots)];
    }
  }
}
