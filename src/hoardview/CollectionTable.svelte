<script lang="ts">
import { HoardViewStore } from "./HoardViewStore.svelte";
import TaskClock from "../lib/datahoard/TaskClock.svelte";
import TaskNoteLink from "./TaskNoteLink.svelte";
import TaskField from "./TaskField.svelte";
import type { Task } from "../lib/pb";

let {
    columns,
    rows,
}: {
    columns: string[],
    rows: number[],
} = $props();


const store = HoardViewStore.use();

let submitting = $state(false);
let error = $state("");

let newTask = $state<Partial<Task>>({});

const createTask = async (): Promise<void> => {
    const label = newTask.label?.trim();
    if (submitting || !store.pb.ready || store.pb.busy || !label) return;

    submitting = true;
    error = "";
    await store.pb.run(async () => {
        await store.createTask({ ...newTask, label });
        newTask = {};
    });
    
    submitting = false;
    error = store.pb.error;
};
</script>


<collection-table
    role="table"
    aria-label={store.collectionView?.name}
    aria-rowcount={store.visibleTasks.length + 2}
    aria-colcount={columns.length + 2}
    style:--field-count={columns.length}
>
    <table-sticky-header role="rowgroup">
        <column-list-row role="row" aria-rowindex={1}>
            <div role="columnheader"></div>
            {#each columns as column}
                <div role="columnheader">{column}</div>
            {/each}
            <div role="columnheader">Actions</div>
        </column-list-row>

        <create-task-row role="row" aria-rowindex={2} aria-busy={submitting}>
            <div role="cell">
                <button
                    disabled={!store.pb.ready || store.pb.busy || !newTask.label?.trim()}
                    onclick={createTask}
                >{submitting ? "Creating…" : "Create"}</button>
            </div>

            {#each columns as column}
                <div role="cell">
                    <TaskField
                        task={newTask}
                        {column}
                        onSave={patch => newTask = { ...newTask, ...patch }}
                    />
                </div>
            {/each}

            <div role="cell" title={error}>
                <span role="status">{error}</span>
            </div>
        </create-task-row>
    </table-sticky-header>
    
    <collection-table-rows
        role="rowgroup"
        style:height="{(store.visibleTasks.length + 1) * 2}em"
    >
        {#each rows as index (store.visibleTasks[index]!.id)}
            {@const task = store.visibleTasks[index]!}
            <entry-row
                role="row"
                aria-rowindex={index + 3}
                aria-selected={store.selectedTaskId === task.id}
                style:grid-area="{index + 1} / 1"
            >
                <div role="cell">
                    <button onclick={() => store.selectTask(task.id)}>Open</button>
                </div>

                {#each columns as column}
                    <div role="cell" title={store.valueForTask(task, column)}>
                        <TaskField
                            {task}
                            {column}
                        />
                    </div>
                {/each}

                <div class="actions" role="cell">
                    <TaskNoteLink {task} />

                    <TaskClock
                        compact
                        taskId={task.id}
                    />
                </div>
            </entry-row>
        {:else}
            {store.pb.ready ? "no tasks" : "loading"}
        {/each}
    </collection-table-rows>
</collection-table>


<style lang="scss">
collection-table {
    display: block;
    min-width: calc(var(--field-count) * 10rem + 19rem);

    collection-table-rows {
        display: grid;
        grid-auto-rows: 2em;
    }

    column-list-row,
    create-task-row,
    entry-row {
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

    table-sticky-header {
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
