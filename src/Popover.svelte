<script lang="ts">
import type { Snippet } from "svelte";

let {
    children,
    active = false,
}: {
    children?: Snippet,
    active?: boolean,
} = $props();
</script>

{#if active}
    <div class="popover">
        {@render children?.()}
    </div>
{/if}

<style lang="scss">
.popover {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 100;

    padding: 0.5rem;
    min-width: 20rem;

    border: 1px solid var(--background-modifier-border);
    background: var(--background-primary);

    box-shadow: 0 0.25rem 0.5rem #0000003f;
    border-radius: 0.25rem;
}
</style>
