<script lang="ts">
    import type { Column } from "../../dbOps/DatahoarderDbOps";
    import FiltersEditor from "./FiltersEditor.svelte";
    import SortsEditor from "./SortsEditor.svelte";

    let { 
        config = $bindable(), 
        tables, 
        availableColumns, 
        onChange 
    }: {
        config: any,
        tables: any[],
        availableColumns: Column[],
        onChange: () => void
    } = $props();

    const setTableSource = (tableId: number) => {
        config.source = { type: "table", tableId };
        config.columns = []; // Reset columns when table changes
        config.filters = [];
        config.sorts = [];
        onChange();
    };

    const toggleColumn = (columnId: number, checked: boolean) => {
        if (checked) {
            config.columns.push({ type: "direct", columnId });
        } else {
            config.columns = config.columns.filter((c: any) => c.columnId !== columnId);
        }
        onChange();
    };
</script>

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

    {#if config.source}
        <div class="section">
            <h3>Columns</h3>
            <div class="scroll-list">
                {#each availableColumns as column}
                    <label>
                        <input 
                            type="checkbox" 
                            checked={config.columns.some((c: any) => c.columnId === column.id)}
                            onchange={(e) => toggleColumn(column.id, e.currentTarget.checked)}
                        />
                        {column.label}
                    </label>
                {/each}
            </div>
        </div>

        <FiltersEditor
            bind:filters={config.filters}
            {availableColumns}
            {onChange}
        />

        <SortsEditor
            bind:sorts={config.sorts}
            {availableColumns}
            {onChange}
        />
    {/if}
</div>

<style>
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

    .scroll-list {
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
</style>
