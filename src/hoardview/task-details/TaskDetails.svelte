<script lang="ts">
	import { HoardViewStore } from "hoardview/HoardViewStore.svelte";
import type { TFile } from "obsidian";
import TaskClock from "../../lib/datahoard/TaskClock.svelte";
import TimeHistory from "./TimeHistory.svelte";

let {
    task,
}: {
    task: TFile
} = $props();

const store = HoardViewStore.use();

const parentTasks = $derived.by(() => {
    const parentTasks: TFile[] = [];

    let current: TFile | null = task;
    while (current !== null) {
        parentTasks.push(current);
        current = store.taskGraph.taskParents.get(current)![0] ?? null;
    }

    return parentTasks;
});
</script>

<h2>{task.name}</h2>
<TaskClock taskId={store.taskId(task)} label={task.basename} onToggle={() => store.toggleClock(task)} />
<TimeHistory {task} />

<h3>Ancestry</h3>

<task-ancestry-list>
    {#each parentTasks as parentTask}
        <task-ancestry-entry>
            {parentTask.name}
        </task-ancestry-entry>
    {/each}
</task-ancestry-list>


<style lang="scss">
task-ancestry-list {
    display: flex;
    flex-direction: column;
}
</style>
