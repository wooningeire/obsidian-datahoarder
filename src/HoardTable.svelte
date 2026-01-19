<script lang="ts">
import HoardRow from "HoardRow.svelte";

let {
    table,
    columns,
    rows,
    cells,
    onAddColumn,
    onAddRow,
    onUpdateCell,
}: {
    table: any,
    columns: any[],
    rows: any[],
    cells: any,
    onAddColumn: ({ tableId, label }: { tableId: number, label: string }) => void,
    onAddRow: (tableId: number) => void,
    onUpdateCell: (rowId: number, columnId: number, value: string) => void,
} = $props();
</script>


<div class="table-view">
    <h3>{table.label}</h3>

    <div class="table-stats">
        {rows.length} rows
    </div>
    
    <button onclick={() => onAddRow(table.id)}>Add row</button>
    
    <div
        class="table-columns"
        style:--n-columns={columns.length}
    >
        {#each columns as column}
            <div class="column-label">{column.label}</div>
        {/each}

        <button onclick={() => onAddColumn({ tableId: table.id, label: "wow" })}>+</button>


        {#each rows as row}
            <HoardRow
                row={row}
                columns={columns}
                cells={cells}
                onUpdateCell={onUpdateCell}
            />

            <div></div>
        {/each}
    </div>

    <button onclick={() => onAddRow(table.id)}>Add row</button>
</div>

<style lang="scss">
.table-columns {
    --n-columns: 1;
    
    display: grid;
    grid-template-columns: repeat(calc(var(--n-columns) + 1), auto);

    margin-top: 1rem;
    padding: 0.5rem;
    border: 1px solid #0000003f;
}

.column-label {
    font-weight: 700;
}
</style>
