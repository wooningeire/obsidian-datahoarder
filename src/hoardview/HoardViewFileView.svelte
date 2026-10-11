<script lang="ts">
import type { DatahoarderDbOps } from "../dbOps/DatahoarderDbOps";
import { onMount } from "svelte";
import { type TFile } from "obsidian";
import type { HoardView } from "hoard-view/HoardView";
import HoardFileView from "./HoardFileView.svelte";
import { HoardViewStore } from "./HoardViewStore.svelte";
import { getLeafTasks } from "./leafTasks";

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

let hoardviewTaskListEl: HTMLElement | null = $state(null);
let hoardviewTaskListScrollTop = $state(0);
let hoardviewTaskListClientHeight = $state(1);
let hoardviewTaskListBounds = $derived.by(() => {
    if (hoardviewTaskListEl === null) {
        return {
            startN: 0,
            endN: 0,
        }
    }

    const style = getComputedStyle(hoardviewTaskListEl);
    const fontSize = parseFloat(style.fontSize.replaceAll(/[^\d.]/g, ""));

    const rowHeight = 2 * fontSize;

    const startN = Math.floor(hoardviewTaskListScrollTop / rowHeight);
    return {
        startN,
        endN: startN + Math.floor(hoardviewTaskListClientHeight / rowHeight) + 1,
    };
});
</script>

{#if files === null}
    Something went wrong
{:else}
    <hoardview-file-view>
        <h2>Task list</h2>

        <hoardview-task-list-scroller
            onscroll={() => {
                hoardviewTaskListScrollTop = hoardviewTaskListEl!.scrollTop;
            }}
            bind:clientHeight={null, height => hoardviewTaskListClientHeight = height!}
            bind:this={hoardviewTaskListEl}
        >
            <hoardview-task-list
                style:--n-entries={leafTasks.length}
            >
                {#each leafTasks.slice(hoardviewTaskListBounds.startN, hoardviewTaskListBounds.endN) as { file, frontmatter }, i (file.path)}
                    <HoardFileView
                        {file}
                        {frontmatter}
                        index={i + hoardviewTaskListBounds.startN}
                    />
                {:else}
                    no leaf tasks
                {/each}
            </hoardview-task-list>
        </hoardview-task-list-scroller>
    </hoardview-file-view>
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
hoardview-file-view {
    display: flex;
    flex-direction: column;
    gap: 0.5em;

    min-height: 100%;
}

hoardview-task-list-scroller {
    display: block;

    width: 100%;
    height: 30em;
    overflow-x: hidden;
    overflow-y: auto;
}

hoardview-task-list {
    display: block;
    position: relative;
    height: calc(2em * var(--n-entries));

    --n-entries: 0;
}
</style>
