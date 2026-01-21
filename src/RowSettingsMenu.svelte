<script lang="ts">
let {
    row,
    onDeleteRow,
    onClose,
}: {
    row: { id: number },
    onDeleteRow: (rowId: number) => void,
    onClose: () => void,
} = $props();
</script>

<div class="row-settings">
    <h4>Row Settings</h4>

    <button class="delete-btn" onclick={() => { onDeleteRow(row.id); onClose(); }}>
        Delete row
    </button>
</div>

<style lang="scss">
h4 {
    margin: 0;
}
</style>
