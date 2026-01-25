<script lang="ts">
import { store } from "./Store.svelte";

let {
    variant,
    enumId,
    onClose,
}: {
    variant: { id: number; label: string },
    enumId: number,
    onClose: () => void,
} = $props();
</script>

<div class="variant-settings">
    <h4>Variant Settings</h4>

    <button class="delete-btn" onclick={() => { store.deleteEnumVariant(variant.id, enumId); onClose(); }}>
        Delete variant
    </button>
</div>

<style lang="scss">
h4 {
    margin: 0;
}
</style>
