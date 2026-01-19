
<script lang="ts">
	import HoardCell from "HoardCell.svelte";

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
        <HoardCell 
            {row}
            {column}
            value={cells[row.id]?.[column.id] ?? ""} 
            {onUpdateCell}
        />
    </div>
{/each}