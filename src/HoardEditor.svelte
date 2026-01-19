<script lang="ts">
	import { onMount } from "svelte";
import type { DatahoarderDbOps } from "./dbOps/DatahoarderDbOps";
let {
    dbOps,
}: {
    dbOps: DatahoarderDbOps,
} = $props();

let modified = $state(false);
let tables = $state<ReturnType<typeof dbOps.selectTables>>([]);



onMount(() => {
    tables = dbOps.selectTables();
});
</script>

<button
    onclick={() => dbOps.save()}
    disabled={!modified}
>Save</button>

<h1>Tables</h1>
<div>{tables.length} tables</div>

{#each tables as table}
    <div>{table.label}</div>
{/each}

<style>
</style>
