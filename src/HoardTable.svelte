<script lang="ts">
import HoardRow from "HoardRow.svelte";
import ColumnSettingsMenu from "ColumnSettingsMenu.svelte";
import TableSettingsMenu from "TableSettingsMenu.svelte";
import Popover from "Popover.svelte";

let {
    table,
    columns,
    rows,
    cells,
    onAddColumn,
    onUpdateColumn,
    onUpdateTable,
    onAddRow,
    onUpdateCell,
}: {
    table: any,
    columns: any[],
    rows: any[],
    cells: any,
    onAddColumn: ({ tableId, label, datatype }: { tableId: number, label: string, datatype: string }) => number,
    onUpdateColumn: ({ columnId, label, datatype }: { columnId: number, label?: string, datatype?: string }) => void,
    onUpdateTable: ({ tableId, label }: { tableId: number, label?: string }) => void,
    onAddRow: (tableId: number) => void,
    onUpdateCell: (rowId: number, columnId: number, value: string) => void,
} = $props();

let activeColumnId = $state<number | null>(null);
let editingTable = $state(false);
</script>


<div class="table-view">
    <div class="table-header">
        <button
            class="table-title"
            onclick={() => editingTable = !editingTable}
        >
            <h3>{table.label}</h3>
        </button>
        
        <Popover active={editingTable}>
            <TableSettingsMenu
                table={table}
                {onUpdateTable}
                onClose={() => editingTable = false}
            />
        </Popover>
    </div>

    <div class="table-stats">
        {rows.length} rows
    </div>
    
    <button onclick={() => onAddRow(table.id)}>Add row</button>
    
    <div
        class="table-columns"
        style:--n-columns={columns.length}
    >
        {#each columns as column}
            <div class="column-header">
                <button
                    class="column-label"
                    onclick={() => {
                        if (activeColumnId === column.id) {
                            activeColumnId = null;
                        } else {
                            activeColumnId = column.id;
                        }
                    }}
                >
                    {column.label}
                </button>
                
                <Popover active={activeColumnId === column.id}>
                    <ColumnSettingsMenu
                        column={column}
                        {onUpdateColumn}
                        onClose={() => activeColumnId = null}
                    />
                </Popover>
            </div>
        {/each}

        <button onclick={() => {
            const columnId = onAddColumn({ tableId: table.id, label: "", datatype: "text" });
            activeColumnId = columnId;
        }}>+</button>


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
.table-view {
    display: flex;
    flex-direction: column;

    border: 1px solid var(--background-modifier-border);
    border-radius: 0.25rem;
}

.table-header {
    position: relative;
}

.table-columns {
    --n-columns: 1;
    
    display: grid;
    width: 100%;
    grid-template-columns: repeat(calc(var(--n-columns) + 1), auto);
    margin-top: 1rem;
    padding: 0.5rem;

    overflow-x: auto;
}

.column-header {
    position: relative;
}

h3 {
    margin: 0;
}
</style>

