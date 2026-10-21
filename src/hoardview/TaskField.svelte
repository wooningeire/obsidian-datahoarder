<script lang="ts">
import { tick } from "svelte";
import type { Task } from "../lib/pb";
import { toDatetimeLocal } from "../lib/datahoard/pbStore.svelte";
import { taskFields } from "../collections/tasks";
import { HoardViewStore } from "./HoardViewStore.svelte";
import FieldPopup from "./FieldPopup.svelte";
import TaskMultiSelect from "./TaskMultiSelect.svelte";

let { task, column }: { task: Task, column: string } = $props();

const store = HoardViewStore.use();
const field = $derived(taskFields[column]);
let current = $derived(field ? task[field.field] : "");
const value = $derived(store.valueForTask(task, column));
const inputType = $derived(field?.type === "date" ? "datetime-local" : field?.type ?? "text");
const options = $derived.by(() => {
    if (!field?.options) return [];
    const choices = store.pb[field.options].filter(option => (
        field.options !== "tasks" || option.id !== task.id
    ));
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
let error = $state("");

const close = (): void => {
    editing = false;
    error = "";
};

const edit = async (event: MouseEvent): Promise<void> => {
    event.preventDefault();
    draft = field?.type === "date" ? toDatetimeLocal(String(current ?? "")) : String(current ?? "");
    error = "";
    editing = true;
    await tick();
    if (!field?.multiple) control?.focus();
    if (field?.type === "text" && control instanceof HTMLInputElement) control.select();
};

const cancel = async (): Promise<void> => {
    if (store.pb.busy) return;
    close();
    await tick();
    trigger?.focus({ preventScroll: true });
};

const escape = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
        event.preventDefault();
        void cancel();
    }
};

const save = async (next: string | string[]): Promise<void> => {
    if (!field || store.pb.busy) return;
    error = "";
    await store.pb.run(async () => {
        let value: string | number | string[] = next;
        if (field.type === "text") {
            value = String(next).trim();
            if (!value) throw new Error("Enter a task name.");
        }
        if (field.type === "number") value = Number(next);
        if (field.type === "date") value = next ? new Date(String(next)).toISOString() : "";
        if (field.type !== "date" || next !== toDatetimeLocal(String(current ?? ""))) {
            await store.pb.updateTask(task.id, { [field.field]: value });
        }
        close();
    });
    error = store.pb.error;
    await tick();
    if (field.type === "relation" && !field.multiple) current = task[field.field];
    else if (!editing) trigger?.focus({ preventScroll: true });
};
</script>


{#if field?.type === "relation" && !field.multiple}
    <select
        bind:this={control}
        class="field"
        aria-label={column}
        aria-invalid={!!error}
        title={error || value}
        bind:value={current}
        disabled={!store.pb.ready || store.pb.busy}
        onchange={event => save(event.currentTarget.value)}
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
            oncontextmenu={edit}
        >{value || "—"}</button>
    {/if}
    {#if editing}
        {#if field.multiple && trigger}
            <TaskMultiSelect
                anchor={trigger}
                label={column}
                {options}
                value={Array.isArray(current) ? current : []}
                busy={store.pb.busy}
                {error}
                onsave={save}
                onclose={close}
                oncancel={cancel}
            />
        {:else}
            <form class="editor" aria-label={column} aria-busy={store.pb.busy} onsubmit={event => {
                event.preventDefault();
                void save(draft);
            }}>
                <input
                    bind:this={control}
                    type={inputType}
                    aria-label={column}
                    value={draft}
                    oninput={event => draft = event.currentTarget.value}
                    onkeydown={escape}
                    step={field.type === "number" ? "any" : undefined}
                    required={field.type === "text"}
                    disabled={store.pb.busy}
                />
                <button type="submit" aria-label="Save" title="Save" disabled={store.pb.busy} onkeydown={escape}>✓</button>
                <button type="button" aria-label="Cancel" title="Cancel" disabled={store.pb.busy} onkeydown={escape} onclick={cancel}>✕</button>
            </form>
        {/if}
    {/if}
{:else}
    {value}
{/if}

{#if error && !field?.multiple}
    <FieldPopup anchor={control ?? trigger!} label={column} onclose={() => error = ""}>
        <span role="alert">{error}</span>
    </FieldPopup>
{/if}


<style lang="scss">
.field {
    width: 100%;
    overflow: hidden;
    text-align: start;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.editor {
    display: flex;
    gap: 0.25em;

    > input {
        flex: 1;
        min-width: 0;
    }
}
</style>
