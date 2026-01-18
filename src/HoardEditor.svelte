<script lang="ts">
import type { Database } from "sql.js";
import { onMount } from "svelte";
let {
    db,
}: {
    db: Database,
} = $props();
    
const results = $derived(db.exec("SELECT * FROM Goals"));

</script>

{#each results[0]?.values as goal}
    {goal[1]}
{/each}

<style>
</style>
