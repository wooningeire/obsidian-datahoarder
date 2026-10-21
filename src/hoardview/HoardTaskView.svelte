<script lang="ts">
import type { Task } from "../lib/pb";
import { HoardViewStore } from "./HoardViewStore.svelte";
import TaskClock from "../lib/datahoard/TaskClock.svelte";
import TaskNoteLink from "./TaskNoteLink.svelte";

let { task, index }: {
    task: Task,
    index: number,
} = $props();

const store = HoardViewStore.use();
</script>


<hoard-task style:grid-area="{index + 1} / 1">
    <button
        class="task-label"
        onclick={() => store.selectTask(task.id)}
        title={task.label}
    >
        {#if store.collectionView?.columns?.length}
            {#each store.collectionView.columns as column}
                {store.valueForTask(task, column)}{" "}
            {/each}
        {:else}
            {task.label || "(untitled)"}
        {/if}
    </button>
    <TaskNoteLink {task} />
    <TaskClock compact taskId={task.id} />
</hoard-task>


<style lang="scss">
hoard-task {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
    height: 2em;

    > .task-label {
        flex: 1;
        min-width: 0;
        
        overflow: hidden;
        text-align: start;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}
</style>
