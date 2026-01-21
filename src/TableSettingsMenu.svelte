<script lang="ts">
import type { Table } from "dbOps/DatahoarderDbOps";

let {
    table,
    onUpdateTable,
    onDeleteTable,
    onClose,
}: {
    table: Table,
    onUpdateTable: ({
        tableId,
        label,
    }: {
        tableId: number,
        label?: string,
    }) => void,
    onDeleteTable: (tableId: number) => void,
    onClose: () => void,
} = $props();
</script>

<div class="table-settings">
    <h4>Edit table</h4>

    <div class="table-settings-form">
        <label for="table-label">Label</label>
        <input
            type="text"
            id="table-label"
            bind:value={table.label}
            onchange={event => onUpdateTable({ tableId: table.id, label: event.currentTarget.value })}
        />
    </div>

    <button class="delete-btn" onclick={() => { onDeleteTable(table.id); onClose(); }}>
        Delete table
    </button>
</div>

<style lang="scss">
.table-settings-form {
    display: grid;
    grid-template-columns: auto auto;
    gap: 0.5rem;
    align-items: center;
}

h4 {
    margin: 0;
}
</style>
