<script lang="ts">
import { type TFile } from "obsidian";
import type { HoardView } from "./HoardView";
import HoardFileView from "./HoardFileView.svelte";
import { HoardViewStore } from "./HoardViewStore.svelte";
import TaskDetails from "./task-details/TaskDetails.svelte";
import TaskCalendar from "../lib/datahoard/TaskCalendar.svelte";
import TimeTrackingStatus from "./TimeTrackingStatus.svelte";
import TimePeriodDetails from "./task-details/TimePeriodDetails.svelte";

let {
    files,
    view,
}: {
    files: TFile[] | null,
    view: HoardView,
} = $props();


// svelte-ignore state_referenced_locally
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
    <hoardview-container>
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

            <hoardview-workspace>
                <calendar-panel>
                    <TimeTrackingStatus />
                    <TaskCalendar onSelectPeriod={store.selectPeriod} />
                </calendar-panel>

                <task-details-panel>
                    {#if store.selectedTask !== null}
                        <TaskDetails task={store.selectedTask} />
                    {:else if store.selectedPeriodId}
                        <TimePeriodDetails />
                    {:else}
                        no task selected
                    {/if}
                </task-details-panel>
            </hoardview-workspace>
        </hoardview-file-view>
    </hoardview-container>
{/if}

<style lang="scss">
hoardview-container {
    display: block;
    height: 100%;
    container-type: inline-size;
}

hoardview-file-view {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5em;
    align-items: stretch;

    height: 100%;

    > * {
        min-width: 0;
        min-height: 0;
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

    min-height: 0;
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

hoardview-workspace {
    display: grid;
    grid-template-rows: minmax(10rem, 3fr) minmax(6rem, 1fr);
    gap: 0.75rem;
}

calendar-panel {
    display: flex;
    flex-direction: column;

    min-width: 0;
    min-height: 0;
}

task-details-panel {
    overflow-y: auto;
    overflow-wrap: anywhere;
}

@container (max-width: 48rem) {
    hoardview-file-view {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: 1fr 1fr;
        overflow-y: auto;
    }
}
</style>
