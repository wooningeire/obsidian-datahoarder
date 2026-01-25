<script lang="ts">
import HoardCell from "HoardCell.svelte";
import RowSettingsMenu from "RowSettingsMenu.svelte";
import Popover from "Popover.svelte";

let {
    row,
    columns,
    cells,
    tableId,
}: {
    row: any,
    columns: any[],
    cells: any,
    tableId: number,
} = $props();

let showSettings = $state(false);
</script>

<div class="row-settings-wrapper">
    <button onclick={() => showSettings = !showSettings}>⠿</button>
    
    <Popover active={showSettings}>
        <RowSettingsMenu
            {row}
            {tableId}
            onClose={() => showSettings = false}
        />
    </Popover>
</div>

{#each columns as column}
    <div class="cell">
        <HoardCell 
            {row}
            {column}
            value={cells[row.id]?.[column.id] ?? ""} 
            {tableId}
        />
    </div>
{/each}

<style lang="scss">
.row-settings-wrapper {
    position: relative;
}
</style>