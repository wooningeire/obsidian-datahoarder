
<script lang="ts">
let {
    row,
    columns,
    cells,
    onUpdateCell,
}: {
    row: any,
    columns: any[],
    cells: any,
    onUpdateCell: (rowId: number, columnId: number, value: string) => void,
} = $props();
</script>

{#each columns as column}
    <div class="cell">
        <input 
            type="text" 
            value={cells[row.id]?.[column.id] ?? ""} 
            onchange={(e) => onUpdateCell(row.id, column.id, e.currentTarget.value)} 
        />
    </div>
{/each}