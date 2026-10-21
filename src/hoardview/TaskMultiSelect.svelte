<script lang="ts">
import { untrack } from "svelte";
import FieldPopup from "./FieldPopup.svelte";

let { anchor, label, options, value, busy, error, onsave, onclose, oncancel }: {
    anchor: HTMLElement,
    label: string,
    options: { id: string, label: string }[],
    value: string[],
    busy: boolean,
    error: string,
    onsave: (value: string[]) => Promise<void>,
    onclose: () => void,
    oncancel: () => void,
} = $props();

let selected = $state(untrack(() => [...value]));
let search = $state("");
let searchInput: HTMLInputElement | undefined = $state();
const choices = $derived(options.filter(option => (
    (option.label || option.id).toLocaleLowerCase().includes(search.toLocaleLowerCase())
)));
</script>


<FieldPopup {anchor} {label} {onclose} onopen={() => searchInput?.focus({ preventScroll: true })}>
    <form aria-label={label} aria-busy={busy} onsubmit={event => {
        event.preventDefault();
        void onsave(selected);
    }}>
        <input bind:this={searchInput} type="search" aria-label={`Search ${label}`} bind:value={search} disabled={busy} />
        <div class="choices" role="group" aria-label={label}>
            {#each choices as option (option.id)}
                <label>
                    <input
                        type="checkbox"
                        checked={selected.includes(option.id)}
                        onchange={event => selected = event.currentTarget.checked
                            ? [...selected, option.id]
                            : selected.filter(id => id !== option.id)}
                        disabled={busy}
                    />
                    {option.label || option.id}
                </label>
            {/each}
        </div>
        <footer>
            <button type="submit" aria-label="Save" title="Save" disabled={busy}>✓</button>
            <button type="button" aria-label="Cancel" title="Cancel" disabled={busy} onclick={oncancel}>✕</button>
        </footer>
        {#if error}<p role="alert">{error}</p>{/if}
    </form>
</FieldPopup>


<style lang="scss">
form {
    display: grid;
    gap: 0.25em;
}

.choices {
    height: min(12em, calc(100vh - 8rem));
    overflow-y: auto;

    > label {
        display: flex;
        align-items: center;
        gap: 0.5em;
        min-height: 2em;
    }
}

footer {
    display: flex;
    justify-content: end;
    gap: 0.25em;
}
</style>
