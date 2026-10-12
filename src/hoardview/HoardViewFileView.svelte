<script lang="ts">
import type { DatahoarderDbOps } from "../dbOps/DatahoarderDbOps";
import { type TFile } from "obsidian";
import type { HoardView } from "./HoardView";
import HoardFileView from "./HoardFileView.svelte";
import { HoardViewStore } from "./HoardViewStore.svelte";
import TaskDetails from "./task-details/TaskDetails.svelte";

let {
    files,
    view,
}: {
    dbOps: DatahoarderDbOps,
    onChange: (content: string) => void,
    files: TFile[] | null,
    view: HoardView,
} = $props();


const store = HoardViewStore.mount({
    view,
    files,
});

let hoardviewTaskListEl: HTMLElement | null = $state(null);
let hoardviewTaskListScrollTop = $state(0);
let hoardviewTaskListClientHeight = $state(1);
let hoardviewTaskListBounds = $derived.by(() => {
    if (hoardviewTaskListEl === null) {
        return {
            startN: 0,
            endN: 0,
        };
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
        <task-list-panel>
            <h2>Task list</h2>

            <hoardview-task-list-scroller
                onscroll={() => {
                    hoardviewTaskListScrollTop = hoardviewTaskListEl!.scrollTop;
                }}
                bind:clientHeight={null, height => hoardviewTaskListClientHeight = height!}
                bind:this={hoardviewTaskListEl}
            >
                <hoardview-task-list
                    style:--n-entries={store.taskGraph.leafTasks.length}
                >
                    {#each store.taskGraph.leafTasks.slice(hoardviewTaskListBounds.startN, hoardviewTaskListBounds.endN) as { file, frontmatter }, i (file.path)}
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
        </task-list-panel>

        <task-details-panel>
            {#if store.selectedTask !== null}
                <TaskDetails task={store.selectedTask} />
            {:else}
                no task selected
            {/if}
        </task-details-panel>
    </hoardview-file-view>
{/if}

<style lang="scss">
hoardview-file-view {
    display: flex;
    gap: 0.5em;
    align-items: stretch;

    height: 100%;

    > * {
        flex-basis: 0;
        flex-grow: 1;
    }
}

task-list-panel,
task-details-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
}

hoardview-task-list-scroller {
    flex-grow: 1;
    
    display: block;

    width: 100%;
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
