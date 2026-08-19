<script lang="ts">
  import { config } from "./config";
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
          <th>Members</th>
        </tr>
      </thead>
      <tbody>
        {#each config.team as member (member.id)}
          <tr>
            <td>{member.name}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>
