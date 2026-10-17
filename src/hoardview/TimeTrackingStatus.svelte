<!-- #region TODO needs review -->

<script lang="ts">
    import { getPbStore, formatMs } from "../lib/datahoard/pbStore.svelte";

    const store = getPbStore();
    const activePeriod = $derived(store.activeTimePeriod);
    const taskLabel = $derived(store.tasksById.get(activePeriod?.task ?? "")?.label ?? "Unassigned");
    const title = $derived(store.error || taskLabel);
    const actionLabel = $derived(store.error ? "Retry" : activePeriod ? "Stop timer" : "Refresh");

    const message = $derived.by(() => {
        if (store.error) return store.error;
        if (!activePeriod) return store.ready ? "No timer running" : "Loading time history…";

        const durationLabel = formatMs(store.now - Date.parse(activePeriod.start));
        return `Tracking ${taskLabel} · ${durationLabel}`;
    });

    const handleAction = () => {
        const shouldStop = !store.error && activePeriod !== null;
        return store.run(async () => {
            await store.loadAll();
            if (shouldStop) await store.stopClock();
        });
    };
</script>

<div class="tracking-status">
    <span {title}>{message}</span>
    <button onclick={handleAction} disabled={store.busy}>{actionLabel}</button>
</div>

<style lang="scss">
    .tracking-status {
        flex-shrink: 0;

        display: flex;
        align-items: center;
        gap: 0.5rem;

        min-width: 0;
        height: 4rem;
    }

    span {
        flex: 1;

        min-width: 0;
        max-height: 4rem;
        overflow-y: auto;

        font-size: 0.85rem;
        overflow-wrap: anywhere;
    }

    button {
        min-width: 6em;
    }
</style>

<!-- #endregion -->