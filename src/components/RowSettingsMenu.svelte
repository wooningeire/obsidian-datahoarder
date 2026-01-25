<script lang="ts">
import { store } from "./Store.svelte";

let {
    row,
    tableId,
    onClose,
}: {
    row: { id: number },
    tableId: number,
    onClose: () => void,
} = $props();
</script>

<div class="row-settings">
    <h4>Row Settings</h4>

    <button class="delete-btn" onclick={() => { store.deleteRow(row.id, tableId); onClose(); }}>
        Delete row
    </button>
</div>

<style lang="scss">
h4 {
    margin: 0;
}
</style>
