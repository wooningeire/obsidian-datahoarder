<script lang="ts">
import { HoardViewStore } from "./HoardViewStore.svelte";

const store = HoardViewStore.use();
let label = $state("");
let submitting = $state(false);
let error = $state("");

const submit = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();
    if (store.pb.busy || !label.trim()) return;

    submitting = true;
    error = "";
    await store.pb.run(async () => {
        await store.createTask({ label: label.trim() });
        label = "";
    });
    error = store.pb.error;
    submitting = false;
};
</script>

<form onsubmit={submit} aria-label="Create task" aria-busy={submitting}>
    <label>
        <span>Task name</span>
        <input bind:value={label} disabled={submitting} required />
    </label>
    <button type="submit" disabled={!store.pb.ready || store.pb.busy || !label.trim()}>
        {submitting ? "Creating…" : "Create task"}
    </button>
    <p role="status">{error}</p>
</form>
