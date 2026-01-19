<script lang="ts">
let {
    row,
    column,
    value,
    onUpdateCell,
}: {
    row: any,
    column: any,
    value: string,
    onUpdateCell: (rowId: number, columnId: number, value: string) => void,
} = $props();
</script>

{#if column.datatype === "text"}
    <input 
        type="text" 
        value={value} 
        onchange={(e) => onUpdateCell(row.id, column.id, e.currentTarget.value)} 
    />
{:else if column.datatype === "number"}
    <input 
        type="number" 
        value={value} 
        onchange={(e) => onUpdateCell(row.id, column.id, e.currentTarget.value)} 
    />
{:else if column.datatype === "date"}
    <input 
        type="datetime-local" 
        value={value} 
        onchange={(e) => onUpdateCell(row.id, column.id, e.currentTarget.value)} 
    />
{:else}
    <input 
        type="text" 
        value={value} 
        onchange={(e) => onUpdateCell(row.id, column.id, e.currentTarget.value)} 
    />
{/if}