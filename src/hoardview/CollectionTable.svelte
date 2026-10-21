<script lang="ts">
import { HoardViewStore } from "./HoardViewStore.svelte";
import TaskClock from "../lib/datahoard/TaskClock.svelte";
import TaskNoteLink from "./TaskNoteLink.svelte";
import TaskField from "./TaskField.svelte";

let { columns, rows }: { columns: string[], rows: number[] } = $props();
const store = HoardViewStore.use();
</script>


<div
    class="records"
    role="table"
    aria-label={store.collectionView.name}
    aria-rowcount={store.visibleTasks.length + 1}
    aria-colcount={columns.length + 2}
    style:--field-count={columns.length}
>
    <div class="table-row header" role="row">
        <div role="columnheader">Open</div>
        {#each columns as column}
            <div role="columnheader">{column}</div>
        {/each}
        <div role="columnheader">Actions</div>
    </div>
    <div class="virtual-rows" role="rowgroup" style:height="{store.visibleTasks.length * 2}em">
        {#each rows as index (store.visibleTasks[index]!.id)}
            {@const task = store.visibleTasks[index]!}
            <div
                class="table-row"
                role="row"
                aria-rowindex={index + 2}
                aria-selected={store.selectedTaskId === task.id}
                style:grid-area="{index + 1} / 1"
            >
                <div role="cell">
                    <button onclick={() => store.selectTask(task.id)}>Open</button>
                </div>
                {#each columns as column}
                    <div role="cell" title={store.valueForTask(task, column)}>
                        <TaskField {task} {column} />
                    </div>
                {/each}
                <div class="actions" role="cell">
                    <TaskNoteLink {task} />
                    <TaskClock compact taskId={task.id} />
                </div>
            </div>
        {:else}
            {store.pb.ready ? "no tasks" : "loading"}
        {/each}
    </div>
</div>


<style lang="scss">
.records {
    min-width: calc(var(--field-count) * 10rem + 19rem);

    .virtual-rows {
        display: grid;
        grid-auto-rows: 2em;
    }

    .table-row {
        display: grid;
        grid-template-columns: 5rem repeat(var(--field-count), minmax(10rem, 1fr)) 14rem;
        align-items: center;
        height: 2em;

        > div {
            min-width: 0;
            padding-inline: 0.25rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    .header {
        position: sticky;
        top: 0;
        z-index: 1;
        background: var(--background-primary);
    }

    button {
        max-width: 100%;
        overflow: hidden;
        text-align: start;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    [aria-selected="true"] {
        outline: 0.0625rem solid currentColor;
        outline-offset: -0.0625rem;
    }
}
</style>
