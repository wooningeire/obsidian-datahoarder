<script lang="ts">
import { tick } from "svelte";
import type { Task } from "../lib/pb";
import { toDatetimeLocal } from "../lib/datahoard/pbStore.svelte";
import { taskFields } from "../collections/tasks";
import { HoardViewStore } from "./HoardViewStore.svelte";

let { task, column }: { task: Task, column: string } = $props();

const store = HoardViewStore.use();
const field = $derived(taskFields[column]);
const value = $derived(store.valueForTask(task, column));
const options = $derived.by(() => {
    if (!field?.options) return [];
    const choices = store.pb[field.options].filter(option => (
        field.options !== "tasks" || option.id !== task.id
    ));
    const selected = task[field.field];
    const ids = Array.isArray(selected) ? selected : [String(selected ?? "")];
    return [
        ...choices,
        ...ids.filter(id => id && !choices.some(option => option.id === id))
            .map(id => ({ id, label: id })),
    ];
});

let dialog: HTMLDialogElement | undefined = $state();
let editing = $state(false);
let draft = $state("");
let selected = $state<string[]>([]);
let saving = $state(false);
let error = $state("");

const edit = async (): Promise<void> => {
    if (!field) return;
    const current = task[field.field];
    draft = field.type === "date" ? toDatetimeLocal(String(current ?? "")) : String(current ?? "");
    selected = Array.isArray(current) ? [...current] : [];
    error = "";
    editing = true;
    await tick();
    dialog?.showModal();
};

const save = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();
    if (!field || saving || store.pb.busy) return;
    if (field.type === "date" && draft === toDatetimeLocal(String(task[field.field] ?? ""))) {
        dialog?.close();
        return;
    }
    saving = true;
    error = "";
    await store.pb.run(async () => {
        let next: string | number | string[] = field.multiple ? selected : draft;
        if (field.type === "text") {
            next = draft.trim();
            if (!next) throw new Error("Enter a task name.");
        }
        if (field.type === "number") next = Number(draft);
        if (field.type === "date") next = draft ? new Date(draft).toISOString() : "";
        await store.pb.updateTask(task.id, { [field.field]: next });
        dialog?.close();
    });
    error = store.pb.error;
    saving = false;
};
</script>


{#if field}
    <button
        class="field"
        type="button"
        aria-label={column}
        title={value}
        disabled={!store.pb.ready || store.pb.busy}
        onclick={edit}
    >{value || "—"}</button>
    {#if editing}
        <dialog
            bind:this={dialog}
            aria-label={column}
            onclose={() => editing = false}
            oncancel={event => { if (saving) event.preventDefault(); }}
        >
            <form onsubmit={save} aria-busy={saving}>
                <label>
                    {column}
                    {#if field.type === "relation" && field.multiple}
                        <select
                            multiple
                            bind:value={selected}
                            disabled={saving}
                            size={Math.min(8, Math.max(2, options.length))}
                        >
                            {#each options as option (option.id)}
                                <option value={option.id}>{option.label || option.id}</option>
                            {/each}
                        </select>
                    {:else if field.type === "relation"}
                        <select bind:value={draft} disabled={saving}>
                            <option value="">—</option>
                            {#each options as option (option.id)}
                                <option value={option.id}>{option.label || option.id}</option>
                            {/each}
                        </select>
                    {:else if field.type === "number"}
                        <input
                            type="number"
                            step="any"
                            value={draft}
                            oninput={event => draft = event.currentTarget.value}
                            disabled={saving}
                        />
                    {:else if field.type === "date"}
                        <input type="datetime-local" bind:value={draft} disabled={saving} />
                    {:else}
                        <input bind:value={draft} required disabled={saving} />
                    {/if}
                </label>
                <div>
                    <button type="submit" disabled={store.pb.busy}>Save</button>
                    <button type="button" disabled={saving} onclick={() => dialog?.close()}>Cancel</button>
                </div>
                {#if error}<p role="alert">{error}</p>{/if}
            </form>
        </dialog>
    {/if}
{:else}
    {value}
{/if}


<style lang="scss">
.field {
    width: 100%;
    overflow: hidden;
    text-align: start;
    text-overflow: ellipsis;
    white-space: nowrap;
}

dialog {
    width: 24rem;
    max-width: calc(100% - 2rem);

    form, label {
        display: grid;
        gap: 0.5rem;
    }

    input, select {
        min-width: 0;
        width: 100%;
        box-sizing: border-box;
    }
}
</style>
