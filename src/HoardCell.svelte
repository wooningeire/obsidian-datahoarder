<script lang="ts">
import { store } from "Store.svelte";

let {
    row,
    column,
    value,
    tableId,
}: {
    row: any,
    column: any,
    value: string,
    tableId: number,
} = $props();
</script>

{#if column.datatype === "number"}
    <input 
        type="number" 
        {value}
        onchange={(e) => store.updateCell(row.id, column.id, e.currentTarget.value, tableId)} 
    />
{:else if column.datatype === "date"}
    <input 
        type="datetime-local" 
        {value}
        onchange={(e) => store.updateCell(row.id, column.id, e.currentTarget.value, tableId)} 
    />
{:else if column.datatype.startsWith("enum:")}
    {@const enumId = parseInt(column.datatype.slice("enum:".length))}
    
    {@const variants = store.enumVariantsByEnumId.get(enumId)}
    
    <select
        value={value}
        onchange={(e) => store.updateCell(row.id, column.id, e.currentTarget.value, tableId)}
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
        onchange={(e) => store.updateCell(row.id, column.id, e.currentTarget.value, tableId)} 
    />
{/if}