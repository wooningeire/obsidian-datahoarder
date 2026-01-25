<script lang="ts">
import { onMount } from "svelte";
import type { DatahoarderDbOps } from "../dbOps/DatahoarderDbOps";

import HoardTable from "./HoardTable.svelte";
import HoardEnum from "./HoardEnum.svelte";
import { store } from "./Store.svelte";

let {
    dbOps,
}: {
    dbOps: DatahoarderDbOps,
} = $props();

let newTableName = $state("");
let newEnumName = $state("");

onMount(() => {
    store.dbOps = dbOps;
    store.refreshTables();
    store.refreshEnums();
});

const createTable = () => {
    if (!newTableName) return;
    store.createTable(newTableName);
    newTableName = "";
};

const createEnum = () => {
    if (!newEnumName) return;
    store.createEnum(newEnumName);
    newEnumName = "";
};
</script>

<div class="hoard-editor">
    <div class="controls">
        <button
            onclick={() => store.save()}
            disabled={!store.modified}
        >
            Save
        </button>
    </div>
    
    
    <h2>Enums</h2>

    <div class="create-enum">
        <input
            type="text"
            bind:value={newEnumName}
            placeholder="New enum name"
        />
        <button onclick={createEnum}>Create enum</button>
    </div>

    <div class="enums-list">
        {#each store.enums.values() as enumItem}
            <HoardEnum
                enumData={enumItem}
            />
        {/each}
    </div>

    <h2>Tables</h2>

    <div class="create-table">
        <input
            type="text"
            bind:value={newTableName}
            placeholder="New table name"
        />
        <button onclick={createTable}>Create table</button>
    </div>

    <div class="tables-list">
        {#each store.tables.values() as table}
            <HoardTable
                table={table}
            />
        {/each}
    </div>
</div>

<style>
.hoard-editor {
    padding: 1rem;
}

.create-table {
    display: flex;
    gap: 0.5rem;
}

.tables-list {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.create-enum {
    display: flex;
    gap: 0.5rem;
}

.enums-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

h2 {
    margin: 0;
}
</style>
