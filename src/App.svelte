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

  /** Keyboard shortcuts for the navbar controls. */
  function onKeydown(event: KeyboardEvent): void {
    // Leave typing (the seed field) and browser shortcuts alone.
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (
      event.target instanceof Element &&
      event.target.closest("input, textarea, select, [contenteditable]")
    )
      return;

    switch (event.key.toLowerCase()) {
      case "j": {
        const previous = meeting.adjacentSpeakingState(-1);
        if (previous !== null) meeting.speakingState = previous;
        break;
      }

      case "k":
        if (meeting.lastSpeaker)
          meeting.toggleSpeakingState(meeting.lastSpeaker);
        break;

      case "l": {
        const next = meeting.adjacentSpeakingState(1);
        if (next !== null) meeting.speakingState = next;
        break;
      }

      case "m":
        meeting.toggleSpeakingState(SpecialSpeakingState.Mayhem);
        break;

      default:
        return;
    }

    // Keep the handled key from also scrolling or re-activating the focused button.
    event.preventDefault();
  }
</script>

<svelte:head>
  <title>{meeting.title}</title>
</svelte:head>

<svelte:window onkeydown={onKeydown} />

<nav class="navbar is-fixed-top" aria-label="meeting controls">
  <div class="container is-max-desktop">
    <div class="navbar-brand is-flex-grow-1">
      <div class="navbar-item">
        <h1 class="title is-5">{meeting.title}</h1>
      </div>
      <div class="navbar-item ml-auto">
        <div class="buttons are-small is-flex-wrap-nowrap">
          <div class="field has-addons mb-0">
            <p class="control">
              <button
                class="button"
                title="Previous speaker"
                disabled={meeting.adjacentSpeakingState(-1) === null}
                onclick={() =>
                  (meeting.speakingState = meeting.adjacentSpeakingState(-1)!)}
              >
                ⏮
              </button>
            </p>
            <p class="control">
              <span class="button is-static key-hint">J</span>
            </p>
          </div>

          {#if meeting.lastSpeaker}
            <div class="field has-addons mb-0">
              <p class="control">
                <button
                  class="button"
                  class:is-warning={meeting.lastSpeaker.isSpeaking}
                  class:is-dark={meeting.speakingState ===
                    SpecialSpeakingState.Pause}
                  title="Pause / resume"
                  onclick={() =>
                    meeting.toggleSpeakingState(meeting.lastSpeaker!)}
                >
                  {meeting.lastSpeaker.name}
                </button>
              </p>
              <p class="control">
                <span
                  class="button is-static has-text-white has-text-weight-bold duration"
                >
                  {formatDuration(meeting.lastSpeaker.speakingTimeMs)}
                </span>
              </p>
              <p class="control">
                <span class="button is-static key-hint">K</span>
              </p>
            </div>
          {/if}

          <div class="field has-addons mb-0">
            <p class="control">
              <button
                class="button"
                title="Next speaker"
                disabled={meeting.adjacentSpeakingState(1) === null}
                onclick={() =>
                  (meeting.speakingState = meeting.adjacentSpeakingState(1)!)}
              >
                ⏭
              </button>
            </p>
            <p class="control">
              <span class="button is-static key-hint">L</span>
            </p>
          </div>

          <div class="field has-addons">
            <p class="control">
              <button
                class="button"
                class:is-danger={meeting.speakingState ===
                  SpecialSpeakingState.Mayhem}
                onclick={() =>
                  meeting.toggleSpeakingState(SpecialSpeakingState.Mayhem)}
              >
                Mayhem
              </button>
            </p>
            <p class="control">
              <span class="button is-static has-text-text duration">
                {formatDuration(
                  meeting.speakingTimeMs(SpecialSpeakingState.Mayhem),
                )}
              </span>
            </p>
            <p class="control">
              <span class="button is-static key-hint">M</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</nav>

<section class="section pt-4">
  <div class="container is-max-desktop">
    <table class="table is-fullwidth is-hoverable is-striped">
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
                <div class="field has-addons is-justify-content-flex-end">
                  <p class="control">
                    <button
                      class="button is-small"
                      class:is-light={attendee.isSpeaking}
                      onclick={() => meeting.toggleSpeakingState(attendee)}
                    >
                      {attendee.isSpeaking ? "Speaking" : "Speak"}
                    </button>
                  </p>
                  <p class="control">
                    <span
                      class="button is-small is-static has-text-text duration"
                    >
                      {formatDuration(attendee.speakingTimeMs)}
                    </span>
                  </p>
                </div>
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
  /* Bulma sets table cells to vertical-align: top and offers no helper to change it. */
  .table td {
    vertical-align: middle;
  }

  /* Soften the speaker-highlight change; Bulma has no transition helpers. */
  .table tbody tr,
  .table tbody td {
    transition:
      background-color 0.3s ease,
      border-color 0.3s ease,
      color 0.3s ease;
  }

  /* The ticking durations otherwise wobble with every digit change;
     Bulma has no helper for tabular digits. */
  .duration {
    font-variant-numeric: tabular-nums;
  }

  /* Shortcut hints are fine print; Bulma's smallest text size is what the
     small buttons already use, and its buttons have no tighter padding.
     The explicit height keeps the shrunken addon as tall as its neighbors. */
  .key-hint {
    font-size: 0.6em;
    padding-inline: 0.6em;
    height: 100%;
  }

  /* Breathing room for scrollIntoView(block: "nearest") when jumping to the current speaker;
     scroll-margin has no Bulma helper.
     The top margin is larger to also clear the fixed navbar. */
  .table tbody tr {
    scroll-margin-top: 8em;
    scroll-margin-bottom: 5em;
  }
</style>
