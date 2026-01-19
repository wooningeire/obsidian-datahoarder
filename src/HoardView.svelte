<script lang="ts">
import { onMount } from "svelte";
import type { DatahoarderDbOps } from "./dbOps/DatahoarderDbOps";

import { Notice } from "obsidian";
	import { error } from "console";
	import HoardTable from "HoardTable.svelte";

let {
    dbOps,
}: {
    dbOps: DatahoarderDbOps,
} = $props();

let modified = $state(false);
let tables = $state<ReturnType<typeof dbOps.selectTables>>([]);
let newTableName = $state("");

let columnsByTable = $state<Record<number, ReturnType<typeof dbOps.selectColumns>>>({});
let rowsByTable = $state<Record<number, ReturnType<typeof dbOps.selectRows>>>({});

let cellsByRowByTable = $state<Record<number, Record<number, Record<number, string>>>>({});

const refreshTables = () => {
    try {
        tables = dbOps.selectTables();
        for (const table of tables) {
            refreshTableInfo(table.id);
        }
    } catch (error) {
        console.error("Failed to refresh tables:", error);
        new Notice("Failed to load tables: " + error);
    }
};

const refreshTableInfo = (tableId: number) => {
    columnsByTable[tableId] = dbOps.selectColumns(tableId);
    rowsByTable[tableId] = dbOps.selectRows(tableId);
    
    const cells = dbOps.selectCells(tableId);
    const cellsByRow: Record<number, Record<number, string>> = {};
    for (const cell of cells) {
        const row: Record<number, string> = cellsByRow[cell.row_id] ?? {};
        row[cell.column_id] = cell.value;
        cellsByRow[cell.row_id] = row;
    }
    cellsByRowByTable[tableId] = cellsByRow;
}

onMount(() => {
    refreshTables();
});

async function createTable() {
    if (!newTableName) return;
    try {
        console.log("Creating table:", newTableName);
        await dbOps.createTable(newTableName);
        newTableName = "";
        refreshTables();
        modified = true;
        new Notice("Table created");
    } catch (e) {
        console.error("Failed to create table:", e);
        new Notice("Failed to create table: " + e);
    }
}

const addColumn = async ({
    tableId,
    label,
}: {
    tableId: number,
    label: string,
}) => {
    await dbOps.addColumn(tableId, label);
    refreshTableInfo(tableId);
    modified = true;
};

const addRow = async (tableId: number) => {
    await dbOps.addRow(tableId);
    refreshTableInfo(tableId);
    modified = true;
};

const updateCell = async (rowId: number, columnId: number, value: string) => {
    if (!cellsByRowByTable[rowId]) cellsByRowByTable[rowId] = {};
    cellsByRowByTable[rowId][columnId] = value;
    
    await dbOps.updateCell(rowId, columnId, value);
    modified = true;
};

const save = async () => {
    await dbOps.save();
    modified = false;
};
</script>

<div class="hoard-editor">
    <div class="controls">
        <button
            onclick={save}
            disabled={!modified}
        >
            Save
        </button>
    </div>

    <div class="create-table">
        <input
            type="text"
            bind:value={newTableName}
            placeholder="New table name"
        />
        <button onclick={createTable}>Create table</button>
    </div>

    <div class="tables-list">
        {#each tables as table}
            <HoardTable
                table={table}
                columns={columnsByTable[table.id] ?? []}
                rows={rowsByTable[table.id] ?? []}
                cells={cellsByRowByTable[table.id] ?? {}}
                onAddColumn={addColumn}
                onAddRow={addRow}
                onUpdateCell={updateCell}
            />
        {/each}
    </div>
</div>

<style>
    .hoard-editor {
        padding: 1rem;
    }
    .controls {
        margin-bottom: 1rem;
    }
    .create-table {
        margin-bottom: 2rem;
        display: flex;
        gap: 0.5rem;
    }
    .tables-list {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }
</style>
