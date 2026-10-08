<script lang="ts">
import type { DatahoarderDbOps } from "../dbOps/DatahoarderDbOps";
import { Store, store } from "./Store.svelte";
import { onMount } from "svelte";
import { type TFile } from "obsidian";
import type { HoardView } from "HoardView";
	import HoardFileView from "./HoardFileView.svelte";
	import { HoardViewStore } from "./HoardViewStore.svelte";

let {
    dbOps,
    onChange,
    files,
    view,
}: {
    dbOps: DatahoarderDbOps,
    onChange: (content: string) => void,
    files: TFile[] | null,
    view: HoardView,
} = $props();

let loadedFileContent = $state<string | null>(null);

export const setLoadedFileContent = (content: string) => {
    try {
        const parsed = JSON.parse(content);
        config = parsed;
    } catch (e) {
        if (!content) {
            config = { source: null, columns: [], filters: [], sorts: [] };
        }
    }
    loadedFileContent = content;
};

export const getLoadedFileContent = () => {
    return JSON.stringify(config, null, 2);
};

// Configuration State
let config = $state<{
    source: { type: "table", tableId: number } | null,
    columns: { type: "direct", columnId: number }[],
    filters: { columnId: number, operator: string, value: string }[],
    sorts: { columnId: number, direction: 'asc' | 'desc' }[]
}>({
    source: null,
    columns: [],
    filters: [],
    sorts: []
});

// onMount(() => {
//     store.dbOps = dbOps;
//     store.refreshTables();
// });

HoardViewStore.mount({
    view,
});

const triggerChange = () => {
    onChange(JSON.stringify(config, null, 2));
};

</script>

{#if files === null}
    Something went wrong
{:else}
    <hoard-view-file-view>
        {#each files as file}
            <HoardFileView {file} />
        {/each}
    </hoard-view-file-view>
{/if}

<!-- <div class="hoard-view-file-view">
    <ConfigPanel
        bind:config={config}
        {tables}
        {availableColumns}
        onChange={triggerChange}
    />

    <div class="view-content">
        {#if selectedTable}
            <HoardTable 
                table={selectedTable} 
                displayedColumnIds={config.columns.map(c => c.columnId)}
                displayedRows={processedRows}
            />
        {:else}
            <div class="empty-state">
                Select a data source to begin
            </div>
        {/if}
    </div>
</div> -->

<style>
hoard-view-file-view {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
}
</style>