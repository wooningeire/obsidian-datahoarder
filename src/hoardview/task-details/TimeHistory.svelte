<!-- #region TODO needs review -->

<script lang="ts">
import { formatMs, getPbStore } from "../../lib/datahoard/pbStore.svelte";

let {
    taskId,
}: {
    taskId: string,
} = $props();
const store = getPbStore();
const periods = $derived(store.periodsByTask.get(taskId) ?? []);
const additionalTime = $derived((store.tasksById.get(taskId)?.n_extra_hours ?? 0) * 3_600_000);
</script>

<section aria-label="Time history" class="history">
    <h3>Time history</h3>
    {#if additionalTime}
        <p>Additional recorded time: {formatMs(additionalTime)}</p>
    {/if}
    <ol>
        {#each periods as period (period.id)}
            <li>
                <span>{new Date(period.start).toLocaleString()} → {period.end ? new Date(period.end).toLocaleString() : "Running"}</span>
                <strong>{formatMs((period.end ? Date.parse(period.end) : store.now) - Date.parse(period.start))}</strong>
            </li>
        {:else}
            <li>no time recorded</li>
        {/each}
    </ol>
</section>

<style lang="scss">
    h3 {
        margin: 0.75rem 0 0.5rem;

        font-size: 1rem;
    }

    ol {
        margin: 0;
        padding: 0;

        list-style: none;
    }

    li {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;

        padding: 0.35rem 0;

        font-size: 0.8rem;
    }

    strong {
        font-variant-numeric: tabular-nums;
    }
</style>

<!-- #endregion -->
