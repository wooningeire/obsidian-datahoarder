<script lang="ts">
let {
    variant,
    onDeleteVariant,
    onClose,
}: {
    variant: { id: number; label: string },
    onDeleteVariant: (variantId: number) => void,
    onClose: () => void,
} = $props();
</script>

<div class="variant-settings">
    <h4>Variant Settings</h4>

    <button class="delete-btn" onclick={() => { onDeleteVariant(variant.id); onClose(); }}>
        Delete variant
    </button>
</div>

<style lang="scss">
h4 {
    margin: 0;
}
</style>
