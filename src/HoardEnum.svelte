<script lang="ts">
import EnumSettingsMenu from "EnumSettingsMenu.svelte";
import EnumVariantSettingsMenu from "EnumVariantSettingsMenu.svelte";
import Popover from "Popover.svelte";
import { store } from "Store.svelte";

let {
    enumData,
}: {
    enumData: { id: number; label: string },
} = $props();

let variants = $derived(store.enumVariantsByEnumId.get(enumData.id) ?? []);

let editingEnum = $state(false);
let activeVariantId = $state<number | null>(null);


let draggedVariantId = $state<number | null>(null);
let dropTargetIndex = $state<number | null>(null);

const handleDragStart = (event: DragEvent, variantId: number) => {
    draggedVariantId = variantId;
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', variantId.toString());
    }
};

const handleDragOver = (event: DragEvent, index: number) => {
    event.preventDefault();
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
    }
    dropTargetIndex = index;
};

const handleDragLeave = () => {
    dropTargetIndex = null;
};

const handleDrop = (event: DragEvent, targetIndex: number) => {
    event.preventDefault();
    
    if (draggedVariantId === null) return;
    
    const draggedIndex = variants.findIndex(variant => variant.id === draggedVariantId);
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
        resetDragState();
        return;
    }
    
    const newVariants = [...variants];
    const [draggedVariant] = newVariants.splice(draggedIndex, 1);
    if (!draggedVariant) {
        resetDragState();
        return;
    }
    newVariants.splice(targetIndex, 0, draggedVariant);
    
    store.reorderEnumVariants(enumData.id, newVariants.map(variant => variant.id));
    
    resetDragState();
};

const handleDragEnd = () => {
    resetDragState();
};

const resetDragState = () => {
    draggedVariantId = null;
    dropTargetIndex = null;
};
</script>

<div class="enum-view">
    <div class="enum-header">
        <button
            class="enum-title"
            onclick={() => editingEnum = !editingEnum}
        >
            <h3>{enumData.label}</h3>
        </button>
        
        <Popover active={editingEnum}>
            <EnumSettingsMenu
                enumData={enumData}
                onClose={() => editingEnum = false}
            />
        </Popover>
    </div>

    <div class="enum-stats">
        {variants.length} variants
    </div>

    <ul class="variants-list">
        {#each variants as variant, variantIndex}
            <li
                class="variant-item"
                class:dragging={draggedVariantId === variant.id}
                class:drop-target={dropTargetIndex === variantIndex && draggedVariantId !== variant.id}
                draggable="true"
                role="listitem"
                ondragstart={event => handleDragStart(event, variant.id)}
                ondragover={event => handleDragOver(event, variantIndex)}
                ondragleave={handleDragLeave}
                ondrop={event => handleDrop(event, variantIndex)}
                ondragend={handleDragEnd}
            >
                <div class="variant-settings-wrapper">
                    <button onclick={() => {
                        if (activeVariantId === variant.id) {
                            activeVariantId = null;
                        } else {
                            activeVariantId = variant.id;
                        }
                    }}>⠿</button>
                    
                    <Popover active={activeVariantId === variant.id}>
                        <EnumVariantSettingsMenu
                            {variant}
                            enumId={enumData.id}
                            onClose={() => activeVariantId = null}
                        />
                    </Popover>
                </div>

                <input
                    type="text"
                    value={variant.label}
                    onchange={(e) => store.updateEnumVariant(variant.id, e.currentTarget.value)}
                />
            </li>
        {/each}
    </ul>

    <button onclick={() => store.addEnumVariant(enumData.id, "")}>Add variant</button>
</div>

<style lang="scss">
.enum-view {
    padding: 0.5rem;
    
    border: 1px solid var(--background-modifier-border);
    border-radius: 0.25rem;
}

.enum-header {
    position: relative;
}

.variants-list {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.variant-item {
    cursor: grab;
    user-select: none;

    transition: opacity 0.15s ease;
    
    &:active {
        cursor: grabbing;
    }
    
    &.dragging {
        opacity: 0.25;
    }
    
    &.drop-target {
        box-shadow: inset 0 3px 0 var(--interactive-accent);
    }
}

.variant-settings-wrapper {
    position: relative;
}

h3 {
    margin: 0 0 0.5rem 0;
}
</style>
