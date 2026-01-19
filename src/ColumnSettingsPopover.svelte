<script lang="ts">
let {
    column,
    onUpdateColumn,
    onClose,
}: {
    column: any,
    onUpdateColumn: ({
        columnId,
        label,
        datatype,
    }: {
        columnId: number,
        label?: string,
        datatype?: string,
    }) => void,
    onClose: () => void,
} = $props();
</script>

<!-- <svelte:window onclick={() => onClose()} /> -->

<div
    class="column-settings"
>
    <h4>Edit column</h4>

    <div class="column-settings-form">
        <label for="column-label">Label</label>
        <input
            type="text"
            id="column-label"
            bind:value={column.label}
            onchange={event => onUpdateColumn({ columnId: column.id, label: event.currentTarget.value })}
        />

        <label for="column-datatype">Datatype</label>
        <input
            type="text"
            id="column-datatype"
            bind:value={column.datatype}
            onchange={event => onUpdateColumn({ columnId: column.id, datatype: event.currentTarget.value })}
        />
    </div>
</div>

<style lang="scss">
.column-settings-form {
    display: grid;
    grid-template-columns: auto auto;
    gap: 0.5rem;
    align-items: center;
}

h4 {
    margin: 0;
}
</style>