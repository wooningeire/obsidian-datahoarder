<!-- #region TODO needs review -->

<script lang="ts">
import { getPbStore, formatMs } from "./pbStore.svelte";

let { taskId, label, onToggle, compact = false }: {
    taskId?: string,
    label?: string,
    onToggle?: () => Promise<void>,
    compact?: boolean,
} = $props();

const store = getPbStore();

// Automatically tracks `store.now` because `totalTime` uses it internally
let totalMs = $derived(taskId ? store.totalTime(taskId) : 0);

let activePeriod = $derived(
    store.activeTimePeriod?.task === taskId ? store.activeTimePeriod : null,
);

// Session duration
let sessionMs = $derived(activePeriod ? store.now - new Date(activePeriod.start).getTime() : 0);
const taskLabel = $derived(label ?? store.tasksById.get(taskId ?? "")?.label ?? "task");
const buttonLabel = $derived(`${activePeriod ? "Stop" : "Start"} tracking ${taskLabel}`);
</script>


<task-clock>
    <button
        onclick={() => store.run(onToggle ?? (() => store.toggleClock(taskId!)))}
        disabled={!store.ready || store.busy || (!taskId && !onToggle)}
        aria-label={buttonLabel}
        title={buttonLabel}
    >
        {activePeriod ? "⏹" : "▶"}
    </button>

    <span title="Total tracked time">
        {formatMs(totalMs)}
        {#if !compact}
            <span class="session" class:inactive={!activePeriod}>(+{formatMs(sessionMs)})</span>
        {/if}
    </span>
</task-clock>

<style lang="scss">

    task-clock {
        display: flex;
        gap: 0.5em;
        align-items: center;

        white-space: nowrap;
        font-family: var(--font-monospace, monospace);
        font-variant-numeric: tabular-nums;
	    font-size: 0.85em;
    }

    .session {
        color: oklch(0.65 0 0);
        font-size: 0.9em;
        margin-left: 0.25rem;
    }

    .inactive {
        visibility: hidden;
    }
</style>

<!-- #endregion -->