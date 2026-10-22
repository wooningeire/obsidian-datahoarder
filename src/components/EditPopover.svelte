<script lang="ts">
import type { Snippet } from "svelte";
import Popover from "./Popover.svelte";

let {
    anchor,
    label,
    busy,
    error,
    onSave,
    onClose,
    onCancel,
    onOpen,
    children,
}: {
    anchor: HTMLElement,
    label: string,
    busy: boolean,
    error: string,
    onSave: () => void,
    onClose: () => void,
    onCancel: () => void,
    onOpen?: () => void,
    children: Snippet,
} = $props();
</script>


<Popover
    active
    {anchor}
    {label}
    onClose={onClose}
    onOpen={onOpen}
>
    <popover-contents
        aria-label={label}
        aria-busy={busy}
    >
        {@render children()}

        <popover-edit-buttons>
            <button
                aria-label="Save"
                title="Save"
                disabled={busy}
                onclick={onSave}
            >✓</button>

            <button
                type="button"
                aria-label="Cancel"
                title="Cancel"
                disabled={busy}
                onclick={onCancel}
            >✕</button>
        </popover-edit-buttons>

        {#if error}
            <alert-text>{error}</alert-text>
        {/if}
    </popover-contents>
</Popover>


<style lang="scss">
popover-contents {
    display: grid;
    gap: 0.25em;
}

popover-edit-buttons {
    display: flex;
    justify-content: end;
    gap: 0.25em;
}
</style>
