<script lang="ts">
	import { store } from "Store.svelte";

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

{#if column.datatype === "number"}
    <input 
        type="number" 
        {value}
        onchange={(e) => onUpdateCell(row.id, column.id, e.currentTarget.value)} 
    />
{:else if column.datatype === "date"}
    <input 
        type="datetime-local" 
        {value}
        onchange={(e) => onUpdateCell(row.id, column.id, e.currentTarget.value)} 
    />
{:else if column.datatype.startsWith("enum:")}
    {@const enumId = parseInt(column.datatype.slice("enum:".length))}
    
    {@const variants = store.enumVariantsByEnumId.get(enumId)}
    
    <select
        value={value}
        onchange={(e) => onUpdateCell(row.id, column.id, e.currentTarget.value)}
    >
        <option value=""></option>
        {#each variants as variant}
            <option value={variant.id.toString()}>{variant.label}</option>
        {/each}
    </select>
{:else}
    <input 
        type="text" 
        {value}
        onchange={(e) => onUpdateCell(row.id, column.id, e.currentTarget.value)} 
    />
{/if}