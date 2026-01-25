<script lang="ts">
import HoardRow from "./HoardRow.svelte";
import ColumnSettingsMenu from "./ColumnSettingsMenu.svelte";
import TableSettingsMenu from "./TableSettingsMenu.svelte";
import Popover from "./Popover.svelte";
import { store } from "./Store.svelte";

let {
    table,
}: {
    table: any,
} = $props();

let columns = $derived(store.columnsByTable[table.id] ?? []);
let rows = $derived(store.rowsByTable[table.id] ?? []);
let cells = $derived(store.cellsByRowByTable[table.id] ?? {});

let activeColumnId = $state<number | null>(null);
let editingTable = $state(false);

let draggedColumnId = $state<number | null>(null);
let dropTargetIndex = $state<number | null>(null);

const handleDragStart = (event: DragEvent, columnId: number) => {
    draggedColumnId = columnId;
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', columnId.toString());
    }
};

const handleDragOver = (event: DragEvent, index: number) => {
    event.preventDefault();
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
    }
    dropTargetIndex = index;
}

const handleDragLeave = () => {
    dropTargetIndex = null;
}

const handleDrop = (event: DragEvent, targetIndex: number) => {
    event.preventDefault();
    
    if (draggedColumnId === null) return;
    
    const draggedIndex = columns.findIndex(column => column.id === draggedColumnId);
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
        resetDragState();
        return;
    }
    
    const newColumns = [...columns];
    const [draggedColumn] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedColumn);
    
    store.reorderColumns(table.id, newColumns.map(column => column.id));
    
    resetDragState();
};

const handleDragEnd = () => {
    resetDragState();
};

const resetDragState = () => {
    draggedColumnId = null;
    dropTargetIndex = null;
};
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
                onClose={() => editingTable = false}
            />
        </Popover>
    </div>

    <div class="table-stats">
        {rows.length} rows
    </div>
    
    <button onclick={() => store.addRow(table.id)}>Add row</button>
    
    <div
        class="table-columns"
        style:--n-columns={columns.length}
    >
        <div></div>

        {#each columns as column, columnIndex}
            <div
                class="column-header"
                class:dragging={draggedColumnId === column.id}
                class:drop-target={dropTargetIndex === columnIndex && draggedColumnId !== column.id}
                draggable="true"
                role="button"
                tabindex="0"
                ondragstart={event => handleDragStart(event, column.id)}
                ondragover={event => handleDragOver(event, columnIndex)}
                ondragleave={handleDragLeave}
                ondrop={event => handleDrop(event, columnIndex)}
                ondragend={handleDragEnd}
            >
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
                        tableId={table.id}
                        onClose={() => activeColumnId = null}
                    />
                </Popover>
            </div>
        {/each}

        <button onclick={() => {
            const columnId = store.addColumn({ tableId: table.id, label: "", datatype: "text" });
            activeColumnId = columnId;
        }}>+</button>


        {#each rows as row}
            <HoardRow
                {row}
                {columns}
                {cells}
                tableId={table.id}
            />

            <div></div>
        {/each}
    </div>

    <button onclick={() => store.addRow(table.id)}>Add row</button>
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
    grid-template-columns: repeat(calc(var(--n-columns) + 2), auto);
    margin-top: 1rem;
    padding: 0.5rem;

    overflow-x: auto;
}

.column-header {
    position: relative;

    cursor: grab;
    user-select: none;

    transition: opacity 0.15s ease, background-color 0.15s ease;
    
    &:active {
        cursor: grabbing;
    }
    
    &.dragging {
        opacity: 0.25;
    }
    
    &.drop-target::before {
        content: "";

        position: absolute;
        top: 0;
        left: 0;
        width: 0.25rem;
        height: 100%;

        background: var(--interactive-accent);
    }
}

h3 {
    margin: 0;
}
</style>
