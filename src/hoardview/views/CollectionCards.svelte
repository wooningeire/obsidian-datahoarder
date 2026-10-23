<script lang="ts">
import { HoardViewStore } from "../HoardViewStore.svelte";
import TaskClock from "../../lib/datahoard/TaskClock.svelte";
import TaskNoteLink from "../task/TaskNoteLink.svelte";
import TaskField from "../task/TaskField.svelte";

let { columns, rows, perRow, rowEm }: {
    columns: string[],
    rows: number[],
    perRow: number,
    rowEm: number,
} = $props();
const store = HoardViewStore.use();
</script>


<div
    class="virtual-rows"
    role="list"
    aria-label={store.collectionView?.name}
    style:--per-row={perRow}
    style:--row-height="{rowEm}em"
    style:height="{Math.ceil(store.visibleTasks.length / perRow) * rowEm}em"
>
    {#each rows as index (index)}
        <div class="card-row" role="presentation" style:grid-area="{index + 1} / 1">
            {#each store.visibleTasks.slice(index * perRow, (index + 1) * perRow) as task, offset (task.id)}
                <article
                    role="listitem"
                    aria-posinset={index * perRow + offset + 1}
                    aria-setsize={store.visibleTasks.length}
                    aria-current={store.selectedTaskId === task.id ? "true" : undefined}
                >
                    <button title={task.label} onclick={() => store.selectTask(task.id)}>{task.label || "(untitled)"}</button>
                    <dl>
                        {#each columns as column}
                            <dt title={column}>{column}</dt>
                            <dd title={store.valueForTask(task, column)}><TaskField {task} {column} /></dd>
                        {/each}
                    </dl>
                    <footer>
                        <TaskNoteLink {task} />
                        <TaskClock compact taskId={task.id} />
                    </footer>
                </article>
            {/each}
        </div>
    {:else}
        {store.pb.ready ? "no tasks" : "loading"}
    {/each}
</div>


<style lang="scss">
.virtual-rows {
    display: grid;
    grid-auto-rows: var(--row-height);

    .card-row {
        display: grid;
        grid-template-columns: repeat(var(--per-row), minmax(0, 1fr));
        gap: 0.5em;
        height: calc(var(--row-height) - 0.5em);
    }

    article {
        display: grid;
        grid-template-rows: 2em minmax(0, 1fr) 2em;
        min-width: 0;
        padding: 0.5em;
        box-sizing: border-box;
        outline: 0.0625rem solid oklch(0.5 0 0 / 0.3);
        outline-offset: -0.0625rem;
    }

    button, dt, dd {
        min-width: 0;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    button {
        text-align: start;
    }

    dl {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        grid-auto-rows: 2em;
        align-items: center;
        margin: 0;
    }

    footer {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        overflow: hidden;
    }

    [aria-current="true"] {
        outline-color: currentColor;
    }
}
</style>
