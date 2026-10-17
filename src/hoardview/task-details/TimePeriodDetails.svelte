<!-- #region TODO needs review -->

<script lang="ts">
    import { HoardViewStore } from "../HoardViewStore.svelte";
    import { formatMs } from "../../lib/datahoard/pbStore.svelte";

    const store = HoardViewStore.use();
    const period = $derived(store.pb.timePeriods.find(candidate =>
        candidate.id === store.selectedPeriodId,
    ));
</script>

{#if period}
    <h2>{store.labelForTask(period.task)}</h2>
    <p>{new Date(period.start).toLocaleString()} → {period.end ? new Date(period.end).toLocaleString() : "Running"}</p>
    <p>Duration: {formatMs((period.end ? Date.parse(period.end) : store.pb.now) - Date.parse(period.start))}</p>
    {#if !period.task}
        <p>This session has no task attached.</p>
    {/if}
{/if}

<style lang="scss">
    h2 {
        margin: 0 0 0.5rem;

        font-size: 1.1rem;
    }

    p {
        font-size: 0.85rem;
    }
</style>

<!-- #endregion -->