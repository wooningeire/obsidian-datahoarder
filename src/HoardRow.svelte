<script lang="ts">
import HoardCell from "HoardCell.svelte";
import RowSettingsMenu from "RowSettingsMenu.svelte";
import Popover from "Popover.svelte";

let {
    row,
    columns,
    cells,
    onUpdateCell,
    onDeleteRow,
}: {
    row: any,
    columns: any[],
    cells: any,
    onUpdateCell: (rowId: number, columnId: number, value: string) => void,
    onDeleteRow: (rowId: number) => void,
} = $props();

let showSettings = $state(false);
</script>

<div class="row-settings-wrapper">
    <button onclick={() => showSettings = !showSettings}>⠿</button>
    
    <Popover active={showSettings}>
        <RowSettingsMenu
            {row}
            {onDeleteRow}
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
            {onUpdateCell}
        />
    </div>
{/each}

<style lang="scss">
.row-settings-wrapper {
    position: relative;
}
</style>