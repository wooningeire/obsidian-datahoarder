<script lang="ts">
    import type { Task } from "../../lib/pb";
import { HoardViewStore } from "../HoardViewStore.svelte";
import { taskAncestors } from "../taskGraph";
import TaskClock from "../../lib/datahoard/TaskClock.svelte";
import TaskNoteLink from "../TaskNoteLink.svelte";
import TimeHistory from "./TimeHistory.svelte";

let { task }: { task: Task } = $props();

const store = HoardViewStore.use();
const ancestors = $derived(taskAncestors(task.id, store.taskGraph));
</script>


<h2>{task.label || "(untitled)"}</h2>
<TaskNoteLink {task} />
<TaskClock taskId={task.id} />
<TimeHistory taskId={task.id} />

<h3>Ancestry</h3>

<task-ancestry-list>
    {#each ancestors as ancestor (ancestor.id)}
        <button onclick={() => store.selectTask(ancestor.id)}>
            {ancestor.label || "(untitled)"}
        </button>
    {/each}
</task-ancestry-list>

<h3>Children</h3>

<task-children-list>
    {#each store.taskGraph.childrenById.get(task.id) as child (child.id)}
        <button onclick={() => store.selectTask(child.id)}>
            {child.label || "(untitled)"}
        </button>
    {/each}
</task-children-list>

<style lang="scss">
task-ancestry-list {
    display: flex;
    flex-direction: column;
}
</style>
