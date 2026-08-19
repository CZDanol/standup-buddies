<script lang="ts">
  import { meeting } from "./meeting.svelte";
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
          <th class="is-narrow"></th>
        </tr>
      </thead>
      <tbody>
        {#each meeting.order as attendee, index (attendee.id)}
          <tr>
            <td class="is-narrow" class:has-text-grey={!attendee.present}>
              {index + 1}
            </td>
            <td class:has-text-grey={!attendee.present}>
              <label class="checkbox">
                <input type="checkbox" bind:checked={attendee.present} />
                {attendee.name}
              </label>
            </td>
            <td class="is-narrow"></td>
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
  </div>
</section>
