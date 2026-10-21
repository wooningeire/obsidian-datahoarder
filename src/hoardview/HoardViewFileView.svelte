<script lang="ts">
import type { HoardView } from "./HoardView";
import HoardTaskView from "./HoardTaskView.svelte";
import { HoardViewStore } from "./HoardViewStore.svelte";
import TaskDetails from "./task-details/TaskDetails.svelte";
import TaskCalendar from "../lib/datahoard/TaskCalendar.svelte";
import TimeTrackingStatus from "./TimeTrackingStatus.svelte";
import TimePeriodDetails from "./task-details/TimePeriodDetails.svelte";
import TaskCreateBar from "./TaskCreateBar.svelte";
import CollectionRecords from "./CollectionRecords.svelte";

let {
    view,
}: {
    view: HoardView,
} = $props();


// svelte-ignore state_referenced_locally
const store = HoardViewStore.mount(view);

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

    const nTasks = store.visibleTasks.length;
    const startN = Math.max(
        0,
        Math.min(
            Math.floor(hoardviewTaskListScrollTop / rowHeight),
            nTasks - 1,
        ),
    );
    return {
        startN,
        endN: startN + Math.floor(hoardviewTaskListClientHeight / rowHeight) + 1,
    };
});


</script>

<hoardview-container>
    <hoardview-file-view>
        <hoardview-tasks>
            <hoardview-file-tabs>
                {#each store.views as view, index}
                    <button
                        onclick={() => {
                            store.viewIndex = index;
                            hoardviewTaskListScrollTop = 0;
                            if (hoardviewTaskListEl) hoardviewTaskListEl.scrollTop = 0;
                        }}
                        aria-pressed={store.viewIndex === index}
                    >{view.name}</button>
                {/each}
            </hoardview-file-tabs>

            {#if store.error}
                <p role="alert">{store.error}</p>
            {:else if store.collectionView && store.collectionView.type !== "calendar"}
                <task-list-panel>
                    <TaskCreateBar />

                    {#if store.collectionView.type !== "list"}
                        {#key store.viewIndex}
                            <CollectionRecords />
                        {/key}
                    {:else}
                    <hoardview-task-list-scroller
                        onscroll={(event: Event) => {
                            hoardviewTaskListScrollTop = (event.currentTarget as HTMLElement).scrollTop;
                        }}
                        bind:clientHeight={null, height => hoardviewTaskListClientHeight = height!}
                        bind:this={hoardviewTaskListEl}
                    >
                        <hoardview-task-list
                            style:--n-entries={store.visibleTasks.length}
                        >
                            {#each store.visibleTasks.slice(hoardviewTaskListBounds.startN, hoardviewTaskListBounds.endN) as task, i (task.id)}
                                <HoardTaskView
                                    {task}
                                    index={i + hoardviewTaskListBounds.startN}
                                />
                            {:else}
                                {store.pb.ready ? "no tasks" : "loading"}
                            {/each}
                        </hoardview-task-list>
                    </hoardview-task-list-scroller>
                    {/if}
                </task-list-panel>
            {:else if store.collectionView}
                <calendar-panel>
                    <TimeTrackingStatus />
                    <TaskCalendar
                        tasks={store.visibleTasks}
                        timePeriods={store.visiblePeriods}
                        onSelectPeriod={store.selectPeriod}
                    />
                </calendar-panel>
            {/if}
        </hoardview-tasks>

        <task-details-panel>
            {#if store.selectedTask !== null}
                <TaskDetails task={store.selectedTask} />
            {:else if store.selectedPeriod}
                <TimePeriodDetails />
            {:else}
                no task selected
            {/if}
        </task-details-panel>
    </hoardview-file-view>
</hoardview-container>

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
    place-items: stretch;

    height: 100%;

    > * {
        min-width: 0;
        min-height: 0;
    }
}

hoardview-tasks,
task-details-panel {
    display: flex;
    flex-direction: column;
    align-items: stretch;
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

task-list-panel {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
}

hoardview-task-list {
    display: grid;
    grid-auto-rows: 2em;
    height: calc(2em * var(--n-entries));

    --n-entries: 0;
}

hoardview-workspace {
    display: grid;
    grid-template-rows: 1fr 1fr;
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
