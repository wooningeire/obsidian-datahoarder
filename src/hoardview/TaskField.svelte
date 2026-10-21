<script lang="ts">
import { tick } from "svelte";
import type { Task } from "../lib/pb";
import { toDatetimeLocal } from "../lib/datahoard/pbStore.svelte";
import { taskFields } from "../collections/tasks";
import { HoardViewStore } from "./HoardViewStore.svelte";
import Popover from "../components/Popover.svelte";
import EditPopover from "../components/EditPopover.svelte";
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

const edit = (event: MouseEvent): void => {
    event.preventDefault();
    draft = field?.type === "date" ? toDatetimeLocal(String(current ?? "")) : String(current ?? "");
    error = "";
    editing = true;
};

const focus = (): void => {
    control?.focus({ preventScroll: true });
    if (field?.type === "text" && control instanceof HTMLInputElement) control.select();
};

const cancel = async (): Promise<void> => {
    if (store.pb.busy) return;
    close();
    await tick();
    trigger?.focus({ preventScroll: true });
};

const save = async (next: string | Set<string>): Promise<void> => {
    if (!field || store.pb.busy) return;
    error = "";
    await store.pb.run(async () => {
        let value: string | number | Set<string> = next;
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
    <button
        bind:this={trigger}
        class="field"
        type="button"
        aria-label={column}
        aria-expanded={editing}
        title={value}
        disabled={!store.pb.ready || store.pb.busy}
        onclick={edit}
        oncontextmenu={edit}
    >{value || "—"}</button>
    {#if editing && trigger}
        {#if field.multiple}
            <TaskMultiSelect
                anchor={trigger}
                label={column}
                {options}
                value={Array.isArray(current) ? current : []}
                busy={store.pb.busy}
                {error}
                onSave={save}
                onClose={close}
                onCancel={cancel}
            />
        {:else}
            <EditPopover
                anchor={trigger}
                label={column}
                busy={store.pb.busy}
                {error}
                onSave={() => { void save(draft); }}
                onClose={close}
                onCancel={cancel}
                onOpen={focus}
            >
                <input
                    bind:this={control}
                    type={inputType}
                    aria-label={column}
                    value={draft}
                    oninput={event => draft = event.currentTarget.value}
                    step={field.type === "number" ? "any" : undefined}
                    required={field.type === "text"}
                    disabled={store.pb.busy}
                />
            </EditPopover>
        {/if}
    {/if}
{:else}
    {value}
{/if}

{#if error && field?.type === "relation" && !field.multiple}
    <Popover active anchor={control} label={column} onClose={() => error = ""}>
        <span role="alert">{error}</span>
    </Popover>
{/if}


<style lang="scss">
.field {
    width: 100%;
    overflow: hidden;
    text-align: start;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
