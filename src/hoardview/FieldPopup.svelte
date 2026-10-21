<script lang="ts">
import type { Snippet } from "svelte";

let { anchor, label, onclose, onopen, children }: {
    anchor: HTMLElement,
    label: string,
    onclose: () => void,
    onopen?: () => void,
    children: Snippet,
} = $props();

let popup: HTMLDivElement | undefined = $state();
let left = $state(0);
let top = $state(0);

const position = (): void => {
    if (!popup) return;
    const bounds = anchor.getBoundingClientRect();
    const size = popup.getBoundingClientRect();
    const margin = parseFloat(getComputedStyle(document.documentElement).fontSize) / 2;
    const preferredTop = bounds.bottom + size.height <= window.innerHeight - margin
        ? bounds.bottom : bounds.top - size.height;
    left = Math.max(margin, Math.min(bounds.left, window.innerWidth - size.width - margin));
    top = Math.max(margin, Math.min(preferredTop, window.innerHeight - size.height - margin));
};

$effect(() => {
    if (!popup) return;
    popup.showPopover();
    position();
    onopen?.();
});
</script>


<svelte:window onresize={position} />
<svelte:document onscrollcapture={event => {
    if (popup && !event.composedPath().includes(popup)) onclose();
}} />

<div
    bind:this={popup}
    popover="auto"
    role="dialog"
    tabindex="-1"
    aria-label={label}
    style:left="{left}px"
    style:top="{top}px"
    ontoggle={event => { if (event.newState === "closed") onclose(); }}
    onkeydown={event => {
        if (event.key === "Escape") {
            event.preventDefault();
            onclose();
        }
    }}
>
    {@render children()}
</div>


<style lang="scss">
:popover-open {
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
</style>
