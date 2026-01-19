<script lang="ts">
let {
    enumData,
    variants,
    onAddVariant,
    onUpdateVariant,
}: {
    enumData: { id: number; label: string },
    variants: { id: number; label: string }[],
    onAddVariant: (enumId: number, label: string) => number,
    onUpdateVariant: (variantId: number, label: string) => void,
} = $props();
</script>

<div class="enum-view">
    <h3>{enumData.label}</h3>

    <div class="enum-stats">
        {variants.length} variants
    </div>

    <ul class="variants-list">
        {#each variants as variant}
            <li class="variant-item">
                <input
                    type="text"
                    value={variant.label}
                    onchange={(e) => onUpdateVariant(variant.id, e.currentTarget.value)}
                />
            </li>
        {/each}
    </ul>

    <button onclick={() => onAddVariant(enumData.id, "")}>Add variant</button>
</div>

<style lang="scss">
.enum-view {
    padding: 0.5rem;
    
    border: 1px solid var(--background-modifier-border);
    border-radius: 0.25rem;
}

.variants-list {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.variant-item input {
    width: 100%;
    box-sizing: border-box;
}

h3 {
    margin: 0 0 0.5rem 0;
}
</style>
