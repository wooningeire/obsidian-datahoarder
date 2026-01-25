<script lang="ts">
import { store } from "./Store.svelte";

let {
    enumData,
    onClose,
}: {
    enumData: { id: number; label: string },
    onClose: () => void,
} = $props();
</script>

<div class="enum-settings">
    <h4>Edit enum</h4>

    <div class="enum-settings-form">
        <label for="enum-label">Label</label>
        <input
            type="text"
            id="enum-label"
            bind:value={enumData.label}
            onchange={event => store.updateEnum({ enumId: enumData.id, label: event.currentTarget.value })}
        />
    </div>

    <button class="delete-btn" onclick={() => { store.deleteEnum(enumData.id); onClose(); }}>
        Delete enum
    </button>
</div>

<style lang="scss">
.enum-settings-form {
    display: grid;
    grid-template-columns: auto auto;
    gap: 0.5rem;
    align-items: center;
}

h4 {
    margin: 0;
}
</style>
