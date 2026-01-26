<script lang="ts">
import HoardTable from "./HoardTable.svelte";
import ConfigPanel from "./HoardView/ConfigPanel.svelte";
import type { DatahoarderDbOps } from "../dbOps/DatahoarderDbOps";
import { store } from "./Store.svelte";
import { onMount } from "svelte";

let {
    dbOps,
    onChange,
}: {
    dbOps: DatahoarderDbOps,
    onChange: (content: string) => void,
} = $props();

let loadedFileContent = $state<string | null>(null);

export const setLoadedFileContent = (content: string) => {
    try {
        const parsed = JSON.parse(content);
        config = parsed;
    } catch (e) {
        if (!content) {
            config = { source: null, columns: [], filters: [], sorts: [] };
        }
    }
    loadedFileContent = content;
};

export const getLoadedFileContent = () => {
    return JSON.stringify(config, null, 2);
};

// Configuration State
let config = $state<{
    source: { type: "table", tableId: number } | null,
    columns: { type: "direct", columnId: number }[],
    filters: { columnId: number, operator: string, value: string }[],
    sorts: { columnId: number, direction: 'asc' | 'desc' }[]
}>({
    source: null,
    columns: [],
    filters: [],
    sorts: []
});

onMount(() => {
    store.dbOps = dbOps;
    store.refreshTables();
});

// Derived State for UI
let tables = $derived(Array.from(store.tables.values()));
let selectedTable = $derived(
    config.source?.type === "table" 
        ? store.tables.get(config.source.tableId) 
        : null
);
let availableColumns = $derived(
    selectedTable 
        ? store.columnsByTable[selectedTable.id] ?? []
        : []
);

let allRows = $derived(
    selectedTable
        ? store.rowsByTable[selectedTable.id] ?? []
        : []
);

let processedRows = $derived.by(() => {
    if (!selectedTable) return [];
    
    let rows = [...allRows];
    
    // Apply Filters
    if (config.filters && config.filters.length > 0) {
        rows = rows.filter(row => {
            return config.filters.every(filter => {
                const cellValue = store.cellsByRowByTable[selectedTable!.id]?.[row.id]?.[filter.columnId] ?? "";
                const filterValue = filter.value.toLowerCase();
                const cellValueLower = cellValue.toLowerCase();

                switch (filter.operator) {
                    case "contains": return cellValueLower.includes(filterValue);
                    case "equals": return cellValueLower === filterValue;
                    case "startsWith": return cellValueLower.startsWith(filterValue);
                    case "endsWith": return cellValueLower.endsWith(filterValue);
                    case "notContains": return !cellValueLower.includes(filterValue);
                    case "notEquals": return cellValueLower !== filterValue;
                    default: return true;
                }
            });
        });
    }

    // Apply Sorts
    if (config.sorts && config.sorts.length > 0) {
        rows.sort((a, b) => {
            for (const sort of config.sorts) {
                const valA = store.cellsByRowByTable[selectedTable!.id]?.[a.id]?.[sort.columnId] ?? "";
                const valB = store.cellsByRowByTable[selectedTable!.id]?.[b.id]?.[sort.columnId] ?? "";
                
                if (valA === valB) continue;
                
                const comparison = valA.localeCompare(valB, undefined, { numeric: true });
                return sort.direction === 'asc' ? comparison : -comparison;
            }
            return 0;
        });
    }

    return rows;
});

const triggerChange = () => {
    onChange(JSON.stringify(config, null, 2));
};

</script>

<div class="hoard-view-file-view">
    <ConfigPanel
        bind:config={config}
        {tables}
        {availableColumns}
        onChange={triggerChange}
    />

    <div class="view-content">
        {#if selectedTable}
            <HoardTable 
                table={selectedTable} 
                displayedColumnIds={config.columns.map(c => c.columnId)}
                displayedRows={processedRows}
            />
        {:else}
            <div class="empty-state">
                Select a data source to begin
            </div>
        {/if}
    </div>
</div>

<style>
    .hoard-view-file-view {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        height: 100%;
    }

    .view-content {
        flex: 1;
        overflow: auto;
        padding: 1rem;
    }

    .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-muted);
    }
</style>