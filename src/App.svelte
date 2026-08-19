<script lang="ts">
  import { config } from "./config";

  let seed = $state(config.defaultSeed());
  const order = $derived(config.buildOrder(seed));
</script>

<svelte:head>
  <title>{config.title}</title>
</svelte:head>

<section class="section">
  <div class="container is-max-desktop">
    <h1 class="title">{config.title}</h1>

    <table class="table is-fullwidth is-hoverable">
      <thead>
        <tr>
          <th class="is-narrow">#</th>
          <th>Members</th>
        </tr>
      </thead>
      <tbody>
        {#each order as member, index (member.id)}
          <tr>
            <td class="is-narrow">{index + 1}</td>
            <td>{member.name}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <div class="field">
      <label class="label" for="seed">Shuffle seed</label>
      <div class="control">
        <input id="seed" class="input" type="text" bind:value={seed} />
      </div>
    </div>
  </div>
</section>
