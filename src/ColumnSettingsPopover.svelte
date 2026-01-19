<script lang="ts">
let {
    column,
    onUpdateColumn,
}: {
    column: any,
    onUpdateColumn: ({
        columnId,
        label,
    }: {
        columnId: number,
        label: string,
    }) => void,
} = $props();
</script>

<div class="column-settings">
    <h3>Edit column</h3>

    <div class="column-settings-form">
        <label for="column-label">Label</label>
        <input
            type="text"
            id="column-label"
            bind:value={column.label}
            onchange={event => onUpdateColumn({ columnId: column.id, label: event.currentTarget.value })}
        />
    </div>
</div>

<style lang="scss">


.column-settings-form {
    display: grid;
    grid-template-columns: auto auto;
    gap: 0.5rem;
}
</style>