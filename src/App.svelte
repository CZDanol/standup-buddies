<script lang="ts">
  import { meeting, Attendee } from "./meeting.svelte";
  import { SpecialSpeakingState } from "./domain/types";
  import { formatDuration } from "./format";
  import StateTimeline from "./charts/StateTimeline.svelte";
  import TimeSharePie from "./charts/TimeSharePie.svelte";
  import { stateColor } from "./charts/palette";

  let attendeeRows: Record<string, HTMLTableRowElement> = {};

  function ensureSpeakerInView(attendee: Attendee): void {
    // The margin comes from the rows' scroll-margin; see the style block.
    attendeeRows[attendee.id]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }

  $effect(() => {
    const speaker = meeting.speakingState;
    if (speaker instanceof Attendee) {
      ensureSpeakerInView(speaker);
    }
  });
</script>

<svelte:head>
  <title>{meeting.title}</title>
</svelte:head>

<section class="section">
  <div class="container is-max-desktop">
    <h1 class="title">{meeting.title}</h1>

    <table class="table is-fullwidth is-hoverable is-striped">
      <thead>
        <tr>
          <th class="is-narrow">#</th>
          <th>Members</th>
          <th class="is-narrow">
            <div
              class="buttons are-small is-flex-wrap-nowrap is-justify-content-flex-end"
            >
              <button
                class="button"
                class:is-light={meeting.speakingState ===
                  SpecialSpeakingState.Pause}
                title="Pause"
                onclick={() =>
                  meeting.toggleSpeakingState(SpecialSpeakingState.Pause)}
              >
                ⏸
              </button>
              <button
                class="button"
                class:is-danger={meeting.speakingState ===
                  SpecialSpeakingState.Mayhem}
                onclick={() =>
                  meeting.toggleSpeakingState(SpecialSpeakingState.Mayhem)}
              >
                Mayhem ({formatDuration(
                  meeting.speakingTimeMs(SpecialSpeakingState.Mayhem),
                )})
              </button>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {#each meeting.order as attendee, index (attendee.id)}
          <tr
            bind:this={attendeeRows[attendee.id]}
            class:is-warning={attendee.isSpeaking}
            class:has-background-warning-15={!attendee.isSpeaking &&
              attendee === meeting.lastSpeaker}
          >
            <td class="is-narrow" class:has-text-grey={!attendee.isPresent}>
              <svg
                class="mr-2"
                width="4"
                height="24"
                style="vertical-align: middle"
                role="presentation"
              >
                {#if attendee.isPresent}
                  <rect
                    width="4"
                    height="24"
                    rx="2"
                    fill={stateColor(attendee)}
                  />
                {/if}
              </svg>
              {index + 1}
            </td>
            <td class:has-text-grey={!attendee.isPresent}>
              <label class="checkbox">
                <input
                  class="mr-2"
                  type="checkbox"
                  checked={attendee.isPresent}
                  onchange={(event) =>
                    attendee.setPresent(event.currentTarget.checked)}
                />
                {attendee.name}
              </label>
            </td>
            <td class="is-narrow has-text-right">
              {#if attendee.isPresent}
                <button
                  class="button is-small"
                  class:is-light={attendee.isSpeaking}
                  onclick={() => meeting.toggleSpeakingState(attendee)}
                >
                  {attendee.isSpeaking ? "Speaking" : "Speak"}
                  ({formatDuration(attendee.speakingTimeMs)})
                </button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if meeting.shuffleEnabled}
      <div class="field">
        <label class="label" for="seed">Shuffle seed</label>
        <div class="control">
          <input
            id="seed"
            class="input"
            type="text"
            bind:value={meeting.seed}
          />
        </div>
      </div>
    {/if}

    <StateTimeline />
    <TimeSharePie />
  </div>
</section>

<style>
  /* Sanctioned exception #1 to the Bulma-only rule: Bulma sets table cells to
     vertical-align: top and offers no helper to change it. */
  .table td {
    vertical-align: middle;
  }

  /* Sanctioned exception #2: pinned table header, so the speaking-state
     buttons stay reachable while scrolling. Bulma has no sticky helper.
     The explicit background stops rows showing through the pinned header. */
  .table thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--bulma-scheme-main);
  }

  /* Sanctioned exception #3: soften the speaker-highlight change;
     Bulma has no transition helpers. */
  .table tbody tr,
  .table tbody td {
    transition:
      background-color 0.5s ease,
      border-color 0.5s ease,
      color 0.5s ease;
  }

  /* Sanctioned exception #4: breathing room for scrollIntoView(block: "nearest")
     when jumping to the current speaker — scroll-margin has no Bulma helper.
     The top margin is larger to also clear the sticky header. */
  .table tbody tr {
    scroll-margin-top: 8em;
    scroll-margin-bottom: 5em;
  }
</style>
