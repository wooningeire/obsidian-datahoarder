<script lang="ts">
import { tick } from "svelte";
import type { Task } from "../lib/pb";
import { toDatetimeLocal } from "../lib/datahoard/pbStore.svelte";
import { taskFields } from "../collections/tasks";
import { HoardViewStore } from "./HoardViewStore.svelte";
import { fieldPopup } from "./fieldPopup";

let { task, column }: { task: Task, column: string } = $props();

const store = HoardViewStore.use();
const field = $derived(taskFields[column]);
const value = $derived(store.valueForTask(task, column));
const options = $derived.by(() => {
    if (!field?.options) return [];
    const choices = store.pb[field.options].filter(option => (
        field.options !== "tasks" || option.id !== task.id
    ));
    const current = task[field.field];
    const ids = Array.isArray(current) ? current : [String(current ?? "")];
    return [
        ...choices,
        ...ids.filter(id => id && !choices.some(option => option.id === id))
            .map(id => ({ id, label: id })),
    ];
});

let trigger: HTMLButtonElement | undefined = $state();
let control: HTMLInputElement | HTMLSelectElement | undefined = $state();
let editing = $state(false);
let draft = $state("");
let selected = $state<string[]>([]);
let search = $state("");
let saving = $state(false);
let error = $state("");
const filteredOptions = $derived(options.filter(option => (
    (option.label || option.id).toLocaleLowerCase().includes(search.toLocaleLowerCase())
)));

const close = (): void => {
    editing = false;
    error = "";
};

const edit = async (): Promise<void> => {
    if (!field) return;
    const current = task[field.field];
    draft = field.type === "date" ? toDatetimeLocal(String(current ?? "")) : String(current ?? "");
    selected = Array.isArray(current) ? [...current] : [];
    search = "";
    error = "";
    editing = true;
    await tick();
    if (!field.multiple) control?.focus();
    if (field.type === "text" && control instanceof HTMLInputElement) control.select();
};

const cancel = async (): Promise<void> => {
    if (saving) return;
    close();
    await tick();
    trigger?.focus({ preventScroll: true });
};

const keyboard = (element: HTMLFormElement) => {
    const onKeyDown = (event: KeyboardEvent): void => {
        if (event.key === "Escape") {
            event.preventDefault();
            void cancel();
        }
    };
    element.addEventListener("keydown", onKeyDown);
    return { destroy: () => element.removeEventListener("keydown", onKeyDown) };
};

const save = async (event?: SubmitEvent): Promise<void> => {
    event?.preventDefault();
    if (!field || saving || store.pb.busy) return;
    saving = true;
    error = "";
    await store.pb.run(async () => {
        if (field.type !== "date" || draft !== toDatetimeLocal(String(task[field.field] ?? ""))) {
            let next: string | number | string[] = field.multiple ? selected : draft;
            if (field.type === "text") {
                next = draft.trim();
                if (!next) throw new Error("Enter a task name.");
            }
            if (field.type === "number") next = Number(draft);
            if (field.type === "date") next = draft ? new Date(draft).toISOString() : "";
            await store.pb.updateTask(task.id, { [field.field]: next });
        }
        close();
    });
    error = store.pb.error;
    saving = false;
    await tick();
    if (field.type === "relation" && !field.multiple && control instanceof HTMLSelectElement) {
        control.value = String(task[field.field] ?? "");
    } else if (!editing) trigger?.focus({ preventScroll: true });
};
</script>


{#if field?.type === "relation" && !field.multiple}
    <select
        bind:this={control}
        class="field"
        aria-label={column}
        aria-invalid={!!error}
        title={error || value}
        value={task[field.field]}
        disabled={!store.pb.ready || store.pb.busy}
        onchange={event => {
            draft = event.currentTarget.value;
            void save();
        }}
    >
        <option value="">—</option>
        {#each options as option (option.id)}
            <option value={option.id}>{option.label || option.id}</option>
        {/each}
    </select>
{:else if field}
    {#if !editing || field.multiple}
        <button
            bind:this={trigger}
            class="field"
            type="button"
            aria-label={column}
            aria-expanded={field.multiple ? editing : undefined}
            title={value}
            disabled={!store.pb.ready || store.pb.busy}
            onclick={edit}
            oncontextmenu={event => {
                event.preventDefault();
                void edit();
            }}
        >{value || "—"}</button>
    {/if}
    {#if editing}
        <form
            class="editor"
            class:multiple={field.multiple}
            popover={field.multiple ? "auto" : undefined}
            aria-label={column}
            aria-busy={saving}
            onsubmit={save}
            use:keyboard
            use:fieldPopup={field.multiple && trigger ? { anchor: trigger, onClose: close } : undefined}
        >
            {#if field.multiple}
                <input type="search" aria-label={`Search ${column}`} bind:value={search} disabled={saving} />
                <div class="choices" role="group" aria-label={column}>
                    {#each filteredOptions as option (option.id)}
                        <label>
                            <input
                                type="checkbox"
                                checked={selected.includes(option.id)}
                                onchange={event => selected = event.currentTarget.checked
                                    ? [...selected, option.id]
                                    : selected.filter(id => id !== option.id)}
                                disabled={saving}
                            />
                            <span>{option.label || option.id}</span>
                        </label>
                    {/each}
                </div>
            {:else if field.type === "number"}
                <input
                    bind:this={control}
                    aria-label={column}
                    type="number"
                    step="any"
                    value={draft}
                    oninput={event => draft = event.currentTarget.value}
                    disabled={saving}
                />
            {:else if field.type === "date"}
                <input bind:this={control} aria-label={column} type="datetime-local" bind:value={draft} disabled={saving} />
            {:else}
                <input bind:this={control} aria-label={column} bind:value={draft} required disabled={saving} />
            {/if}
            <button type="submit" aria-label="Save" title="Save" disabled={store.pb.busy}>✓</button>
            <button type="button" aria-label="Cancel" title="Cancel" disabled={saving} onclick={cancel}>✕</button>
            {#if error && field.multiple}<p role="alert" title={error}>{error}</p>{/if}
        </form>
    {/if}
{:else}
    {value}
{/if}

{#if error && !field?.multiple}
    <p
        class="field-error"
        popover="auto"
        role="alert"
        use:fieldPopup={{ anchor: control ?? trigger!, onClose: () => error = "" }}
    >{error}</p>
{/if}


<style lang="scss">
.field {
    width: 100%;
    overflow: hidden;
    text-align: start;
    text-overflow: ellipsis;
    white-space: nowrap;
}

[popover] {
    position: fixed;
    inset: auto;
    margin: 0;
    width: 24rem;
    max-width: calc(100vw - 1rem);
    max-height: calc(100vh - 1rem);
    padding: 0.5rem;
    box-sizing: border-box;
    border: 0.0625rem solid var(--background-modifier-border, currentColor);
    background: var(--background-primary, Canvas);
    color: inherit;
    white-space: normal;
}

[popover]:not(:popover-open) {
    display: none;
}

.editor {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 0.25em;
    line-height: normal;

    > input {
        min-width: 0;
        width: 100%;
        box-sizing: border-box;
    }

    > button {
        padding-inline: 0.4em;
    }

    > p {
        grid-column: 1 / -1;
        margin: 0;
        overflow-wrap: anywhere;
    }

    &.multiple > input,
    .choices {
        grid-column: 1 / -1;
    }

    &.multiple > button[type="submit"] {
        grid-column: 2;
    }

    .choices {
        height: 12em;
        max-height: calc(100vh - 8rem);
        overflow-y: auto;

        > label {
            display: flex;
            align-items: center;
            gap: 0.5em;
            min-height: 2em;
            white-space: normal;

            > input {
                flex-shrink: 0;
            }
        }
    }
}
</style>
