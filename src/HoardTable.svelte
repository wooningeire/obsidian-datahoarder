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
    
    <button onclick={() => onAddRow(table.id)}>Add row</button>
    
    <div class="table-columns">
        <table>
            <thead>
                <tr>
                    {#each columns as column}
                        <th>{column.label}</th>
                    {/each}
                    <th>
                        <button onclick={() => onAddColumn({ tableId: table.id, label: "wow" })}>+</button>
                    </th>
                </tr>
            </thead>
            <tbody>
                {#each rows as row}
                    <HoardRow
                        row={row}
                        columns={columns}
                        cells={cells}
                        onUpdateCell={onUpdateCell}
                    />
                {/each}
            </tbody>
        </table>
    </div>
</div>