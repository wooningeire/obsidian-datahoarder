<script lang="ts">
import type { Column } from "dbOps/DatahoarderDbOps";
import {store} from "./Store.svelte";

let {
    column,
    onUpdateColumn,
    onDeleteColumn,
    onClose,
}: {
    column: Column,
    onUpdateColumn: ({
        columnId,
        label,
        datatype,
    }: {
        columnId: number,
        label?: string,
        datatype?: string,
    }) => void,
    onDeleteColumn: (columnId: number) => void,
    onClose: () => void,
} = $props();
</script>

<!-- <svelte:window onclick={() => onClose()} /> -->

<div
    class="column-settings"
>
    <h4>Edit column</h4>

    <div class="column-settings-form">
        <label for="column-label">Label</label>
        <input
            type="text"
            id="column-label"
            bind:value={column.label}
            onchange={event => onUpdateColumn({ columnId: column.id, label: event.currentTarget.value })}
        />

        <label for="column-datatype">Datatype</label>
        <div>
            <input
                type="text"
                id="column-datatype"
                bind:value={column.datatype}
                onchange={event => onUpdateColumn({ columnId: column.id, datatype: event.currentTarget.value })}
            />

            {#if column.datatype.startsWith("enum:")}
                {@const enumId = parseInt(column.datatype.slice("enum:".length))}

                {store.enums.get(enumId)?.label ?? "(invalid enum)"}
            {:else if column.datatype.startsWith("table:")}
                {@const tableId = parseInt(column.datatype.slice("table:".length))}

                {store.tables.get(tableId)?.label ?? "(invalid table)"}
            {/if}
        </div>
    </div>

    <button class="delete-btn" onclick={() => { onDeleteColumn(column.id); onClose(); }}>
        Delete column
    </button>
</div>

<style lang="scss">
.column-settings-form {
    display: grid;
    grid-template-columns: auto auto;
    gap: 0.5rem;
    align-items: center;
}

h4 {
    margin: 0;
}
</style>