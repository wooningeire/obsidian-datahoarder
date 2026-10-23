<script lang="ts">
import { untrack } from "svelte";
import EditPopover from "../../components/EditPopover.svelte";
	import { SvelteSet } from "svelte/reactivity";

let {
    anchor,
    label,
    options,
    value,
    busy,
    error,
    onSave,
    onClose,
    onCancel,
}: {
    anchor: HTMLElement,
    label: string,
    options: {
        id: string,
        label: string,
    }[],
    value: string[],
    busy: boolean,
    error: string,
    onSave: (value: Set<string>) => Promise<void>,
    onClose: () => void,
    onCancel: () => void,
} = $props();

let selected = $state(untrack(() => new SvelteSet(value)));

let search = $state("");
const searchLower = $derived(search.toLocaleLowerCase());

let searchInput: HTMLInputElement | null = $state(null);
const choices = $derived.by(() => {
    return options.filter(option => {
        return option.label.toLocaleLowerCase().includes(searchLower)
            || option.id.toLocaleLowerCase().includes(searchLower);
    });
});
</script>


<EditPopover
    {anchor}
    {label}
    {busy}
    {error}
    onClose={onClose}
    onCancel={onCancel}
    onSave={() => onSave(selected)}
    onOpen={() => searchInput?.focus({preventScroll: true})}
>
    <input
        bind:this={searchInput}
        type="search"
        aria-label={`Search ${label}`}
        bind:value={search}
        disabled={busy}
    />

    <choices-list
        role="group"
        aria-label={label}
    >
        {#each choices as option (option.id)}
            <label>
                <input
                    type="checkbox"
                    checked={selected.has(option.id)}
                    onchange={event => {
                        if (event.currentTarget.checked) {
                            selected.add(option.id)
                        } else {
                            selected.delete(option.id)
                        }
                    }}
                    disabled={busy}
                />

                {option.label || option.id}
            </label>
        {/each}
    </choices-list>
</EditPopover>


<style lang="scss">
choices-list {
    height: min(12em, calc(100vh - 8rem));
    overflow-y: auto;

    > label {
        display: flex;
        align-items: center;
        gap: 0.5em;
        min-height: 2em;
    }
}
</style>
