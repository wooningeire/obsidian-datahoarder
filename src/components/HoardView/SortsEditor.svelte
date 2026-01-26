<script lang="ts">
    import type { Column } from "../../dbOps/DatahoarderDbOps";

    let { 
        sorts = $bindable(), 
        availableColumns, 
        onChange 
    }: {
        sorts: { columnId: number, direction: 'asc' | 'desc' }[],
        availableColumns: Column[],
        onChange: () => void
    } = $props();

    const addSort = () => {
        if (availableColumns.length > 0 && availableColumns[0]) {
            sorts.push({ columnId: availableColumns[0].id, direction: "asc" });
            onChange();
        }
    };

    const updateSort = (index: number, key: string, value: any) => {
        (sorts[index] as any)[key] = value;
        onChange();
    };

    const removeSort = (index: number) => {
        sorts.splice(index, 1);
        onChange();
    };
</script>

<div class="section">
    <div class="section-header">
        <h3>Sorts</h3>
        <button class="small-btn" onclick={addSort}>+</button>
    </div>
    <div class="scroll-list">
        {#each sorts as sort, i}
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

    .sort-row {
        display: flex;
        gap: 0.25rem;
        align-items: center;
    }

    .sort-row select {
        width: 100px;
        flex: 1;
        min-width: 0;
    }
</style>
