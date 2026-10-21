<script lang="ts">
import { untrack, type Snippet } from "svelte";

let {
    children,
    active = false,
    anchor = null,
    label,
    onClose,
    onOpen,
}: {
    children?: Snippet,
    active?: boolean,
    anchor?: HTMLElement | null,
    label?: string,
    onClose?: () => void,
    onOpen?: () => void,
} = $props();

let popup: HTMLDivElement | null = $state(null);

let left = $state(0);
let top = $state(0);
let listening = false;

const position = (): void => {
    if (popup === null || anchor === null) return;

    const anchorRect = anchor.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const margin = parseFloat(getComputedStyle(document.documentElement).fontSize) / 2;
    
    const preferredTop = anchorRect.bottom + popupRect.height <= window.innerHeight - margin
        ? anchorRect.bottom : anchorRect.top - popupRect.height;
    left = Math.max(margin, Math.min(anchorRect.left, window.innerWidth - popupRect.width - margin));
    top = Math.max(margin, Math.min(preferredTop, window.innerHeight - popupRect.height - margin));
};

$effect(() => {
    if (!active || anchor === null || popup === null) return;
    
    popup.showPopover();
    untrack(() => {
        position();
        onOpen?.();
    });


    const frame = requestAnimationFrame(() => {
        position();
        listening = true;
    });

    return () => {
        cancelAnimationFrame(frame);
        listening = false;
    };
});
</script>


<svelte:window onresize={position} />
<svelte:document
    onscrollcapture={event => {
        if (!listening) return;
        if (popup === null) return;
        if (event.composedPath().includes(popup)) return;
        
        onClose?.();
    }}
/>

{#if active}
    {#if anchor !== null}
        <anchored-popover
            bind:this={popup}
            popover="auto"
            role="dialog"
            tabindex="-1"
            aria-label={label}
            style:left="{left}px"
            style:top="{top}px"
            ontoggle={(event: ToggleEvent) => {
                if (event.newState !== "closed") return;
                onClose?.();
            }}
        >
            {@render children?.()}
        </anchored-popover>
    {:else}
        <popover->
            {@render children?.()}
        </popover->
    {/if}
{/if}


<style lang="scss">
anchored-popover:popover-open {
    position: fixed;
    inset: auto;
    margin: 0;
    width: min(24rem, calc(100vw - 1rem));
    max-height: calc(100vh - 1rem);
    box-sizing: border-box;
    background: var(--background-primary, Canvas);
    color: inherit;
    white-space: normal;
    overflow-wrap: anywhere;
}

popover- {
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
