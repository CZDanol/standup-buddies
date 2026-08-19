<script lang="ts">
  import { meeting } from "./meeting.svelte";
  import { SpecialSpeakingState } from "./domain/types";
  import { formatDuration } from "./format";
  import TimeSharePie from "./charts/TimeSharePie.svelte";
</script>

<svelte:head>
  <title>{meeting.title}</title>
</svelte:head>

<section class="section">
  <div class="container is-max-desktop">
    <h1 class="title">{meeting.title}</h1>

    <table class="table is-fullwidth is-hoverable">
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
                class:is-warning={meeting.speakingState ===
                  SpecialSpeakingState.Pause}
                onclick={() =>
                  (meeting.speakingState = SpecialSpeakingState.Pause)}
              >
                Pause
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
          <tr class:is-warning={attendee.isSpeaking}>
            <td class="is-narrow" class:has-text-grey={!attendee.isPresent}>
              {index + 1}
            </td>
            <td class:has-text-grey={!attendee.isPresent}>
              <label class="checkbox">
                <input
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
                  class:is-danger={attendee.isSpeaking}
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

    <div class="field">
      <label class="label" for="seed">Shuffle seed</label>
      <div class="control">
        <input id="seed" class="input" type="text" bind:value={meeting.seed} />
      </div>
    </div>

    <div class="columns is-centered">
      <div class="column is-half">
        <TimeSharePie />
      </div>
    </div>
  </div>
</section>

<style>
  /* Sanctioned exception to the Bulma-only rule: Bulma sets table cells to
     vertical-align: top and offers no helper to change it. */
  .table td {
    vertical-align: middle;
  }
</style>
