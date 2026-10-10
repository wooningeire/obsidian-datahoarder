<script lang="ts">
import type { DatahoarderDbOps } from "../dbOps/DatahoarderDbOps";
import { onMount } from "svelte";
import { type TFile } from "obsidian";
import type { HoardView } from "HoardView";
import HoardFileView from "./HoardFileView.svelte";
import { HoardViewStore } from "./HoardViewStore.svelte";
import { getLeafTasks } from "./HoardView/leafTasks";

let {
    files,
    view,
}: {
    dbOps: DatahoarderDbOps,
    onChange: (content: string) => void,
    files: TFile[] | null,
    view: HoardView,
} = $props();

let loadedFileContent = $state<string | null>(null);
let metadataRevision = $state(0);
const leafTasks = $derived.by(() => {
    metadataRevision;
    return getLeafTasks(files ?? [], view.app.metadataCache);
});

onMount(() => {
    const metadataCache = view.app.metadataCache;
    const refresh = () => { metadataRevision += 1; };
    const changedRef = metadataCache.on("changed", file => {
        if (files?.some(taskFile => taskFile.path === file.path)) refresh();
    });
    const resolvedRef = metadataCache.on("resolved", refresh);

    return () => {
        metadataCache.offref(changedRef);
        metadataCache.offref(resolvedRef);
    };
});

// onMount(() => {
//     store.dbOps = dbOps;
//     store.refreshTables();
// });

HoardViewStore.mount({
    view,
});
</script>

{#if files === null}
    Something went wrong
{:else}
    <hoard-view-file-view>
        {#each leafTasks as { file, frontmatter } (file.path)}
            <HoardFileView {file} {frontmatter} />
        {:else}
            <p>No leaf tasks.</p>
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

<style lang="scss">
hoard-view-file-view {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;

    min-height: 100%;
}
</style>
