<script lang="ts">
    import type { Column } from "../../dbOps/DatahoarderDbOps";

    let { 
        filters = $bindable(), 
        availableColumns, 
        onChange 
    }: {
        filters: { columnId: number, operator: string, value: string }[],
        availableColumns: Column[],
        onChange: () => void
    } = $props();

    const addFilter = () => {
        if (availableColumns.length > 0 && availableColumns[0]) {
            filters.push({ columnId: availableColumns[0].id, operator: "contains", value: "" });
            onChange();
        }
    };

    const updateFilter = (index: number, key: string, value: any) => {
        (filters[index] as any)[key] = value;
        onChange();
    };

    const removeFilter = (index: number) => {
        filters.splice(index, 1);
        onChange();
    };
</script>

<div class="section">
    <div class="section-header">
        <h3>Filters</h3>
        <button class="small-btn" onclick={addFilter}>+</button>
    </div>
    <div class="scroll-list">
        {#each filters as filter, i}
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

<style>
    .section h3 {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        color: var(--text-muted);
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .small-btn {
        padding: 0 0.4rem;
        height: 1.5rem;
        font-size: 0.8rem;
    }

    .scroll-list {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        max-height: 150px;
        overflow-y: auto;
    }

    .filter-row {
        display: flex;
        gap: 0.25rem;
        align-items: center;
    }

    .filter-row select, .filter-row input {
        width: 100px;
        flex: 1;
        min-width: 0;
    }
</style>
