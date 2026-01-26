<script lang="ts">
import HoardTable from "./HoardTable.svelte";
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

// Actions
const setTableSource = (tableId: number) => {
    config.source = { type: "table", tableId };
    config.columns = []; // Reset columns when table changes
    config.filters = [];
    config.sorts = [];
    triggerChange();
};

const toggleColumn = (columnId: number, checked: boolean) => {
    if (checked) {
        config.columns.push({ type: "direct", columnId });
    } else {
        config.columns = config.columns.filter(c => c.columnId !== columnId);
    }
    triggerChange();
};

const addFilter = () => {
    if (availableColumns.length > 0) {
        config.filters.push({ columnId: availableColumns[0].id, operator: "contains", value: "" });
        triggerChange();
    }
};

const updateFilter = (index: number, key: keyof typeof config.filters[number], value: any) => {
    (config.filters[index] as any)[key] = value;
    triggerChange();
};

const removeFilter = (index: number) => {
    config.filters.splice(index, 1);
    triggerChange();
};

const addSort = () => {
    if (availableColumns.length > 0) {
        config.sorts.push({ columnId: availableColumns[0].id, direction: "asc" });
        triggerChange();
    }
};

const updateSort = (index: number, key: keyof typeof config.sorts[number], value: any) => {
    (config.sorts[index] as any)[key] = value;
    triggerChange();
};

const removeSort = (index: number) => {
    config.sorts.splice(index, 1);
    triggerChange();
};

const triggerChange = () => {
    onChange(JSON.stringify(config, null, 2));
};

</script>

<div class="hoard-view-file-view">
    <div class="config-panel">
        <div class="section">
            <h3>Source</h3>
            <select 
                value={config.source?.tableId ?? ""} 
                onchange={(e) => setTableSource(Number(e.currentTarget.value))}
            >
                <option value="" disabled>Select a table</option>
                {#each tables as table}
                    <option value={table.id}>{table.label}</option>
                {/each}
            </select>
        </div>

        {#if selectedTable}
            <div class="section">
                <h3>Columns</h3>
                <div class="scroll-list">
                    {#each availableColumns as column}
                        <label>
                            <input 
                                type="checkbox" 
                                checked={config.columns.some(c => c.columnId === column.id)}
                                onchange={(e) => toggleColumn(column.id, e.currentTarget.checked)}
                            />
                            {column.label}
                        </label>
                    {/each}
                </div>
            </div>

            <div class="section">
                <div class="section-header">
                    <h3>Filters</h3>
                    <button class="small-btn" onclick={addFilter}>+</button>
                </div>
                <div class="scroll-list">
                    {#each config.filters as filter, i}
                        <div class="filter-row">
                            <select 
                                value={filter.columnId} 
                                onchange={(e) => updateFilter(i, 'columnId', Number(e.currentTarget.value))}
                            >
                                {#each availableColumns as col}
                                    <option value={col.id}>{col.label}</option>
                                {/each}
                            </select>
                            <select 
                                value={filter.operator}
                                onchange={(e) => updateFilter(i, 'operator', e.currentTarget.value)}
                            >
                                <option value="contains">contains</option>
                                <option value="equals">equals</option>
                                <option value="startsWith">starts with</option>
                                <option value="endsWith">ends with</option>
                                <option value="notContains">does not contain</option>
                                <option value="notEquals">does not equal</option>
                            </select>
                            <input 
                                type="text" 
                                value={filter.value} 
                                oninput={(e) => updateFilter(i, 'value', e.currentTarget.value)} 
                            />
                            <button class="small-btn" onclick={() => removeFilter(i)}>x</button>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="section">
                <div class="section-header">
                    <h3>Sorts</h3>
                    <button class="small-btn" onclick={addSort}>+</button>
                </div>
                <div class="scroll-list">
                    {#each config.sorts as sort, i}
                        <div class="sort-row">
                            <select 
                                value={sort.columnId} 
                                onchange={(e) => updateSort(i, 'columnId', Number(e.currentTarget.value))}
                            >
                                {#each availableColumns as col}
                                    <option value={col.id}>{col.label}</option>
                                {/each}
                            </select>
                            <select 
                                value={sort.direction}
                                onchange={(e) => updateSort(i, 'direction', e.currentTarget.value)}
                            >
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                            <button class="small-btn" onclick={() => removeSort(i)}>x</button>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>

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

    .config-panel {
        display: flex;
        gap: 2rem;
        padding: 1rem;
        background: var(--background-secondary);
        border-bottom: 1px solid var(--background-modifier-border);
    }

    .section h3 {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        color: var(--text-muted);
    }

    .columns-list {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        max-height: 150px;
        overflow-y: auto;
    }

    label {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        font-size: 0.9rem;
        cursor: pointer;
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