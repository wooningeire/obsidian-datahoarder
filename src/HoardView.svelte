<script lang="ts">
import { onMount } from "svelte";
import type { DatahoarderDbOps } from "./dbOps/DatahoarderDbOps";

import { Notice } from "obsidian";
import HoardTable from "HoardTable.svelte";
import HoardEnum from "HoardEnum.svelte";
import { store } from "Store.svelte";
	import { SvelteMap } from "svelte/reactivity";

let {
    dbOps,
}: {
    dbOps: DatahoarderDbOps,
} = $props();

let modified = $state(false);


let newTableName = $state("");

let columnsByTable = $state<Record<number, ReturnType<typeof dbOps.selectColumns>>>({});
let rowsByTable = $state<Record<number, ReturnType<typeof dbOps.selectRows>>>({});

let cellsByRowByTable = $state<Record<number, Record<number, Record<number, string>>>>({});

let newEnumName = $state("");

const refreshTables = () => {
    try {
        store.tables = dbOps.selectTables();
        for (const table of store.tables.values()) {
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

const refreshEnums = () => {
    try {
        store.enums = dbOps.selectEnums();

        const enumVariantsByEnumId = new SvelteMap<number, any>();
        for (const enumItem of store.enums.values()) {
            enumVariantsByEnumId.set(enumItem.id, dbOps.selectEnumVariants(enumItem.id));
        }
        store.enumVariantsByEnumId = enumVariantsByEnumId;
    } catch (error) {
        console.error("Failed to refresh enums:", error);
        new Notice("Failed to load enums: " + error);
    }
};

onMount(() => {
    refreshTables();
    refreshEnums();
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

const addColumn = ({
    tableId,
    label,
    datatype,
}: {
    tableId: number,
    label: string,
    datatype: string,
}) => {
    const columnId = dbOps.addColumn(tableId, label, datatype);
    refreshTableInfo(tableId);
    modified = true;
    return columnId;
};

const updateColumn = ({
    columnId,
    label,
    datatype,
}: {
    columnId: number,
    label?: string,
    datatype?: string,
}) => {
    if (label) {
        dbOps.updateColumnLabel(columnId, label);
    }
    if (datatype) {
        dbOps.updateColumnDatatype(columnId, datatype);
    }
    refreshTables(); // Or just the specific table info
    modified = true;
};

const addRow = (tableId: number) => {
    dbOps.addRow(tableId);
    refreshTableInfo(tableId);
    modified = true;
};

const updateCell = (rowId: number, columnId: number, value: string) => {
    if (!cellsByRowByTable[rowId]) cellsByRowByTable[rowId] = {};
    cellsByRowByTable[rowId][columnId] = value;
    
    dbOps.updateCell(rowId, columnId, value);
    modified = true;
};

const save = async () => {
    await dbOps.save();
    modified = false;
};

const createEnum = () => {
    if (!newEnumName) return;
    try {
        dbOps.createEnum(newEnumName);
        newEnumName = "";
        refreshEnums();
        modified = true;
        new Notice("Enum created");
    } catch (e) {
        console.error("Failed to create enum:", e);
        new Notice("Failed to create enum: " + e);
    }
}

const addEnumVariant = (enumId: number, label: string) => {
    const variantId = dbOps.addEnumVariant(enumId, label);
    store.enumVariantsByEnumId.set(enumId, dbOps.selectEnumVariants(enumId));
    modified = true;
    return variantId;
};

const updateEnumVariant = (variantId: number, label: string) => {
    dbOps.updateEnumVariantLabel(variantId, label);
    refreshEnums();
    modified = true;
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
    
    
    <h2>Enums</h2>

    <div class="create-enum">
        <input
            type="text"
            bind:value={newEnumName}
            placeholder="New enum name"
        />
        <button onclick={createEnum}>Create enum</button>
    </div>

    <div class="enums-list">
        {#each store.enums.values() as enumItem}
            <HoardEnum
                enumData={enumItem}
                variants={store.enumVariantsByEnumId.get(enumItem.id) ?? []}
                onAddVariant={addEnumVariant}
                onUpdateVariant={updateEnumVariant}
            />
        {/each}
    </div>

    <h2>Tables</h2>

    <div class="create-table">
        <input
            type="text"
            bind:value={newTableName}
            placeholder="New table name"
        />
        <button onclick={createTable}>Create table</button>
    </div>

    <div class="tables-list">
        {#each store.tables.values() as table}
            <HoardTable
                table={table}
                columns={columnsByTable[table.id] ?? []}
                rows={rowsByTable[table.id] ?? []}
                cells={cellsByRowByTable[table.id] ?? {}}
                onAddColumn={addColumn}
                onUpdateColumn={updateColumn}
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

.create-table {
    display: flex;
    gap: 0.5rem;
}

.tables-list {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.create-enum {
    display: flex;
    gap: 0.5rem;
}

.enums-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

h2 {
    margin: 0;
}
</style>
